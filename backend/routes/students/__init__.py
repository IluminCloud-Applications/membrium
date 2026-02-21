from flask import Blueprint
from .list_students import list_students_bp
from .create_student import create_student_bp
from .update_student import update_student_bp
from .delete_student import delete_student_bp
from .student_courses import student_courses_bp
from .resend_access import resend_access_bp
from .import_students import import_students_bp
from .check_email import check_email_bp

students_bp = Blueprint('students', __name__, url_prefix='/api/students')

# Register sub-blueprints
students_bp.register_blueprint(list_students_bp)
students_bp.register_blueprint(create_student_bp)
students_bp.register_blueprint(update_student_bp)
students_bp.register_blueprint(delete_student_bp)
students_bp.register_blueprint(student_courses_bp)
students_bp.register_blueprint(resend_access_bp)
students_bp.register_blueprint(import_students_bp)
students_bp.register_blueprint(check_email_bp)
