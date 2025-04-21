from PIL import Image
from load_pipeline import initialize_pipeline
import random
import base64
from io import BytesIO

# initialize pipeline
pipe = initialize_pipeline()

# multiple prompts to switch some things up 
prompts = [
        "super realistic, 8k uhd, high quality, realistic lighting, sharp focus",
        "photo realistic, high quality, realistic lighting",
        "sketch high quality, sharp focus, low light",
        "professional photography, high quality, realistic lighting",
        "cinematic, high quality, realistic lighting",
        "artistic, high quality, sharp lighting",
        "abstract, high quality, realistic lighting",
        "minimalist, high quality, low lighting",
        "photo realistic, high quality, realistic lighting",
        "hyper realistic, 8k resolution, sharp focus, full depth of field, natural lighting",
        "studio photography style, crisp details, ultra high definition, neutral background",
        "realistic tone mapping, no blur, full clarity, professional camera settings",
        "dslr quality, full-body focus, realistic shadows, ultra resolution",
        "real-life capture, zero motion blur, detailed textures, lifelike colors",
        "portrait mode, natural ambient lighting, no background blur, ultra definition",
        "close-up with full detail, hyperrealism, high contrast lighting, every pore visible",
        "outdoor lighting, clean background, realistic HDR balance, sharp and clear",
        "modern lens effect, high aperture sharpness, cinematic resolution",
        "super clean lighting, zero noise, high clarity, deep focus field",
        "studio lighting, well-lit subject, true-to-life skin texture, sharp environment",
        "photo taken on full-frame camera, sharp corners, hyper crisp, vibrant lighting",
        "modeling agency photo, vivid details, realistic tone, magazine-ready",
        "ultra defined image, daylight clarity, every detail preserved",
        "sharpness emphasized, crystal clear capture, cinematic grading",
        "neutral tone, 4k clarity, no post-processing, natural scene",
        "bright and sharp, lifelike texture, photographic lighting balance",
        "zero artifacts, sharp rendering, high resolution, perfect lighting balance",
        "true-to-life photography, authentic realism, full-body shot clarity",
        "natural ambient light, professional grade photo, maximum sharpness"
    ]

def image_to_base64(image):
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

def generate_deepfakes(origin_image_path, strength, num_images=3):
    random_prompts = random.sample(prompts, num_images)  # initialize random prompts to switch some things up
    original_image = Image.open(origin_image_path).resize((512, 512))# gather original image

    # generate deepfakes based on images, determine about to generate + what strength
    deepfakes = []
    for i, prompt in enumerate(random_prompts):
        # generate one image per prompt
        output = pipe(
            prompt=prompt,
            image=original_image,
            strength=strength,
            guidance_scale=12,
            negative_prompt="blurry, low quality, unrealistic, cartoon, painting, drawing, illustration",
            num_images_per_prompt=1  
        )
        
        # get the first (and only) image from the output
        generated_image = output.images[0]
        deepfakes.append(generated_image)

    all_images = [original_image] + deepfakes
    # convert all images to base64
    base64_images = [image_to_base64(img) for img in all_images]
    
    # return generated images
    return base64_images