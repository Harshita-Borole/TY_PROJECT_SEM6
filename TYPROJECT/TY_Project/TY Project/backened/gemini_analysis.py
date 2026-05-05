import requests
from PIL import Image
import base64
from io import BytesIO
import google.generativeai as genai
import os
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


def analyze_room_with_gemini(image_url):
    try:
        print("📸 Downloading image from Cloudinary...")
        response = requests.get(image_url)
        response.raise_for_status()
        image = Image.open(BytesIO(response.content))

        model = genai.GenerativeModel("models/gemini-2.5-flash")
        prompt = """
        Analyze this room image and suggest:
        1. Ideal color palette for walls
        2. Furniture style recommendations
        3. Lighting setup improvements
        4. Additional decor suggestions (plants, art, etc.)
        Give a short AI interior design summary.
        """

        result = model.generate_content([prompt, image])
        print("✅ Gemini response:", result.text)
        return {"suggestions": result.text}

    except Exception as e:
        print("❌ Gemini analysis error:", e)
        return {"error": str(e)}


def generate_room_inspiration(image_url, suggestions_text):
    """
    Generate an AI-based inspirational room image using Hugging Face Stable Diffusion.
    """
    try:
        print("🎨 Generating improved room image via Hugging Face...")

        prompt = f"""
        Redesign this room based on these interior design suggestions:
        {suggestions_text}

        Make it elegant, cozy, and realistic with good lighting and decor.
        """

        # the Hugging Face API endpoint 
        HF_API_URL = "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0"

        # Use the same key name you have in your .env
        headers = {"Authorization": f"Bearer {os.getenv('HF_API_KEY')}"}

        # Send the prompt to Hugging Face Inference API
        response = requests.post(HF_API_URL, headers=headers, json={"inputs": prompt})
        response.raise_for_status()

        # Convert raw bytes → Image
        image_data = BytesIO(response.content)
        image = Image.open(image_data)

        # Save temporarily as PNG before uploading
        temp_buffer = BytesIO()
        image.save(temp_buffer, format="PNG")
        temp_buffer.seek(0)

        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(temp_buffer, resource_type="image")
        inspired_image_url = upload_result["secure_url"]

        print("✅ Generated inspirational image:", inspired_image_url)
        return {"image_url": inspired_image_url}

    except Exception as e:
        print("❌ Image generation error:", e)
        return {"error": str(e)}
