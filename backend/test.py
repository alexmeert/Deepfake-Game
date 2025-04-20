from diffusers import StableDiffusionImg2ImgPipeline
from PIL import Image
import torch

print("Initializing Pipe")
pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
    "CompVis/stable-diffusion-v1-4",
    torch_dtype=torch.float16
).to("cuda") # for gpu
print("Pipe done")

def generate_deepfakes(original_img_path, prompt="a photorealistic, highly detailed, professional photograph, 8k uhd, high quality, realistic lighting, sharp focus"):
    print("Initializing Image")
    init_image = Image.open(original_img_path)
    print("Generating Images through Pipe")
    images = pipe(
        prompt=prompt,
        image=init_image,
        strength=0.1,  # Lower strength for more realistic preservation
        guidance_scale=12,  # Higher guidance scale for better prompt adherence
        num_images_per_prompt=8,
        negative_prompt="blurry, low quality, unrealistic, cartoon, painting, drawing, illustration"  # Add negative prompt to avoid unrealistic elements
    ).images
    return images

img_path = "oshawott.jpg"

images = generate_deepfakes(img_path)

count = 0
for x in images:
    x.save(f"img_{count}.png")
    count += 1