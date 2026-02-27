"""
LIU Smart Campus Kiosk — app.py
Main Flask application entry point
Run: python app.py
"""

from flask import Flask, send_from_directory
from database import init_db
from routes.auth    import auth_bp
from routes.campus  import campus_bp
import os

# ── App setup ────────────────────────────────────────────────────
app = Flask(__name__, static_folder='static')
app.secret_key = os.environ.get('SECRET_KEY', 'liu-kiosk-secret-key-2024')

# ── Register blueprints ──────────────────────────────────────────
app.register_blueprint(auth_bp,   url_prefix='/api')
app.register_blueprint(campus_bp, url_prefix='/api')

# ── Serve frontend ───────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

# ── Start ────────────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    print("\n" + "═"*55)
    print("  LIU Smart Campus Kiosk — Backend Running")
    print("  Open: http://localhost:5000")
    print("═"*55 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
