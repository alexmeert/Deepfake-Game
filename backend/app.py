from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from generate import generate_deepfakes
import random
import os
from pathlib import Path
from typing import Dict, Optional
import asyncio


# create app for API
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Get the absolute path to the images directory
IMAGES_DIR = Path(__file__).parent / "images"

# cache for preloaded levels
preloaded_levels: Dict[int, dict] = {}
preload_lock = asyncio.Lock()

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

        # Generate images for next level
        images = generate_deepfakes(str(IMAGES_DIR / random_image), strength=0.05, num_images=num_deepfakes)
        
        # Create tuples and shuffle
        image_tuples = [(img, i == 0) for i, img in enumerate(images)]
        random.shuffle(image_tuples)
        shuffled_images = [img for img, _ in image_tuples]
        original_index = next(i for i, (_, is_original) in enumerate(image_tuples) if is_original)
        
        # Store in cache
        preloaded_levels[level + 1] = {
            "grid_size": grid_size,
            "images": shuffled_images,
            "original_index": original_index
        }
        
        return preloaded_levels[level + 1]

# create route for API
@app.post("/generate")
async def generate(level: int = 1):    
    # Check if we have a preloaded version of this level
    if level in preloaded_levels:
        current_level = preloaded_levels.pop(level)
    else:
        # Generate current level
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

        images = generate_deepfakes(str(IMAGES_DIR / random_image), strength=0.05, num_images=num_deepfakes)
        
        image_tuples = [(img, i == 0) for i, img in enumerate(images)]
        random.shuffle(image_tuples)
        shuffled_images = [img for img, _ in image_tuples]
        original_index = next(i for i, (_, is_original) in enumerate(image_tuples) if is_original)
        
        current_level = {
            "grid_size": grid_size,
            "images": shuffled_images,
            "original_index": original_index
        }
    
    # Start preloading next level in the background
    asyncio.create_task(preload_next_level(level))
    
    return current_level