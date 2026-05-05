import requests
import base64
import urllib.parse


def analyze_room_with_ai(image_url):
    try:
        print("📸 Loading image:", image_url)

        response = requests.get(image_url)
        response.raise_for_status()
        image_bytes = response.content

        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        prompt = """
You are a senior luxury interior designer.

Analyze this room image and give:
1. Wall color suggestions
2. Furniture style improvements
3. Lighting recommendations
4. Decor additions
5. Final redesign concept
"""

        res = requests.post(
            "http://localhost:11434/api/chat",
            json={
                "model": "llava",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt,
                        "images": [image_base64]
                    }
                ],
                "stream": False
            }
        )

        result = res.json()["message"]["content"]
        print("🔥 AI OUTPUT:", result)
        return {"suggestions": result}

    except Exception as e:
        print("❌ AI error:", e)
        return {"suggestions": "analysis failed", "error": str(e)}


def generate_room_inspiration(image_url, suggestions_text):
    try:
        print("🎨 Generating room image...")

        if not suggestions_text:
            return {"error": "No suggestions provided"}

        # Truncate to avoid URL length limits in browsers
        truncated = suggestions_text[:300].strip()

        prompt = (
            f"Ultra realistic luxury interior design, cinematic lighting, "
            f"4K architecture render. {truncated}. "
            f"Modern, elegant, minimal, aesthetic, highly detailed."
        )

        clean_prompt = " ".join(prompt.split())
        encoded_prompt = urllib.parse.quote(clean_prompt, safe="")

        generated_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}"

        print("✅ Generated Image URL:", generated_url)

        return {"generatedImageUrl": generated_url}

    except Exception as e:
        print("❌ Image generation error:", str(e))
        return {"error": str(e)}