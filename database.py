import psycopg2
import psycopg2.extras
import os

# Get this from Supabase → Settings → Database → Connection string
# Use the "URI" format, looks like:
# postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
DB_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres.vyvnfdifrztsfgmeuidf:gvPYTaBJHtevz49b@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres')

def get_connection():
    conn = psycopg2.connect(DB_URL)
    return conn

def get_student(student_id: str):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute('SELECT * FROM students WHERE id = %s', (student_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None

def get_schedule(student_id: str):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute('''
        SELECT s.day_of_week, s.start_time, s.end_time,
               c.code, c.name AS course_name, c.instructor, c.room, c.building
        FROM schedule s
        JOIN courses c ON c.id = s.course_id
        WHERE s.student_id = %s
        ORDER BY s.day_of_week, s.start_time
    ''', (student_id,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    day_order = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    grouped = {}
    for row in rows:
        grouped.setdefault(row['day_of_week'], []).append(row)
    return {d: grouped[d] for d in day_order if d in grouped}

def get_todays_schedule(student_id: str):
    from datetime import datetime
    today = datetime.now().strftime('%A')
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute('''
        SELECT s.day_of_week, s.start_time, s.end_time,
               c.code, c.name AS course_name, c.instructor, c.room, c.building
        FROM schedule s
        JOIN courses c ON c.id = s.course_id
        WHERE s.student_id = %s AND s.day_of_week = %s
        ORDER BY s.start_time
    ''', (student_id, today))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def get_announcements(limit=10):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute('SELECT * FROM announcements ORDER BY is_pinned DESC, posted_at DESC LIMIT %s', (limit,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def get_locations(search=None):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    if search:
        cur.execute("SELECT * FROM locations WHERE name ILIKE %s OR type ILIKE %s",
                    (f'%{search}%', f'%{search}%'))
    else:
        cur.execute('SELECT * FROM locations ORDER BY type, name')
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def init_db():
    print("✅  Supabase (psycopg2) connected")
