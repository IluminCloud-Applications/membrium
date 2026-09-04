"""
Processamento de webhooks para Combos de Cursos.
Adiciona ou remove o aluno de todos os cursos que compõem a oferta.
"""
from flask import jsonify
from models import db, Course, Student, CourseCombo
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError
from integrations import dispatch_notifications
from db.integration_helpers import get_integration
from .core import get_settings_dict, _get_base_url
import logging

logger = logging.getLogger(__name__)


def process_combo_student(nome, email, combo, add=True, password=None, phone=None, extra_data=None):
    """
    Processa adição ou remoção de estudante em todos os cursos do combo.
    """
    logger.info(f"Processando estudante em combo '{combo.name}': {nome} ({email}), Ação: {'Adicionar' if add else 'Remover'}")

    student = Student.query.filter_by(email=email).first()

    if not student and add:
        _, signup_config = get_integration('student_signup')
        default_pw = signup_config.get('new_student_password', '').strip() or 'senha123'
        password = password or default_pw
        student = Student(
            email=email,
            password=generate_password_hash(password),
            name=nome,
            phone=phone,
            extra_data=extra_data or {},
        )
        db.session.add(student)
        try:
            db.session.flush()
        except IntegrityError:
            db.session.rollback()
            return jsonify({'error': 'Email já está em uso'}), 400
    elif student:
        if phone and not student.phone:
            student.phone = phone
        if extra_data:
            existing = student.extra_data or {}
            existing.update(extra_data)
            student.extra_data = existing

    if not student:
        return jsonify({'error': 'Estudante não encontrado para remoção'}), 404

    if add:
        return _add_student_to_combo(student, combo, password, phone)
    return _remove_student_from_combo(student, combo)


def _add_student_to_combo(student, combo, password, phone=None):
    """Matricula o aluno em todos os cursos do combo + cursos bônus globais."""
    added_courses = []
    already_enrolled = True

    # Adicionar todos os cursos do combo
    for course in combo.courses:
        if course not in student.courses:
            student.courses.append(course)
            added_courses.append(course.name)
            already_enrolled = False

    # Adicionar cursos bônus globais publicados que não estejam no combo
    combo_course_ids = [c.id for c in combo.courses]
    bonus_courses = Course.query.filter(
        Course.category == 'bonus',
        Course.is_published == True,
        ~Course.id.in_(combo_course_ids)
    ).all()

    for bonus in bonus_courses:
        if bonus not in student.courses:
            student.courses.append(bonus)
            added_courses.append(f"{bonus.name} (Bônus)")

    if already_enrolled and not added_courses:
        return jsonify({'message': f'Estudante já está matriculado nos cursos do combo {combo.name}'}), 200

    try:
        db.session.commit()
        logger.info(f"Estudante adicionado aos cursos do combo: {', '.join(added_courses)}")
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao salvar os dados do combo'}), 500

    # Disparar notificações de boas-vindas informando o nome do Combo
    _trigger_combo_notifications(student, combo, password, phone)

    return jsonify({
        'message': f'Estudante matriculado com sucesso no combo "{combo.name}" ({len(added_courses)} cursos liberados)',
        'added_courses': added_courses,
    }), 200


def _remove_student_from_combo(student, combo):
    """Remove o aluno de todos os cursos que fazem parte do combo."""
    removed_courses = []
    for course in combo.courses:
        if course in student.courses:
            student.courses.remove(course)
            removed_courses.append(course.name)

    try:
        db.session.commit()
        logger.info(f"Estudante removido dos cursos do combo: {', '.join(removed_courses)}")
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao atualizar dados do combo'}), 500

    return jsonify({
        'message': f'Estudante removido com sucesso dos cursos do combo "{combo.name}"',
        'removed_courses': removed_courses,
    }), 200


def _trigger_combo_notifications(student, combo, password, phone=None):
    """Envia credenciais de acesso por email e WhatsApp com o nome do combo."""
    settings_dict = get_settings_dict()
    base_url = _get_base_url()

    _, signup_config = get_integration('student_signup')
    default_pw = signup_config.get('new_student_password', '').strip() or 'senha123'

    student_data = {
        'name': student.name,
        'first_name': student.name.split()[0] if student.name else student.name,
        'email': student.email,
        'password': password or default_pw,
        'link': f"{base_url}/login",
        'fast_link': f"{base_url}/access/{student.uuid}",
        'curso': combo.name,
        'unsubscribe_link': f"{base_url}/unsubscribe?email={student.email}",
    }

    results = dispatch_notifications(
        settings_dict=settings_dict,
        student_data=student_data,
        phone=phone or student.phone,
    )

    logger.info(f"Resultados das notificações de combo: {results}")
