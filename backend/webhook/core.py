"""
Lógica central de processamento de estudantes via webhook.
Responsável por adicionar/remover alunos do curso e disparar notificações.
"""
from flask import request, jsonify
from models import db, Course, Student
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


def _extract_normalized_sale_meta(extra_data: dict | None) -> dict:
    """Extrai metadados normalizados de transação, pagamento e UTMs de qualquer plataforma."""
    if not isinstance(extra_data, dict):
        return {'source': 'manual'}

    source = (extra_data.get('source') or 'manual').strip().lower()
    payt = extra_data.get('payt') if isinstance(extra_data.get('payt'), dict) else {}
    lastlink = extra_data.get('lastlink') if isinstance(extra_data.get('lastlink'), dict) else {}
    hubla = extra_data.get('hubla') if isinstance(extra_data.get('hubla'), dict) else {}

    tx_id = (
        extra_data.get('transaction_id')
        or payt.get('transaction_id')
        or lastlink.get('payment_id')
        or hubla.get('transaction_id')
    )
    payment_method = (
        extra_data.get('payment_method')
        or payt.get('payment_method')
        or lastlink.get('payment_method')
        or hubla.get('payment_method')
    )
    customer_code = extra_data.get('customer_code') or payt.get('customer_code')
    seller_id = extra_data.get('seller_id') or payt.get('seller_id')
    product_name = extra_data.get('product_name') or lastlink.get('product_name')
    offer_name = extra_data.get('offer_name') or lastlink.get('offer_name')
    price = extra_data.get('price') if extra_data.get('price') is not None else lastlink.get('price')

    raw_utms = (
        extra_data.get('utms')
        or payt.get('utms')
        or lastlink.get('utms')
        or hubla.get('utms')
        or {}
    )
    utms = {}
    if isinstance(raw_utms, dict):
        utms = {k: v for k, v in raw_utms.items() if v is not None and str(v).strip() != ''}

    meta = {'source': source}
    if tx_id:
        meta['transaction_id'] = str(tx_id)
    if payment_method:
        meta['payment_method'] = str(payment_method)
    if customer_code:
        meta['customer_code'] = str(customer_code)
    if seller_id:
        meta['seller_id'] = str(seller_id)
    if product_name:
        meta['product_name'] = str(product_name)
    if offer_name:
        meta['offer_name'] = str(offer_name)
    if price is not None and str(price) != '':
        meta['price'] = price
    if utms:
        meta['utms'] = utms

    return meta


def record_student_course_event(
    student: Student,
    courses: list,
    add: bool = True,
    extra_data: dict | None = None,
    bonus_courses: list | None = None,
    combo=None,
):
    """
    Registra e organiza no extra_data do estudante:
    - backfill automático dos cursos anteriores (para alunos que já estavam em produção antes da atualização)
    - `course_sources`: mapa por ID do curso com a plataforma de origem, data, status e dados da compra
    - `purchase_history`: histórico cronológico de todas as compras/ativações/remoções e suas plataformas
    - `sources`: lista de todas as plataformas pelas quais o aluno já passou
    """
    from datetime import datetime
    from sqlalchemy.orm.attributes import flag_modified

    now_iso = datetime.utcnow().isoformat()
    existing = dict(student.extra_data) if isinstance(student.extra_data, dict) else {}

    course_sources = dict(existing.get('course_sources')) if isinstance(existing.get('course_sources'), dict) else {}
    purchase_history = list(existing.get('purchase_history')) if isinstance(existing.get('purchase_history'), list) else []
    sources_list = list(existing.get('sources')) if isinstance(existing.get('sources'), list) else []

    # ── 1. Backfill de segurança para alunos antigos em produção ─────────────
    # Se o aluno já possuía cursos e uma origem salva antes desta atualização,
    # preservamos essa origem vinculada aos cursos antigos antes de registrar o novo evento.
    legacy_source = existing.get('source')
    if legacy_source and isinstance(legacy_source, str):
        legacy_source_clean = legacy_source.strip().lower()
        if legacy_source_clean and legacy_source_clean not in sources_list:
            sources_list.append(legacy_source_clean)
        if not existing.get('first_source'):
            existing['first_source'] = legacy_source_clean

        legacy_meta = _extract_normalized_sale_meta(existing)
        legacy_date = student.created_at.isoformat() if getattr(student, 'created_at', None) else now_iso

        # Cursos que o aluno já tinha matriculados e ainda não estavam mapeados em course_sources
        current_target_ids = {c.id for c in (courses or []) if c} | {b.id for b in (bonus_courses or []) if b}
        pre_existing_unmapped = []
        for enrolled_c in (student.courses or []):
            cid_str = str(enrolled_c.id)
            if cid_str not in course_sources and enrolled_c.id not in current_target_ids:
                is_bonus_cat = (enrolled_c.category or 'principal') == 'bonus'
                entry = {
                    'course_id': enrolled_c.id,
                    'course_name': enrolled_c.name,
                    'category': enrolled_c.category or 'principal',
                    'source': legacy_source_clean,
                    'status': 'active',
                    'is_bonus': is_bonus_cat,
                    'granted_at': legacy_date,
                    'updated_at': legacy_date,
                }
                for k in ('transaction_id', 'payment_method', 'customer_code', 'seller_id', 'product_name', 'offer_name', 'price', 'utms'):
                    if k in legacy_meta and not is_bonus_cat:
                        entry[k] = legacy_meta[k]
                course_sources[cid_str] = entry
                pre_existing_unmapped.append(enrolled_c)

        if pre_existing_unmapped and not purchase_history:
            principal_legacy = [c for c in pre_existing_unmapped if (c.category or 'principal') != 'bonus']
            bonus_legacy = [c for c in pre_existing_unmapped if (c.category or 'principal') == 'bonus']
            main_c = principal_legacy[0] if principal_legacy else pre_existing_unmapped[0]
            legacy_hist = {
                'action': 'add',
                'source': legacy_source_clean,
                'course_id': main_c.id,
                'course_name': main_c.name,
                'courses': [{'id': c.id, 'name': c.name, 'category': c.category or 'principal'} for c in (principal_legacy or pre_existing_unmapped)],
                'bonus_courses': [b.name for b in bonus_legacy],
                'timestamp': legacy_date,
                'legacy_backfill': True,
            }
            for k in ('transaction_id', 'payment_method', 'product_name', 'offer_name', 'price', 'utms'):
                if k in legacy_meta:
                    legacy_hist[k] = legacy_meta[k]
            purchase_history.append(legacy_hist)

    # ── 2. Mesclar metadados novos sem apagar dados importantes anteriores ───
    if isinstance(extra_data, dict):
        for k, v in extra_data.items():
            if k in ('course_sources', 'purchase_history', 'sources', 'first_source'):
                continue
            if v is not None and v != '' and v != {} and v != []:
                existing[k] = v

    sale_meta = _extract_normalized_sale_meta(extra_data if isinstance(extra_data, dict) else existing)
    source = sale_meta.get('source') or 'manual'

    if source not in sources_list:
        sources_list.append(source)
    if not existing.get('first_source'):
        existing['first_source'] = source
    if add or not existing.get('source'):
        existing['source'] = source

    # ── 3. Atualizar course_sources para cada curso afetado ──────────────────
    target_courses = [c for c in (courses or []) if c]
    target_bonus = [b for b in (bonus_courses or []) if b]
    main_label = combo.name if combo else (target_courses[0].name if target_courses else 'Curso')

    if add:
        for c in target_courses:
            cid_str = str(c.id)
            prev = course_sources.get(cid_str, {}) if isinstance(course_sources.get(cid_str), dict) else {}
            entry = {
                'course_id': c.id,
                'course_name': c.name,
                'category': c.category or 'principal',
                'source': source,
                'status': 'active',
                'is_bonus': False,
                'combo_id': combo.id if combo else None,
                'combo_name': combo.name if combo else None,
                'granted_at': prev.get('granted_at') or now_iso,
                'updated_at': now_iso,
            }
            for k in ('transaction_id', 'payment_method', 'customer_code', 'seller_id', 'product_name', 'offer_name', 'price', 'utms'):
                if k in sale_meta:
                    entry[k] = sale_meta[k]
                elif k in prev:
                    entry[k] = prev[k]
            course_sources[cid_str] = entry

        for b in target_bonus:
            bid_str = str(b.id)
            prev = course_sources.get(bid_str, {}) if isinstance(course_sources.get(bid_str), dict) else {}
            course_sources[bid_str] = {
                'course_id': b.id,
                'course_name': b.name,
                'category': 'bonus',
                'source': prev.get('source') or source,
                'status': 'active',
                'is_bonus': True,
                'unlocked_by': prev.get('unlocked_by') or main_label,
                'combo_id': combo.id if combo else prev.get('combo_id'),
                'combo_name': combo.name if combo else prev.get('combo_name'),
                'granted_at': prev.get('granted_at') or now_iso,
                'updated_at': now_iso,
            }
    else:
        for c in target_courses + target_bonus:
            cid_str = str(c.id)
            prev = course_sources.get(cid_str, {}) if isinstance(course_sources.get(cid_str), dict) else {}
            entry = dict(prev) if prev else {
                'course_id': c.id,
                'course_name': c.name,
                'category': c.category or 'principal',
                'source': source,
                'is_bonus': (c.category or 'principal') == 'bonus',
                'granted_at': now_iso,
            }
            entry['course_name'] = c.name
            entry['status'] = 'removed'
            entry['removed_at'] = now_iso
            entry['removed_by_source'] = source
            entry['updated_at'] = now_iso
            course_sources[cid_str] = entry

    # ── 4. Adicionar entrada ao histórico cronológico (purchase_history) ─────
    if target_courses or target_bonus:
        primary_course = target_courses[0] if target_courses else target_bonus[0]
        hist_entry = {
            'action': 'add' if add else 'remove',
            'source': source,
            'course_id': primary_course.id if not combo else None,
            'course_name': combo.name if combo else primary_course.name,
            'courses': [{'id': c.id, 'name': c.name, 'category': c.category or 'principal'} for c in target_courses],
            'bonus_courses': [b.name for b in target_bonus],
            'combo_id': combo.id if combo else None,
            'combo_name': combo.name if combo else None,
            'timestamp': now_iso,
        }
        for k in ('transaction_id', 'payment_method', 'customer_code', 'seller_id', 'product_name', 'offer_name', 'price', 'utms'):
            if k in sale_meta:
                hist_entry[k] = sale_meta[k]

        purchase_history.append(hist_entry)
        # Mantém no máximo os últimos 100 eventos para evitar crescimento excessivo do JSON
        if len(purchase_history) > 100:
            purchase_history = purchase_history[-100:]

    existing['course_sources'] = course_sources
    existing['purchase_history'] = purchase_history
    existing['sources'] = sources_list

    student.extra_data = existing
    flag_modified(student, 'extra_data')


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
        return _add_student_to_course(student, course, password, phone, extra_data=extra_data)
    return _remove_student_from_course(student, course, extra_data=extra_data)


def _get_all_bonus_courses(exclude_course_id):
    """Retorna todos os cursos bônus publicados, exceto o curso principal da compra."""
    return Course.query.filter(
        Course.category == 'bonus',
        Course.is_published == True,
        Course.id != exclude_course_id,
    ).all()


def _add_student_to_course(student, course, password, phone=None, extra_data=None):
    """Adiciona aluno ao curso principal e a todos os cursos bônus existentes."""
    already_enrolled = course in student.courses

    # ── Calcular cursos bônus antes de modificar student.courses para preservar backfill ──
    bonus_courses = _get_all_bonus_courses(course.id)
    added_bonus_objs = [b for b in bonus_courses if b not in student.courses]
    added_bonus = [b.name for b in added_bonus_objs]

    # Registrar origem por curso e histórico de compras em extra_data
    try:
        record_student_course_event(
            student=student,
            courses=[course],
            add=True,
            extra_data=extra_data,
            bonus_courses=added_bonus_objs,
        )
    except Exception as e:
        logger.warning(f"Erro ao registrar histórico de plataforma do estudante: {e}")

    if not already_enrolled:
        student.courses.append(course)

    # ── Adicionar automaticamente a todos os cursos bônus ──────────
    for bonus in added_bonus_objs:
        student.courses.append(bonus)

    if already_enrolled and not added_bonus:
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
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


def _remove_student_from_course(student, course, extra_data=None):
    """Remove aluno do curso especificado e remove os bônus ao sair do curso principal."""
    was_enrolled = course in student.courses
    removed_bonus_objs = []
    removed_bonus = []

    is_principal = (course.category or 'principal') == 'principal'
    if is_principal:
        for c in list(student.courses):
            if c.category == 'bonus' and c.id != course.id:
                removed_bonus_objs.append(c)
                removed_bonus.append(c.name)

    try:
        record_student_course_event(
            student=student,
            courses=[course] if was_enrolled else [],
            add=False,
            extra_data=extra_data,
            bonus_courses=removed_bonus_objs,
        )
    except Exception as e:
        logger.warning(f"Erro ao registrar remoção no histórico do estudante: {e}")

    if was_enrolled:
        student.courses.remove(course)

    for c in removed_bonus_objs:
        if c in student.courses:
            student.courses.remove(c)

    try:
        db.session.commit()
        if removed_bonus:
            logger.info(f"Estudante removido do curso '{course.name}' + bônus: {', '.join(removed_bonus)}")
        else:
            logger.info(f"Estudante removido do curso '{course.name}' com sucesso")
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Erro ao salvar os dados'}), 500

    bonus_msg = f" + {len(removed_bonus)} bônus removidos" if removed_bonus else ""
    return jsonify({
        'message': f'Estudante removido do curso com sucesso{bonus_msg}',
        'removed_bonus': removed_bonus,
    }), 200


def _trigger_notifications(student, course, password, phone=None):
    """Monta os dados e dispara notificações para todas as integrações."""
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
        'curso': course.name,
        'unsubscribe_link': f"{base_url}/unsubscribe?email={student.email}",
        'base_url': base_url,
    }


    results = dispatch_notifications(
        settings_dict=settings_dict,
        student_data=student_data,
        phone=phone or student.phone,
    )

    logger.info(f"Resultados das notificações: {results}")


def _get_base_url():
    """Retorna a URL base da aplicação, priorizando o CUSTOM_DOMAIN se configurado."""
    import os
    custom_domain = os.environ.get('CUSTOM_DOMAIN')
    if custom_domain and custom_domain.strip():
        domain = custom_domain.strip()
        if not domain.startswith(('http://', 'https://')):
            domain = f"https://{domain}"
        return domain

    if request.headers.get('X-Forwarded-Proto') and request.headers.get('X-Forwarded-Host'):
        return f"{request.headers.get('X-Forwarded-Proto')}://{request.headers.get('X-Forwarded-Host')}"
    return request.url_root.rstrip('/')
