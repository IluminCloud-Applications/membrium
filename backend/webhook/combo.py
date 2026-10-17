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
from .core import get_settings_dict, _get_base_url, record_student_course_event
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

    if not student:
        return jsonify({'error': 'Estudante não encontrado para remoção'}), 404

    if add:
        return _add_student_to_combo(student, combo, password, phone, extra_data=extra_data)
    return _remove_student_from_combo(student, combo, extra_data=extra_data)


def _add_student_to_combo(student, combo, password, phone=None, extra_data=None):
    """Matricula o aluno em todos os cursos do combo + cursos bônus globais."""
    added_courses = []
    already_enrolled = True

    combo_courses_list = list(combo.courses)
    for course in combo_courses_list:
        if course not in student.courses:
            added_courses.append(course.name)
            already_enrolled = False

    # Adicionar cursos bônus globais publicados que não estejam no combo
    combo_course_ids = [c.id for c in combo_courses_list]
    bonus_courses = Course.query.filter(
        Course.category == 'bonus',
        Course.is_published == True,
        ~Course.id.in_(combo_course_ids)
    ).all() if combo_course_ids else Course.query.filter(
        Course.category == 'bonus',
        Course.is_published == True,
    ).all()

    added_bonus_objs = []
    for bonus in bonus_courses:
        if bonus not in student.courses:
            added_bonus_objs.append(bonus)
            added_courses.append(f"{bonus.name} (Bônus)")

    try:
        record_student_course_event(
            student=student,
            courses=combo_courses_list,
            add=True,
            extra_data=extra_data,
            bonus_courses=added_bonus_objs,
            combo=combo,
        )
    except Exception as e:
        logger.warning(f"Erro ao registrar histórico de plataforma do combo: {e}")

    for course in combo_courses_list:
        if course not in student.courses:
            student.courses.append(course)

    for bonus in added_bonus_objs:
        if bonus not in student.courses:
            student.courses.append(bonus)

    if already_enrolled and not added_courses:
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
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


def _remove_student_from_combo(student, combo, extra_data=None):
    """Remove o aluno de todos os cursos que fazem parte do combo e bônus se sair do curso principal."""
    removed_courses = []
    removed_course_objs = []
    combo_had_principal = False

    for course in combo.courses:
        if (course.category or 'principal') == 'principal':
            combo_had_principal = True
        if course in student.courses:
            removed_course_objs.append(course)
            removed_courses.append(course.name)

    remaining_courses = [c for c in student.courses if c not in removed_course_objs]
    has_principal_left = any((c.category or 'principal') == 'principal' for c in remaining_courses)

    removed_bonus = []
    removed_bonus_objs = []
    if combo_had_principal or not has_principal_left:
        for c in remaining_courses:
            if c.category == 'bonus':
                removed_bonus_objs.append(c)
                removed_bonus.append(c.name)
                removed_courses.append(f"{c.name} (Bônus)")

    try:
        record_student_course_event(
            student=student,
            courses=removed_course_objs,
            add=False,
            extra_data=extra_data,
            bonus_courses=removed_bonus_objs,
            combo=combo,
        )
    except Exception as e:
        logger.warning(f"Erro ao registrar remoção de combo no histórico: {e}")

    for c in removed_course_objs + removed_bonus_objs:
        if c in student.courses:
            student.courses.remove(c)

    try:
        db.session.commit()
        if removed_bonus:
            logger.info(f"Estudante removido dos cursos do combo '{combo.name}' + bônus: {', '.join(removed_courses)}")
        else:
            logger.info(f"Estudante removido dos cursos do combo '{combo.name}': {', '.join(removed_courses)}")
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao atualizar dados do combo'}), 500

    return jsonify({
        'message': f'Estudante removido com sucesso dos cursos do combo "{combo.name}"',
        'removed_courses': removed_courses,
        'removed_bonus': removed_bonus,
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
        'base_url': base_url,
    }


    results = dispatch_notifications(
        settings_dict=settings_dict,
        student_data=student_data,
        phone=phone or student.phone,
    )

    logger.info(f"Resultados das notificações de combo: {results}")
