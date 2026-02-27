"""
LIU Smart Campus Kiosk — routes/campus.py
Campus data endpoints: schedule, announcements, locations.
All schedule endpoints require an active session.
"""

from flask import Blueprint, jsonify, request, session
from database import (
    get_schedule,
    get_todays_schedule,
    get_announcements,
    get_locations,
)
from functools import wraps

campus_bp = Blueprint('campus', __name__)


# ── Auth guard decorator ─────────────────────────────────────────
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'student_id' not in session:
            return jsonify({
                'success': False,
                'error': 'Authentication required. Please log in first.'
            }), 401
        return f(*args, **kwargs)
    return decorated


# ── GET /api/schedule ────────────────────────────────────────────
@campus_bp.route('/schedule', methods=['GET'])
@login_required
def full_schedule():
    """Full weekly schedule for the logged-in student."""
    # get_schedule() already returns a day-ordered dict — just return it directly
    ordered = get_schedule(session['student_id'])
    return jsonify({'success': True, 'schedule': ordered})


# ── GET /api/schedule/today ──────────────────────────────────────
@campus_bp.route('/schedule/today', methods=['GET'])
@login_required
def today_schedule():
    """Only today's classes for the logged-in student."""
    from datetime import datetime
    today = datetime.now().strftime('%A')
    rows  = get_todays_schedule(session['student_id'])
    return jsonify({
        'success': True,
        'day':     today,
        'classes': rows
    })


# ── GET /api/news ────────────────────────────────────────────────
@campus_bp.route('/news', methods=['GET'])
def news():
    """Campus announcements — public, no login needed."""
    limit = request.args.get('limit', 10, type=int)
    items = get_announcements(limit)
    return jsonify({'success': True, 'announcements': items})


# ── GET /api/locations ───────────────────────────────────────────
@campus_bp.route('/locations', methods=['GET'])
def locations():
    """Campus locations — public, no login needed. Optional ?search=query."""
    search = request.args.get('search', '').strip() or None
    items  = get_locations(search)
    return jsonify({'success': True, 'locations': items})