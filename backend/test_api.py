import requests
import json
import base64
from PIL import Image
from io import BytesIO

def test_generate(level=1):
    url = f"http://localhost:8000/generate?level={level}"
    
    response = requests.post(url)
    
    if response.status_code == 200:
        print("Success!")
        data = response.json()
        print(f"Grid size: {data['grid_size']}")
        print(f"Number of images: {len(data['images'])}")
        
        # Save the first image as a test
        if data['images']:
            count = 1
            for img in data['images']:
                img_data = base64.b64decode(img)
                img = Image.open(BytesIO(img_data))
                img.save(f"fake_{count}.png")
                print(f"Saved image as fake_{count}.png")
                count += 1
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_generate(1) 