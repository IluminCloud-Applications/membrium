"""Quick access — authenticate student via UUID link."""
from flask import Blueprint, session, jsonify, redirect, request
from models import Student, Admin

quick_access_bp = Blueprint('quick_access', __name__)


@quick_access_bp.route('/api/auth/quick-access/status', methods=['GET'])
def api_quick_access_status():
    """Public probe — returns whether any messaging integration is active.

    Used by the login page to decide whether to show the quick-access option
    without needing a real student email.
    """
    from routes.students.resend_access import _get_settings_dict
    settings = _get_settings_dict()
    has_email = bool(settings.get('brevo_enabled') and settings.get('brevo_api_key'))
    has_wa    = bool(settings.get('evolution_enabled') and settings.get('evolution_api_key'))
    return jsonify({
        'available': has_email or has_wa,
        'channels': {'email': has_email, 'whatsapp': has_wa},
    })


@quick_access_bp.route('/api/auth/quick-access/<uuid>', methods=['POST'])
def api_quick_access(uuid):
    """Quick access — authenticate student by UUID token (JSON API)."""
    student = Student.query.filter_by(uuid=uuid).first()
    if not student:
        return jsonify({'success': False, 'message': 'Link de acesso inválido'}), 404

    session.permanent = True
    session['user_id'] = student.id
    session['user_type'] = 'student'
    return jsonify({
        'success': True,
        'message': 'Acesso rápido realizado com sucesso!',
        'user': {
            'id': student.id,
            'type': 'student',
            'email': student.email,
            'name': student.name,
        },
    })


@quick_access_bp.route('/api/auth/quick-access/check', methods=['POST'])
def api_quick_access_check():
    """Verify if a student exists by email and has enabled integrations."""
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'success': False, 'message': 'E-mail obrigatório'}), 400

    # Always check integrations — returned regardless of student existence
    from routes.students.resend_access import _get_settings_dict
    settings = _get_settings_dict()
    has_email = bool(settings.get('brevo_enabled') and settings.get('brevo_api_key'))
    has_wa_configured = bool(settings.get('evolution_enabled') and settings.get('evolution_api_key'))

    student = Student.query.filter_by(email=email).first()
    if not student:
        admin = Admin.query.filter_by(email=email).first()
        if admin:
            # Admins bypass quick access and go straight to password login
            return jsonify({
                'success': True,
                'exists': True,
                'has_integrations': False,
                'channels': {'email': False, 'whatsapp': False},
            })

        return jsonify({
            'success': False,
            'message': 'E-mail não cadastrado',
            'exists': False,
            'has_integrations': has_email or has_wa_configured,
            'channels': {'email': has_email, 'whatsapp': has_wa_configured},
        })

    # For existing students, whatsapp also requires a phone number
    has_wa = has_wa_configured and bool(student.phone)

    return jsonify({
        'success': True,
        'exists': True,
        'has_integrations': bool(has_email or has_wa),
        'channels': {
            'email': has_email,
            'whatsapp': has_wa,
        }
    })


@quick_access_bp.route('/api/auth/quick-access/send', methods=['POST'])
def api_quick_access_send():
    """Send quick access link via Brevo and/or Evolution API."""
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'success': False, 'message': 'E-mail obrigatório'}), 400

    student = Student.query.filter_by(email=email).first()
    if not student:
        return jsonify({'success': False, 'message': 'E-mail não cadastrado'}), 404

    # Load integrations config
    from routes.students.resend_access import _get_settings_dict, _get_base_url
    settings_dict = _get_settings_dict()
    base_url = _get_base_url()

    has_email = settings_dict.get('brevo_enabled') and settings_dict.get('brevo_api_key')
    has_wa = settings_dict.get('evolution_enabled') and settings_dict.get('evolution_api_key')

    if not has_email and not has_wa:
        return jsonify({'success': False, 'message': 'Nenhum canal de envio configurado (e-mail ou whatsapp).'}), 400

    # Build template variables
    courses_names = ', '.join([c.name for c in student.courses]) if student.courses else 'Nenhum curso'
    fast_link = f"{base_url}/access/{student.uuid}"

    student_data = {
        'name': student.name,
        'first_name': student.name.split()[0] if student.name else student.name,
        'email': student.email,
        'link': f"{base_url}/login",
        'fast_link': fast_link,
        'curso': courses_names,
        'unsubscribe_link': f"{base_url}/unsubscribe?email={student.email}",
    }

    # Override templates for quick access
    if has_email:
        settings_dict['brevo_email_subject'] = "Seu link de acesso rápido"
        settings_dict['brevo_email_template'] = (
            "Olá [[name]],\n\nClique no link abaixo para acessar sua área de membros instantaneamente "
            "(não é necessário digitar senha):\n\n[[fast_link]]\n\nEste link é de uso pessoal. Não compartilhe com ninguém.\n\n"
            "Atenciosamente,\nEquipe de Suporte"
        )
        settings_dict['brevo_template_mode'] = 'simple'

    if has_wa:
        settings_dict['evolution_message_template'] = (
            "Olá [[first_name]]! Aqui está o seu link de acesso rápido para a área de membros:\n\n[[fast_link]]\n\n"
            "Clique no link acima para entrar sem digitar senha."
        )

    # Send notifications
    from integrations import dispatch_notifications
    results = dispatch_notifications(
        settings_dict=settings_dict,
        student_data=student_data,
        phone=student.phone,
    )

    email_sent = results.get('email', {}).get('sent', False)
    whatsapp_sent = results.get('whatsapp', {}).get('sent', False)

    if not email_sent and not whatsapp_sent:
        return jsonify({
            'success': False,
            'message': 'Falha ao enviar o link de acesso. Verifique suas configurações de e-mail/WhatsApp.',
            'results': results
        }), 500

    channels = []
    if email_sent:
        channels.append('e-mail')
    if whatsapp_sent:
        channels.append('WhatsApp')

    channel_text = ' e '.join(channels)
    return jsonify({
        'success': True,
        'message': f'Link de acesso rápido enviado com sucesso via {channel_text}!'
    })


@quick_access_bp.route('/access/<uuid>')
def quick_access_redirect(uuid):
    """Legacy quick access — redirect to frontend route."""
    return redirect(f'/quick-access/{uuid}')

