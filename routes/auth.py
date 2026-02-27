"""
LIU Smart Campus Kiosk — routes/auth.py
Authentication endpoints: login, logout, session check.
"""

from flask import Blueprint, jsonify, request, session
from database import get_student

auth_bp = Blueprint('auth', __name__)


# ── POST /api/login ──────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    student_id = str(data.get('student_id', '')).strip()

    # Basic validation
    if not student_id.isdigit() or len(student_id) != 8:
        return jsonify({
            'success': False,
            'error': 'Invalid ID format. Must be 8 digits.'
        }), 400

    student = get_student(student_id)

    if not student:
        return jsonify({
            'success': False,
            'error': 'Student ID not found. Please try again.'
        }), 404

    # Store in server-side session (Flask signs this with secret_key)
    session.permanent = True
    session['student_id']   = student['id']
    session['student_name'] = student['name']

    return jsonify({
        'success': True,
        'student': {
            'id':      student['id'],
            'name':    student['name'],
            'major':   student['major'],
            'year':    student['year'],
            'email':   student['email'],
        }
    })


# ── POST /api/logout ─────────────────────────────────────────────
@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})


# ── GET /api/session ─────────────────────────────────────────────
@auth_bp.route('/session', methods=['GET'])
def check_session():
    """Called on page load so the frontend can restore session state."""
    if 'student_id' in session:
        student = get_student(session['student_id'])
        if student:
            return jsonify({
                'logged_in': True,
                'student': {
                    'id':    student['id'],
                    'name':  student['name'],
                    'major': student['major'],
                    'year':  student['year'],
                    'email': student['email'],
                }
            })
    return jsonify({'logged_in': False})
