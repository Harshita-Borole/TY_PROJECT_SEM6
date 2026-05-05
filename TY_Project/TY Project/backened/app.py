import json
import base64
from datetime import datetime
from uuid import uuid4
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from PIL import Image
from colorthief import ColorThief
import requests
import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv
#import google.generativeai as genai
#from google import genai
#from google.genai import types
from markdown import markdown
from sqlalchemy.exc import IntegrityError
import razorpay
import hmac
import hashlib
from flask import send_from_directory
from ai_engine import analyze_room_with_ai, generate_room_inspiration

load_dotenv()

app = Flask(__name__)
CORS(app)
from inspiration_routes import inspiration_bp
app.register_blueprint(inspiration_bp)

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@app.route("/api/proxy-image", methods=["GET"])
def proxy_image():
    try:
        image_url = request.args.get("url")
        if not image_url:
            return jsonify({"error": "No URL provided"}), 400

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        response = requests.get(image_url, headers=headers, timeout=60)

        if response.status_code == 200:
            from flask import Response
            return Response(
                response.content,
                mimetype=response.headers.get("Content-Type", "image/jpeg"),
                headers={"Access-Control-Allow-Origin": "*"}
            )
        else:
            return jsonify({"error": "Failed to fetch image"}), 500

    except Exception as e:
        print("❌ Proxy error:", e)
        return jsonify({"error": str(e)}), 500




# Razorpay
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_SECRET = os.getenv("RAZORPAY_SECRET")
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_SECRET))

# Cloudinary config
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)
if not RAZORPAY_KEY_ID or not RAZORPAY_SECRET:
    raise ValueError("Razorpay keys are missing in .env file")


# ==================== CONFIGURATION ====================
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")

# Define upload folder and max upload size
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Helper function for UUID generation
def gen_uuid():
    return str(uuid4())



# ==================== APP & DB CONFIG ====================
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Use a single sqlite file as described in your report
db_path = os.path.join(os.getcwd(), 'interior_design.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
print("Using DB at:", db_path)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-this')

db = SQLAlchemy(app)

# ==================== DATABASE MODELS ====================

class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    name = db.Column(db.String(120), nullable=True)
    email = db.Column(db.String(200), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    verified = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "client_id": self.id,
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "verified": self.verified,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Appointment(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_email = db.Column(db.String(200), nullable=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    time = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(100), nullable=True)
    message = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "date": self.date,
            "time": self.time,
            "type": self.type,
            "message": self.message,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class Contact(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='unread')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "message": self.message,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class Repair(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    full_name = db.Column(db.String(200), nullable=False)
    contact_number = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(500), nullable=False)
    product_name = db.Column(db.String(300), nullable=False)
    client_id = db.Column(db.String(200), nullable=True)
    message = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='pending')
    whatsapp_sent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "contact_number": self.contact_number,
            "address": self.address,
            "product_name": self.product_name,
            "client_id": self.client_id,
            "message": self.message,
            "status": self.status,
            "whatsapp_sent": self.whatsapp_sent,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class RoomAnalysis(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id = db.Column(db.String(36), nullable=True)
    image_path = db.Column(db.String(1000), nullable=False)
    analysis_data = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "image_path": self.image_path,
            "analysis_data": self.analysis_data,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# ----------------- Products (Home Decor) -----------------
class Product(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    image = db.Column(db.String(1000), nullable=False)
    length = db.Column(db.Float, nullable=False)
    width = db.Column(db.Float, nullable=False)
    height = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "image": self.image,
            "length": self.length,
            "width": self.width,
            "height": self.height,
            "description": self.description
        }

# Create DB tables
with app.app_context():
    db.create_all()

# ==================== ROUTES ====================

@app.route('/')
def home():
    return jsonify({"message": "Flask backend is running!", "status": "ok"})

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    return jsonify({'status': 'ok', 'message': 'Backend running', 'timestamp': datetime.utcnow().isoformat()}), 200

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"message": "pong", "status": "ok"}), 200

# ----------------- Auth -----------------
@app.route('/auth/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    print(f"🔐 Login attempt for: {email}")

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()
    if user:
        if check_password_hash(user.password, password):
            user_dict = user.to_dict()
            print(f"✅ Login successful! User data: {user_dict}")
            return jsonify({
                "token": "dummy_token",
                "user": user_dict
            }), 200
        print("❌ Invalid password")
        return jsonify({"message": "Invalid credentials"}), 401
    else:
        print(f"👤 Creating new user: {email}")
        hashed = generate_password_hash(password)
        new_user = User(email=email, password=hashed)
        try:
            db.session.add(new_user)
            db.session.commit()
            user_dict = new_user.to_dict()
            print(f"✅ New user created! User data: {user_dict}")
        except IntegrityError:
            db.session.rollback()
            print("❌ User creation failed - email conflict")
            return jsonify({"message": "User creation failed (email conflict)"}), 400

        return jsonify({
            "token": "dummy_token",
            "user": user_dict
        }), 201

# ----------------- Appointments -----------------
@app.route('/api/appointments', methods=['POST', 'OPTIONS'])
def create_appointment():
    if request.method == 'OPTIONS':
        return '', 200
    try:
        data = request.get_json() or {}
        required = ['name', 'email', 'phone', 'date', 'time', 'type']
        for field in required:
            if not data.get(field):
                return jsonify({'message': f'Missing field: {field}'}), 400

        appt = Appointment(
            name=data['name'],
            email=data['email'],
            phone=data['phone'],
            date=data['date'],
            time=data['time'],
            type=data.get('type'),
            message=data.get('message', '')
        )
        db.session.add(appt)
        db.session.commit()
        return jsonify({'message': 'Appointment booked successfully', 'appointment': appt.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        print("Error create_appointment:", e)
        return jsonify({'message': f'Error: {str(e)}'}), 500

@app.route('/api/appointments', methods=['GET'])
def get_appointments():
    try:
        appts = Appointment.query.order_by(Appointment.created_at.desc()).all()
        return jsonify({'appointments': [a.to_dict() for a in appts]}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/appointments/<appointment_id>', methods=['GET'])
def get_appointment(appointment_id):
    try:
        appointment = Appointment.query.get(appointment_id)
        if appointment:
            return jsonify(appointment.to_dict()), 200
        return jsonify({'message': 'Not found'}), 404
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/appointments/<appointment_id>', methods=['PUT'])
def update_appointment(appointment_id):
    try:
        data = request.get_json() or {}
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'message': 'Not found'}), 404

        appointment.name = data.get('name', appointment.name)
        appointment.email = data.get('email', appointment.email)
        appointment.phone = data.get('phone', appointment.phone)
        appointment.date = data.get('date', appointment.date)
        appointment.time = data.get('time', appointment.time)
        appointment.type = data.get('type', appointment.type)
        appointment.message = data.get('message', appointment.message)
        appointment.status = data.get('status', appointment.status)
        appointment.updated_at = datetime.utcnow()

        db.session.commit()
        return jsonify({'message': 'Updated', 'appointment': appointment.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/appointments/<appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    try:
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'message': 'Not found'}), 404
        db.session.delete(appointment)
        db.session.commit()
        return jsonify({'message': 'Deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# ----------------- Contact Messages -----------------
@app.route('/api/contact', methods=['POST', 'OPTIONS'])
def create_contact():
    if request.method == 'OPTIONS':
        return '', 200
    try:
        data = request.get_json() or {}
        required = ['name', 'email', 'message']
        for field in required:
            if not data.get(field):
                return jsonify({'message': f'Missing field: {field}'}), 400

        contact = Contact(
            name=data['name'],
            email=data['email'],
            message=data['message']
        )
        db.session.add(contact)
        db.session.commit()
        return jsonify({'message': 'Message sent successfully', 'contact': contact.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        print("Error create_contact:", e)
        return jsonify({'message': f'Error: {str(e)}'}), 500

@app.route('/api/contact', methods=['GET'])
def get_contacts():
    try:
        contacts = Contact.query.order_by(Contact.created_at.desc()).all()
        return jsonify({'contacts': [c.to_dict() for c in contacts]}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/contact/<contact_id>', methods=['GET'])
def get_contact(contact_id):
    try:
        contact = Contact.query.get(contact_id)
        if contact:
            return jsonify(contact.to_dict()), 200
        return jsonify({'message': 'Not found'}), 404
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/contact/<contact_id>', methods=['PUT'])
def update_contact(contact_id):
    try:
        data = request.get_json() or {}
        contact = Contact.query.get(contact_id)
        if not contact:
            return jsonify({'message': 'Not found'}), 404
        contact.status = data.get('status', contact.status)
        contact.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'message': 'Updated', 'contact': contact.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/contact/<contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    try:
        contact = Contact.query.get(contact_id)
        if not contact:
            return jsonify({'message': 'Not found'}), 404
        db.session.delete(contact)
        db.session.commit()
        return jsonify({'message': 'Deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# ----------------- Room Analysis -----------------
@app.route("/api/upload", methods=["POST"])
def upload_image():
    """Upload image to Cloudinary"""
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image file"}), 400

        file = request.files["image"]
        upload_result = cloudinary.uploader.upload(file)
        image_url = upload_result["secure_url"]

        return jsonify({"url": image_url})
    except Exception as e:
        print("❌ Upload error:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/api/analyze", methods=["POST"])
def analyze_image():
    try:
        data = request.get_json() or {}
        image_url = data.get("imageUrl")
        user_id = data.get("userId")

        if not image_url:
            return jsonify({"error": "No image URL provided"}), 400

        print("📸 Sending image to LOCAL AI (LLAVA):", image_url)

        analysis = analyze_room_with_ai(image_url)

        print("✅ Gemini response:", analysis)

        # -------- HANDLE RESPONSE --------
        if isinstance(analysis, dict):
            # Try multiple possible keys
            analysis_text = (
                analysis.get("suggestions") or
                analysis.get("text") or
                analysis.get("description") or
                str(analysis)
            )
            analysis_payload = analysis
        else:
            analysis_text = analysis
            analysis_payload = {"text": analysis_text}

        # -------- CONVERT TO HTML (for UI) --------
        analysis_html = markdown(analysis_text)

        # -------- SAVE TO DB --------
        record = RoomAnalysis(
            user_id=user_id,
            image_path=image_url,
            analysis_data=analysis_payload
        )
        db.session.add(record)
        db.session.commit()

        # -------- RETURN RESPONSE --------
        return jsonify({
            "analysis": analysis_html,   # for UI display
            "raw_text": analysis_text,  # ✅ IMPORTANT for image generation
            "record_id": record.id
        }), 200

    except Exception as e:
        db.session.rollback()
        print("❌ Gemini analysis error:", e)
        return jsonify({"error": str(e)}), 500
@app.route("/api/generate-room-image", methods=["POST"])
def generate_room_image():
    try:
        data = request.get_json() or {}
        image_url = data.get("imageUrl")
        suggestions = data.get("suggestions")

        if not image_url or not suggestions:
            return jsonify({"error": "Missing imageUrl or suggestions"}), 400

        # 🔍 DEBUG (VERY IMPORTANT)
        print("🧠 Suggestions received:", suggestions)

        print("🪄 Generating inspirational image...")
        result = generate_room_inspiration(image_url, suggestions)

        print("🧾 AI result:", result)

        generated_url = (
            result.get("generatedImageUrl") if isinstance(result, dict) else None
        ) or (
            result.get("url") if isinstance(result, dict) else None
        ) or (
            result.get("image_url") if isinstance(result, dict) else None
        ) or (
            result.get("data", {}).get("url") if isinstance(result, dict) else None
        )

        if not generated_url:
            print("⚠️ No valid URL found in AI result:", result)
            return jsonify({"error": "No image URL returned"}), 500

        print("✅ Generated Image URL:", generated_url)

        return jsonify({"generatedImageUrl": generated_url})

    except Exception as e:
        print("❌ Image generation route error:", e)
        return jsonify({"error": str(e)}), 500

# ----------------- Repairs & Maintenance -----------------
@app.route('/api/repairs', methods=['POST', 'OPTIONS'])
def create_repair():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json() or {}

        print("🔍 Received data:", data)

        full_name = data.get('fullName') or data.get('full_name')
        contact_number = data.get('contactNumber') or data.get('contact_number')
        address = data.get('address')
        product_name = data.get('productName') or data.get('product_name')
        client_id = data.get('clientId') or data.get('client_id')
        message = data.get('message', '')

        if not full_name:
            return jsonify({'error': 'Full name is required'}), 400
        if not contact_number:
            return jsonify({'error': 'Contact number is required'}), 400
        if not address:
            return jsonify({'error': 'Address is required'}), 400
        if not product_name:
            return jsonify({'error': 'Product name is required'}), 400

        repair = Repair(
            full_name=full_name,
            contact_number=contact_number,
            address=address,
            product_name=product_name,
            client_id=client_id,
            message=message,
            status='pending',
            whatsapp_sent=False
        )

        db.session.add(repair)
        db.session.commit()

        print("✅ Repair request saved:", repair.to_dict())

        return jsonify({
            'status': 'success',
            'message': 'Repair request submitted successfully. Our team will contact you on WhatsApp soon.',
            'repair': repair.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"❌ Error in create_repair: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/repairs', methods=['GET'])
def get_repairs():
    try:
        repairs = Repair.query.order_by(Repair.created_at.desc()).all()
        return jsonify({'status': 'success', 'repairs': [r.to_dict() for r in repairs], 'count': len(repairs)}), 200
    except Exception as e:
        print(f"❌ Error getting repairs: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/repairs/<repair_id>', methods=['GET'])
def get_repair(repair_id):
    try:
        repair = Repair.query.get(repair_id)
        if repair:
            return jsonify({'status': 'success', 'repair': repair.to_dict()}), 200
        return jsonify({'error': 'Repair request not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/repairs/<repair_id>', methods=['PUT'])
def update_repair(repair_id):
    try:
        data = request.get_json() or {}
        repair = Repair.query.get(repair_id)
        if not repair:
            return jsonify({'error': 'Repair request not found'}), 404

        repair.status = data.get('status', repair.status)
        repair.whatsapp_sent = data.get('whatsapp_sent', repair.whatsapp_sent)
        repair.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({'status': 'success', 'message': 'Repair request updated', 'repair': repair.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/repairs/<repair_id>', methods=['DELETE'])
def delete_repair(repair_id):
    try:
        repair = Repair.query.get(repair_id)
        if not repair:
            return jsonify({'error': 'Repair request not found'}), 404
        db.session.delete(repair)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Repair request deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ---------------------- Payment -------------------------- #
@app.route("/api/create-order", methods=["POST"])
def create_order():
    try:
        data = request.get_json()
        amount = data.get("amount")

        if not amount:
            return jsonify({"error": "Amount is required"}), 400

        order = razorpay_client.order.create({
            "amount": int(float(amount) * 100),
            "currency": "INR",
            "receipt": f"receipt_{uuid4()}",
            "payment_capture": 1
        })

        return jsonify({
            "success": True,
            "order": order,
            "key": RAZORPAY_KEY_ID
        })

    except Exception as e:
        print("❌ Razorpay order error:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/verify-payment", methods=["POST"])
def verify_payment():
    try:
        data = request.get_json()

        razorpay_order_id = data.get("razorpay_order_id")
        razorpay_payment_id = data.get("razorpay_payment_id")
        razorpay_signature = data.get("razorpay_signature")

        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
            return jsonify({"error": "Missing payment parameters"}), 400

        body = razorpay_order_id + "|" + razorpay_payment_id

        expected_signature = hmac.new(
            bytes(RAZORPAY_SECRET, 'utf-8'),
            bytes(body, 'utf-8'),
            hashlib.sha256
        ).hexdigest()

        if expected_signature == razorpay_signature:
            return jsonify({"success": True, "message": "Payment verified successfully"})
        else:
            return jsonify({"success": False, "message": "Invalid signature"}), 400

    except Exception as e:
        print("❌ Payment verification error:", e)
        return jsonify({"error": str(e)}), 500

# ------------------- ADD PRODUCT --------------------------------- #
@app.route('/api/products', methods=['POST'])
def add_product():
    try:
        data = request.get_json()

        product = Product(
            name=data.get('name'),
            category=data.get('category'),
            image=data.get('image'),
            length=float(data.get('length')),
            width=float(data.get('width')),
            height=float(data.get('height')),
            description=data.get('description')
        )

        db.session.add(product)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Product added successfully",
            "product": product.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print("❌ Add product error:", e)
        return jsonify({"error": str(e)}), 500

# ---------------------------- GET PRODUCTS ----------------------------- #
@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        products = Product.query.all()
        return jsonify({
            "success": True,
            "products": [p.to_dict() for p in products]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/products/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({"error": "Product not found"}), 404
        db.session.delete(product)
        db.session.commit()
        return jsonify({"success": True, "message": "Product deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# --------------------- RECOMMENDATION ---------------------------- #
# --------------------- RECOMMENDATION ---------------------------- #
@app.route("/api/recommend", methods=["POST"])
def recommend_products():
    try:
        data = request.get_json() or {}

        # ------------------- Parse Room Data -------------------
        try:
            room_length = float(data.get("length", 0))
            room_width = float(data.get("width", 0))
            room_height = float(data.get("height", 0))
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid room dimensions"}), 400

        room_type = data.get("type")

        if not room_type:
            return jsonify({"error": "Room type is required"}), 400

        room_type = room_type.lower().strip()

        # ------------------- Validate -------------------
        if room_length <= 0 or room_width <= 0 or room_height <= 0:
            return jsonify({"error": "Room dimensions must be positive numbers"}), 400

        print(f"📏 Room received: {room_length} x {room_width} x {room_height} cm")
        print(f"🏠 Room type: {room_type}")

        # ------------------- Fetch Products -------------------
        products = Product.query.all()

        if not products:
            return jsonify({
                "room": {
                    "length": room_length,
                    "width": room_width,
                    "height": room_height,
                    "type": room_type
                },
                "recommended": [],
                "total_products": 0,
                "recommended_count": 0,
                "message": "No products found in database"
            }), 200

        recommended = []
        debug_info = []

        # ------------------- Recommendation Logic -------------------
        for p in products:
            try:
                prod_length = float(p.length)
                prod_width = float(p.width)
                prod_height = float(p.height)

                fits_length = prod_length <= room_length
                fits_width = prod_width <= room_width
                fits_height = prod_height <= room_height

                # Category must match room type
                category_match = p.category.lower().strip() == room_type

                fits = (
                    fits_length
                    and fits_width
                    and fits_height
                    and category_match
                )

                debug_info.append({
                    "name": p.name,
                    "category": p.category,
                    "dimensions": f"{prod_length}x{prod_width}x{prod_height}",
                    "fits_length": fits_length,
                    "fits_width": fits_width,
                    "fits_height": fits_height,
                    "category_match": category_match,
                    "recommended": fits
                })

                print(
                    f"{'✅' if fits else '❌'} {p.name} [{p.category}] "
                    f"| L:{fits_length} W:{fits_width} "
                    f"H:{fits_height} C:{category_match}"
                )

                if fits:
                    recommended.append(p.to_dict())

            except Exception as e:
                print(f"⚠️ Skipping product '{p.name}': {e}")
                continue

        print(f"🎯 Final Recommendation: {len(recommended)} out of {len(products)} products fit")

        return jsonify({
            "room": {
                "length": room_length,
                "width": room_width,
                "height": room_height,
                "type": room_type
            },
            "total_products": len(products),
            "recommended_count": len(recommended),
            "recommended": recommended,
            "debug": debug_info
        }), 200

    except Exception as e:
        print("❌ Recommendation error:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/search-decor", methods=["GET"])
def search_decor():
    try:
        query = request.args.get("q", "")

        if not query:
            return jsonify({"results": []}), 200

        UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")

        url = "https://api.unsplash.com/search/photos"

        params = {
            "query": query + " interior decor furniture",
            "per_page": 12,
            "client_id": UNSPLASH_ACCESS_KEY
        }

        res = requests.get(url, params=params)
        data = res.json()

        results = []

        for item in data.get("results", []):
            results.append({
                "id": item["id"],
                "displayName": item["alt_description"] or query,
                "image": item["urls"]["small"]
            })

        return jsonify({"results": results}), 200

    except Exception as e:
        print("❌ Unsplash error:", e)
        return jsonify({"error": str(e)}), 500


        

# ==================== RUN ====================
if __name__ == "__main__":
    print("🚀 Starting Flask server at http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)