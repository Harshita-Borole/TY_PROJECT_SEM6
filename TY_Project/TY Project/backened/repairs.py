from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)

DB_PATH = "repairs.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS repair_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT,
            contact_number TEXT,
            address TEXT,
            product_name TEXT,
            client_id TEXT,
            message TEXT,
            created_at TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

@app.route("/api/repairs", methods=["POST"])
def repairs():
    data = request.json
    print("Received repair request:", data)

    required_fields = ["fullName", "contactNumber", "address", "productName", "clientId", "message"]
    for field in required_fields:
        if field not in data or not data[field]:
            print(f"❌ Missing field: {field}")
            return jsonify({"error": f"Missing field: {field}"}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""
            INSERT INTO repair_requests (full_name, contact_number, address, product_name, client_id, message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            data["fullName"],
            data["contactNumber"],
            data["address"],
            data["productName"],
            data["clientId"],
            data["message"],
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))
        conn.commit()
        conn.close()
        print("✅ Data inserted successfully!")
        return jsonify({"status": "success"}), 200
    except Exception as e:
        import traceback
        print("❌ Error inserting data:", e)
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
