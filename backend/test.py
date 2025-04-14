from diffusers import StableDiffusionImg2ImgPipeline
from PIL import Image
import torch

print("Initializing Pipe")
pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
    "CompVis/stable-diffusion-v1-4",
    torch_dtype=torch.float16
) #.to("cuda") # for gpu
print("Pipe done")

def generate_deepfakes(original_img_path, prompt="a surreal version"):
    print("Initializing Image")
    init_image = Image.open(original_img_path).convert("RGB").resize((512, 512))
    print("Generating Images through Pipe")
    images = pipe(prompt=prompt, image=init_image, strength=0.75, guidance_scale=7.5, num_images_per_prompt=8).images
    return images

img_path = "cat-sitting.jpg"

images = generate_deepfakes(img_path)

count = 0
for x in images:
    x.save(f"img_{count}")
    count += 1