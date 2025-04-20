from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from generate import generate_deepfakes
import random
import os
from pathlib import Path


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

def calculate_grid_size(level):
    base_grid = 2 # grid starts at 2x2
    num_levels = 4 # every 4 levels, grid size increases by 1
    grid_size = base_grid + (level - 1) // num_levels
    
    total_images = grid_size * grid_size
    num_deepfakes = total_images - 1
    
    return grid_size, num_deepfakes

used_images = []

# create route for API
@app.post("/generate")
async def generate(level: int = 1):    
    # determine metrics of image generation (level for strength and # of deepfakes)
    grid_size, num_deepfakes = calculate_grid_size(level)
    # grab random image from images folder
    image_files = [f for f in os.listdir(IMAGES_DIR) if f.endswith(('.jpg', '.jpeg', '.png'))]
    if not image_files:
        raise Exception("No images found in the images directory")
        
    random_image = random.choice(image_files)
    # make sure image hasn't been used yet
    while random_image in used_images:
        if len(used_images) >= len(image_files):
            used_images.clear()  # Reset if we've used all images
        random_image = random.choice(image_files)
    used_images.append(random_image)

    # send to generate.py to generate deepfakes
    images = generate_deepfakes(str(IMAGES_DIR / random_image), strength=0.05, num_images=num_deepfakes)

    # create a list of tuples with (image, is_original) to track the original
    image_tuples = [(img, i == 0) for i, img in enumerate(images)]
    
    random.shuffle(image_tuples) # shuffle the tuples
    
    # Extract the shuffled images and find the original's new index
    shuffled_images = [img for img, _ in image_tuples]
    original_index = next(i for i, (_, is_original) in enumerate(image_tuples) if is_original)
    
    # return the images
    return {
        "grid_size": grid_size,
        "images": shuffled_images,
        "original_index": original_index
    }