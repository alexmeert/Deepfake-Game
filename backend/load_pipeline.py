from diffusers import StableDiffusionImg2ImgPipeline
import torch


def initialize_pipeline():
    pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
        "CompVis/stable-diffusion-v1-4",
        torch_dtype=torch.float16
    ).to("cuda") # for gpu

    return pipe