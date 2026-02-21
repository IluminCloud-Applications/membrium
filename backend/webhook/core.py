"""
Lógica central de processamento de estudantes via webhook.
Responsável por adicionar/remover alunos do curso e enviar notificações.
"""
from flask import request, jsonify
from models import db, Course, Student, Settings
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError
from utils import send_brevo_email
from evolutionapi import send_whatsapp_message
import logging

logger = logging.getLogger(__name__)


def get_settings_dict():
    """Retorna as configurações como um dicionário para uso no worker."""
    settings = Settings.query.first()
    if not settings:
        return {}

    return {
        'brevo_enabled': settings.brevo_enabled,
        'brevo_api_key': settings.brevo_api_key,
        'brevo_email_subject': settings.brevo_email_subject,
        'brevo_email_template': settings.brevo_email_template,
        'sender_name': settings.sender_name,
        'sender_email': settings.sender_email,
        'support_email': settings.support_email,
        'evolution_enabled': settings.evolution_enabled,
        'evolution_url': settings.evolution_url,
        'evolution_api_key': settings.evolution_api_key,
        'evolution_message_template': settings.evolution_message_template,
        'evolution_version': settings.evolution_version,
        'evolution_instance': settings.evolution_instance,
    }


def process_student(nome, email, course_id, add=True, password=None, phone=None, extra_data=None):
    """
    Processa adição/remoção de aluno e envia notificações.

    Args:
        nome: Nome do aluno
        email: Email do aluno
        course_id: ID do curso
        add: True para adicionar, False para remover
        password: Senha (opcional, gera uma padrão se não fornecida)
        phone: Telefone (opcional)
        extra_data: Dados extras da plataforma de pagamento (opcional, dict)
    """
    logger.info("\n=== Processando estudante ===")
    logger.info(f"Nome: {nome}, Email: {email}, Phone: {phone}")
    logger.info(f"Course ID: {course_id}, Ação: {'Adicionar' if add else 'Remover'}")

    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Curso não encontrado'}), 404

    student = Student.query.filter_by(email=email).first()

    if not student and add:
        password = password or 'senha123'
        logger.info(f"Senha gerada: {password}")
        hashed_password = generate_password_hash(password)
        student = Student(
            email=email,
            password=hashed_password,
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
        # Atualiza phone se não tiver
        if phone and not student.phone:
            student.phone = phone
            logger.info(f"Atualizado telefone para: {phone}")
        # Merge extra_data se vier dados novos
        if extra_data:
            existing = student.extra_data or {}
            existing.update(extra_data)
            student.extra_data = existing

    if not student:
        return jsonify({'error': 'Estudante não encontrado para remoção'}), 404

    if add:
        return _add_student_to_course(student, course, password)
    else:
        return _remove_student_from_course(student, course)


def _add_student_to_course(student, course, password):
    """Adiciona aluno ao curso e envia notificações."""
    if course in student.courses:
        return jsonify({'message': 'Estudante já está no curso'}), 200

    student.courses.append(course)

    # Preparar dados para notificações
    settings_dict = get_settings_dict()
    base_url = _get_base_url()

    student_data = {
        'name': student.name,
        'first_name': student.name.split()[0] if student.name else student.name,
        'email': student.email,
        'password': password,
        'link': f"{base_url}/login",
        'fast_link': f"{base_url}/access/{student.uuid}",
        'curso': course.name,
    }

    # Enviar notificações
    _send_notifications(student, course, password, base_url, settings_dict, student_data)

    try:
        db.session.commit()
        logger.info("Estudante adicionado ao curso com sucesso")
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao salvar os dados'}), 500

    return jsonify({'message': 'Estudante adicionado ao curso com sucesso'}), 200


def _remove_student_from_course(student, course):
    """Remove aluno do curso."""
    if course in student.courses:
        student.courses.remove(course)

    try:
        db.session.commit()
        logger.info("Estudante removido do curso com sucesso")
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao salvar os dados'}), 500

    return jsonify({'message': 'Estudante removido do curso com sucesso'}), 200


def _get_base_url():
    """Retorna a URL base da aplicação."""
    if request.headers.get('X-Forwarded-Proto') and request.headers.get('X-Forwarded-Host'):
        return f"{request.headers.get('X-Forwarded-Proto')}://{request.headers.get('X-Forwarded-Host')}"
    return request.url_root.rstrip('/')


def _send_notifications(student, course, password, base_url, settings_dict, student_data):
    """Envia notificações via Brevo (email) e Evolution API (WhatsApp)."""
    _send_brevo_notification(student, course, password, base_url, settings_dict)
    _send_whatsapp_notification(student, settings_dict, student_data)


def _send_brevo_notification(student, course, password, base_url, settings_dict):
    """Tenta enviar email via Brevo."""
    brevo_enabled = settings_dict.get('brevo_enabled', False)
    brevo_api_key = settings_dict.get('brevo_api_key')

    if not (brevo_enabled and brevo_api_key):
        logger.info("Brevo não está configurado ou habilitado")
        return

    try:
        logger.info("Preparando envio de email via Brevo")
        success, message = send_brevo_email(
            student.name, student.email, course,
            password, base_url, settings_dict, student,
        )
        logger.info(f"Brevo email: {'Enviado' if success else 'Falhou'} - {message}")
    except Exception as e:
        logger.error(f"Erro ao enviar email via Brevo: {str(e)}")


def _send_whatsapp_notification(student, settings_dict, student_data):
    """Tenta enviar WhatsApp via Evolution API."""
    evolution_enabled = settings_dict.get('evolution_enabled', False)
    evolution_api_key = settings_dict.get('evolution_api_key')
    has_phone = bool(student.phone and len(student.phone) > 0)

    if not (evolution_enabled and evolution_api_key):
        logger.info("Evolution API não está configurada ou habilitada")
        return

    if not has_phone:
        logger.info("Evolution API habilitada mas aluno sem telefone")
        return

    try:
        logger.info("Preparando envio de WhatsApp via Evolution API")
        db.session.commit()  # Commit para evitar problemas de sessão
        success, message = send_whatsapp_message(student.phone, student_data)
        logger.info(f"WhatsApp: {'Enviado' if success else 'Falhou'} - {message}")
    except Exception as e:
        logger.error(f"Erro ao enviar WhatsApp via Evolution API: {str(e)}")
