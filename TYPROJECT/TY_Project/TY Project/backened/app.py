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
import google.generativeai as genai
from gemini_analysis import analyze_room_with_gemini, generate_room_inspiration
from markdown import markdown
from sqlalchemy.exc import IntegrityError

load_dotenv()

app = Flask(__name__)
CORS(app)

# Cloudinary config
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

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
    client_id = db.Column(db.String(200), nullable=True)  # frontend may send clientId
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
        # create user
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
        user_id = data.get("userId")  # optional

        if not image_url:
            return jsonify({"error": "No image URL provided"}), 400

        print("📸 Sending image to Gemini/HF for analysis:", image_url)
        analysis = analyze_room_with_gemini(image_url)
        print("✅ Gemini response:", analysis)

        if isinstance(analysis, dict):
            analysis_text = analysis.get("suggestions", "")
            analysis_payload = analysis
        else:
            analysis_text = analysis
            analysis_payload = {"text": analysis_text}

        # Convert markdown to clean HTML for frontend display
        analysis_html = markdown(analysis_text)

        # Save analysis record in DB
        record = RoomAnalysis(
            user_id=user_id,
            image_path=image_url,
            analysis_data=analysis_payload
        )
        db.session.add(record)
        db.session.commit()

        return jsonify({"analysis": analysis_html, "record_id": record.id}), 200

    except Exception as e:
        db.session.rollback()
        print("❌ Gemini analysis error:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/api/generate-room-image", methods=["POST"])
def generate_room_image():
    """Generate an AI-inspired version of the room based on suggestions"""
    try:
        data = request.get_json() or {}
        image_url = data.get("imageUrl")
        suggestions = data.get("suggestions")

        if not image_url or not suggestions:
            return jsonify({"error": "Missing imageUrl or suggestions"}), 400

        print("🪄 Generating inspirational image...")
        result = generate_room_inspiration(image_url, suggestions)

        generated_url = (
            result.get("generatedImageUrl") if isinstance(result, dict) else None
        ) or (result.get("url") if isinstance(result, dict) else None) or (result.get("image_url") if isinstance(result, dict) else None) or (result.get("data", {}).get("url") if isinstance(result, dict) else None)

        if not generated_url:
            print("⚠️ No valid URL found in AI result:", result)
            return jsonify({"error": "No image URL returned"}), 500

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
        
        print("🔍 Received data:", data)  # Debug log
        
        # Extract fields - try both camelCase and snake_case
        full_name = data.get('fullName') or data.get('full_name')
        contact_number = data.get('contactNumber') or data.get('contact_number')
        address = data.get('address')
        product_name = data.get('productName') or data.get('product_name')
        client_id = data.get('clientId') or data.get('client_id')
        message = data.get('message', '')
        
        print(f"📋 Extracted - Name: {full_name}, Phone: {contact_number}, Address: {address}, Product: {product_name}, ClientID: {client_id}")
        
        # Validate required fields
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
            client_id=client_id,  # This is optional, can be None
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

# ==================== RUN ====================
if __name__ == "__main__":
    print("🚀 Starting Flask server at http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)