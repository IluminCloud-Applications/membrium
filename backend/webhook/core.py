"""
Lógica central de processamento de estudantes via webhook.
Responsável por adicionar/remover alunos do curso e disparar notificações.
"""
from flask import request, jsonify
from models import db, Course, Student, CourseGroup, course_group_courses
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError
from integrations import dispatch_notifications
from db.integration_helpers import get_integration
import logging

logger = logging.getLogger(__name__)


def get_settings_dict():
    """Retorna as configurações como um dicionário para notificações."""
    brevo_enabled, brevo = get_integration('brevo')
    evolution_enabled, evolution = get_integration('evolution')
    _, support = get_integration('support')

    return {
        'brevo_enabled': brevo_enabled,
        'brevo_api_key': brevo.get('api_key'),
        'brevo_email_subject': brevo.get('email_subject'),
        'brevo_email_template': brevo.get('email_template'),
        'brevo_template_mode': brevo.get('template_mode'),
        'brevo_forgot_email_subject': brevo.get('forgot_email_subject'),
        'brevo_forgot_email_template': brevo.get('forgot_email_template'),
        'brevo_forgot_template_mode': brevo.get('forgot_template_mode'),
        'sender_name': support.get('sender_name'),
        'sender_email': support.get('sender_email'),
        'support_email': support.get('email'),
        'evolution_enabled': evolution_enabled,
        'evolution_url': evolution.get('url'),
        'evolution_api_key': evolution.get('api_key'),
        'evolution_message_template': evolution.get('message_template'),
        'evolution_version': evolution.get('version'),
        'evolution_instance': evolution.get('instance'),
    }


def process_student(nome, email, course_id, add=True, password=None, phone=None, extra_data=None):
    """
    Processa adição/remoção de aluno e envia notificações.

    Args:
        nome: Nome do aluno
        email: Email do aluno
        course_id: ID do curso
        add: True para adicionar, False para remover
        password: Senha (opcional, gera padrão se não fornecida)
        phone: Telefone (opcional)
        extra_data: Dados extras da plataforma (opcional)
    """
    logger.info(f"Processando estudante: {nome} ({email}), Ação: {'Adicionar' if add else 'Remover'}")

    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Curso não encontrado'}), 404

    student = Student.query.filter_by(email=email).first()

    if not student and add:
        password = password or 'senha123'
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
        return _add_student_to_course(student, course, password, phone)
    return _remove_student_from_course(student, course)


def _get_bonus_courses(course):
    """
    Verifica se o curso pertence a algum agrupamento e retorna
    os cursos bônus desse agrupamento.
    """
    groups = CourseGroup.query.filter(
        CourseGroup.courses.any(Course.id == course.id)
    ).all()

    if not groups:
        return []

    bonus_courses = []
    for group in groups:
        for c in group.courses:
            if c.id != course.id and c.category == 'bonus':
                bonus_courses.append(c)

    return bonus_courses


def _add_student_to_course(student, course, password, phone=None):
    """Adiciona aluno ao curso principal e aos cursos bônus do agrupamento."""
    already_enrolled = course in student.courses

    if not already_enrolled:
        student.courses.append(course)

    # ── Adicionar aos cursos bônus do agrupamento ──────────────────
    bonus_courses = _get_bonus_courses(course)
    added_bonus = []
    for bonus in bonus_courses:
        if bonus not in student.courses:
            student.courses.append(bonus)
            added_bonus.append(bonus.name)

    if already_enrolled and not added_bonus:
        return jsonify({'message': 'Estudante já está no curso'}), 200

    try:
        db.session.commit()
        if added_bonus:
            logger.info(f"Estudante adicionado ao curso + bônus: {', '.join(added_bonus)}")
        else:
            logger.info("Estudante adicionado ao curso com sucesso")
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao salvar os dados'}), 500

    # ─── Disparar notificações (email + whatsapp) ─────────────────
    _trigger_notifications(student, course, password, phone)

    bonus_msg = f" + {len(added_bonus)} bônus" if added_bonus else ""
    return jsonify({
        'message': f'Estudante adicionado ao curso com sucesso{bonus_msg}',
        'bonus_courses': added_bonus,
    }), 200


def _remove_student_from_course(student, course):
    """Remove aluno do curso principal e dos cursos bônus do agrupamento."""
    if course in student.courses:
        student.courses.remove(course)

    bonus_courses = _get_bonus_courses(course)
    removed_bonus = []
    for bonus in bonus_courses:
        if bonus in student.courses:
            student.courses.remove(bonus)
            removed_bonus.append(bonus.name)

    try:
        db.session.commit()
        if removed_bonus:
            logger.info(f"Estudante removido do curso + bônus: {', '.join(removed_bonus)}")
        else:
            logger.info("Estudante removido do curso com sucesso")
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao salvar os dados'}), 500

    bonus_msg = f" + {len(removed_bonus)} bônus" if removed_bonus else ""
    return jsonify({
        'message': f'Estudante removido do curso com sucesso{bonus_msg}',
        'removed_bonus': removed_bonus,
    }), 200


def _trigger_notifications(student, course, password, phone=None):
    """Monta os dados e dispara notificações para todas as integrações."""
    settings_dict = get_settings_dict()
    base_url = _get_base_url()

    student_data = {
        'name': student.name,
        'first_name': student.name.split()[0] if student.name else student.name,
        'email': student.email,
        'password': password or 'senha123',
        'link': f"{base_url}/login",
        'fast_link': f"{base_url}/access/{student.uuid}",
        'curso': course.name,
        'unsubscribe_link': f"{base_url}/unsubscribe?email={student.email}",
    }

    results = dispatch_notifications(
        settings_dict=settings_dict,
        student_data=student_data,
        phone=phone or student.phone,
    )

    logger.info(f"Resultados das notificações: {results}")


def _get_base_url():
    """Retorna a URL base da aplicação."""
    if request.headers.get('X-Forwarded-Proto') and request.headers.get('X-Forwarded-Host'):
        return f"{request.headers.get('X-Forwarded-Proto')}://{request.headers.get('X-Forwarded-Host')}"
    return request.url_root.rstrip('/')
