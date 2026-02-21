"""Student-facing lesson routes.
Admin lesson management is now in routes/course_modification/lessons.py.
"""
from flask import Blueprint, jsonify, request, session, redirect, url_for
from functools import wraps
from db.database import db
from models import Student, Lesson, student_lessons

lesson_bp = Blueprint('lesson', __name__)


def student_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Student.query.get(session['user_id']):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


@lesson_bp.route('/mark_lesson_completed', methods=['POST'])
@student_required
def mark_lesson_completed():
    """Student: mark a lesson as completed."""
    data = request.json
    lesson_id = data.get('lesson_id')
    student_id = session['user_id']

    if not lesson_id:
        return jsonify({'success': False, 'message': 'ID da lição não fornecido'}), 400

    existing = db.session.query(student_lessons).filter_by(
        student_id=student_id, lesson_id=lesson_id
    ).first()

    if existing:
        return jsonify({'success': True, 'message': 'Already completed'})

    new_record = student_lessons.insert().values(student_id=student_id, lesson_id=lesson_id)
    db.session.execute(new_record)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Lesson marked as completed'})
