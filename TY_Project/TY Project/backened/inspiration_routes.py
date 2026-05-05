from flask import Blueprint, request, jsonify, Response
import os, uuid, json, base64
import requests
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

inspiration_bp = Blueprint("inspiration_bp", __name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# =========================
# 🎨 POLLINATIONS IMAGE GENERATION
# =========================
def generate_image(prompt):
    try:
        truncated = prompt.strip()[:400]
        clean_prompt = " ".join(truncated.split())
        encoded = urllib.parse.quote(clean_prompt, safe="")
        url = f"https://image.pollinations.ai/prompt/{encoded}"
        print("🎨 Pollinations URL:", url)
        return url
    except Exception as e:
        print("❌ Pollinations error:", e)
        return None


# =========================
# 🖼️ PROXY ROUTE (fixes CORS)
# =========================
@inspiration_bp.route("/api/proxy-image")
def proxy_image():
    try:
        image_url = request.args.get("url")
        if not image_url:
            return jsonify({"error": "No URL provided"}), 400

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        res = requests.get(image_url, headers=headers, timeout=60)

        if res.status_code == 200:
            return Response(
                res.content,
                mimetype=res.headers.get("Content-Type", "image/jpeg"),
                headers={"Access-Control-Allow-Origin": "*"}
            )
        else:
            return jsonify({"error": "Failed to fetch image"}), 500

    except Exception as e:
        print("❌ Proxy error:", e)
        return jsonify({"error": str(e)}), 500


# =========================
# 🚀 MAIN API
# =========================
@inspiration_bp.route("/api/generate-inspiration", methods=["POST"])
def generate_inspiration():
    try:
        if "roomImage" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files["roomImage"]
        selected_items = json.loads(request.form.get("selectedItems", "[]"))

        # Save image
        path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}.jpg")
        file.save(path)
        print("📸 Saved image:", path)

        # Build prompt from selected decor items only
        items_str = ", ".join(selected_items[:6]) if selected_items else "modern luxury furniture"

        prompt = (
            f"Ultra realistic luxury interior design room, cinematic lighting, 4K architectural render. "
            f"The room contains: {items_str}. "
            f"Modern, elegant, aesthetic, highly detailed, professional interior photography."
        )

        print("📝 Prompt:", prompt)

        # Generate image via Pollinations
        image_url = generate_image(prompt)

        if not image_url:
            return jsonify({"error": "Image generation failed"}), 500

        # Return as proxy URL to avoid CORS issues
        proxy_url = f"http://localhost:5000/api/proxy-image?url={urllib.parse.quote(image_url, safe='')}"

        return jsonify({
            "generatedImageUrl": proxy_url
        })

    except Exception as e:
        print("❌ ERROR:", e)
        return jsonify({"error": str(e)}), 500


# =========================
# 🌐 UNSPLASH SEARCH
# =========================
@inspiration_bp.route("/api/search-decor")
def search_decor():
    try:
        query = request.args.get("q", "")
        UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")

        res = requests.get(
            "https://api.unsplash.com/search/photos",
            params={
                "query": f"{query} interior decor furniture",
                "per_page": 12,
                "client_id": UNSPLASH_ACCESS_KEY
            }
        )

        data = res.json()

        results = [
            {
                "id": item["id"],
                "displayName": item.get("alt_description") or query,
                "image": item["urls"]["small"]
            }
            for item in data.get("results", [])
        ]

        return jsonify({"results": results})

    except Exception as e:
        return jsonify({"results": [], "error": str(e)})