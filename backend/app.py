from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from generate import generate_deepfakes
import random
import os
from pathlib import Path
from typing import Dict, Optional
import asyncio
from pydantic import BaseModel
from db import Database

# image strength
image_strength = 0.15

# create app for API
app = FastAPI()
db = Database()
security = HTTPBearer()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# get the absolute path to the images directory
IMAGES_DIR = Path(__file__).parent / "images"

# cache for preloaded levels
preloaded_levels: Dict[int, dict] = {}
preload_lock = asyncio.Lock()

# pydantic models for request/response
class UserRegistration(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class GameStats(BaseModel):
    score: int
    level: int
    is_correct: bool


# authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        if not token:
            raise HTTPException(status_code=401, detail="No authentication token provided")
        
        # extract username from bearer token
        username = token
        if username.startswith('Bearer '):
            username = username[7:]  # Remove 'Bearer ' prefix
        
        # verify user exists
        if not db.verify_user(username, ""):
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        return username
    except Exception as e:
        print(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")


def calculate_grid_size(level):
    base_grid = 2 # grid starts at 2x2
    num_levels = 4 # every 4 levels, grid size increases by 1
    grid_size = base_grid + (level - 1) // num_levels
    
    total_images = grid_size * grid_size
    num_deepfakes = total_images - 1
    
    return grid_size, num_deepfakes

used_images = []

async def preload_next_level(level: int):
    """Preload the next level's images in the background"""
    async with preload_lock:
        if level + 1 in preloaded_levels:
            return preloaded_levels[level + 1]
        
        grid_size, num_deepfakes = calculate_grid_size(level + 1)
        image_files = [f for f in os.listdir(IMAGES_DIR) if f.endswith(('.jpg', '.jpeg', '.png'))]
        
        if not image_files:
            raise Exception("No images found in the images directory")
            
        random_image = random.choice(image_files)
        while random_image in used_images:
            if len(used_images) >= len(image_files):
                used_images.clear()
            random_image = random.choice(image_files)
        used_images.append(random_image)

        images = generate_deepfakes(str(IMAGES_DIR / random_image), strength=image_strength, num_images=num_deepfakes)
        
        image_tuples = [(img, i == 0) for i, img in enumerate(images)]
        random.shuffle(image_tuples)
        shuffled_images = [img for img, _ in image_tuples]
        original_index = next(i for i, (_, is_original) in enumerate(image_tuples) if is_original)
        
        preloaded_levels[level + 1] = {
            "grid_size": grid_size,
            "images": shuffled_images,
            "original_index": original_index
        }
        
        return preloaded_levels[level + 1]

# create route for API
@app.post("/generate")
async def generate(level: int = 1):    
    # check if we have a preloaded version of this level
    if level in preloaded_levels:
        current_level = preloaded_levels.pop(level)
    else:
        # generate current level
        grid_size, num_deepfakes = calculate_grid_size(level)
        image_files = [f for f in os.listdir(IMAGES_DIR) if f.endswith(('.jpg', '.jpeg', '.png'))]
        
        if not image_files:
            raise Exception("No images found in the images directory")
            
        random_image = random.choice(image_files)
        while random_image in used_images:
            if len(used_images) >= len(image_files):
                used_images.clear()
            random_image = random.choice(image_files)
        used_images.append(random_image)

        images = generate_deepfakes(str(IMAGES_DIR / random_image), strength=image_strength, num_images=num_deepfakes)
        
        image_tuples = [(img, i == 0) for i, img in enumerate(images)]
        random.shuffle(image_tuples)
        shuffled_images = [img for img, _ in image_tuples]
        original_index = next(i for i, (_, is_original) in enumerate(image_tuples) if is_original)
        
        current_level = {
            "grid_size": grid_size,
            "images": shuffled_images,
            "original_index": original_index
        }
    
    # start preloading next level in the background
    asyncio.create_task(preload_next_level(level))
    
    return current_level

@app.post("/register")
async def register(user: UserRegistration):
    success = db.create_user(user.username, user.password)
    if not success:
        raise HTTPException(status_code=409, detail="Username already exists")
    return {"message": "User created successfully"}


@app.post("/login")
async def login(user: UserLogin):
    try:
        if not user.username or not user.password:
            raise HTTPException(status_code=400, detail="Username and password are required")
            
        if db.verify_user(user.username, user.password):
            return {"message": "Login successful", "username": user.username}
        raise HTTPException(status_code=401, detail="Invalid username or password")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error for user {user.username}: {e}")
        raise HTTPException(status_code=500, detail="An error occurred during login")


@app.post("/update-stats")
async def update_stats(stats: GameStats, username: str = Depends(get_current_user)):
    try:
        print(f"Updating stats for {username}: score={stats.score}, level={stats.level}, correct={stats.is_correct}")
        success = db.update_user_stats(username, stats.score, stats.level, stats.is_correct)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update stats")
        
        user_stats = db.get_user_stats(username)
        if not user_stats:
            raise HTTPException(status_code=500, detail="Failed to verify stats update")
            
        print(f"Stats verified: {user_stats}")
        return {"message": "Stats updated successfully", "stats": user_stats}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in update-stats endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/leaderboard")
async def get_leaderboard(username: Optional[str] = None):
    return db.get_leaderboard(username)