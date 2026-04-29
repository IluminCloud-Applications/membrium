from flask import Blueprint, request, jsonify, session, redirect, url_for
from functools import wraps
from db.database import db
from models import Admin
from db.integration_helpers import get_integration, set_integration

integrations_bp = Blueprint('settings_integrations', __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not Admin.query.get(session['user_id']):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


# ─── GET integrations ─────────────────────────────────────────────

@integrations_bp.route('/api/settings/integrations', methods=['GET'])
@admin_required
def get_integrations():
    brevo_enabled, brevo = get_integration('brevo')
    evolution_enabled, evolution = get_integration('evolution')
    youtube_enabled, youtube = get_integration('youtube')
    vturb_enabled, vturb = get_integration('vturb')
    proxy_enabled, proxy = get_integration('proxy')
    chatwoot_enabled, chatwoot = get_integration('chatwoot')
    assemblyai_enabled, assemblyai = get_integration('assemblyai')
    r2_enabled, r2 = get_integration('cloudflare_r2')
    _, support = get_integration('support')

    return jsonify({
        'brevo': {
            'enabled': brevo_enabled,
            'api_key': brevo.get('api_key', ''),
            'sender_name': support.get('sender_name', ''),
            'sender_email': support.get('sender_email', ''),
            'email_subject': brevo.get('email_subject', ''),
            'email_template': brevo.get('email_template', ''),
            'template_mode': brevo.get('template_mode', 'simple'),
            'forgot_email_subject': brevo.get('forgot_email_subject', ''),
            'forgot_email_template': brevo.get('forgot_email_template', ''),
            'forgot_template_mode': brevo.get('forgot_template_mode', 'simple'),
        },
        'evolution': {
            'enabled': evolution_enabled,
            'url': evolution.get('url', ''),
            'api_key': evolution.get('api_key', ''),
            'version': evolution.get('version', ''),
            'instance': evolution.get('instance', ''),
            'message_template': evolution.get('message_template', ''),
            'template_mode': evolution.get('template_mode', 'simple'),
        },
        'youtube': {
            'enabled': youtube_enabled,
            'client_id': youtube.get('client_id', ''),
            'client_secret': youtube.get('client_secret', ''),
            'connected': bool(youtube.get('refresh_token')),
            'channel_name': youtube.get('channel_name', ''),
            'channel_id': youtube.get('channel_id', ''),
        },
        'vturb': {
            'enabled': vturb_enabled,
            'api_key': vturb.get('api_key', ''),
            'org_id': vturb.get('org_id', ''),
        },
        'proxy': {
            'enabled': proxy_enabled,
            'url': proxy.get('url', ''),
        },
        'chatwoot': {
            'enabled': chatwoot_enabled,
            'base_url': chatwoot.get('base_url', ''),
            'account_id': chatwoot.get('account_id', ''),
            'inbox_id': chatwoot.get('inbox_id', ''),
            'api_key': chatwoot.get('api_key', ''),
            'embed_enabled': chatwoot.get('embed_enabled', False),
            'embed_script': chatwoot.get('embed_script', ''),
        },
        'assemblyai': {
            'enabled': assemblyai_enabled,
            'api_key': assemblyai.get('api_key', ''),
        },
        'cloudflare_r2': {
            'enabled': r2_enabled,
            'account_id': r2.get('account_id', ''),
            'access_key_id': r2.get('access_key_id', ''),
            'secret_access_key': r2.get('secret_access_key', ''),
            'bucket': r2.get('bucket', ''),
            'custom_domain': r2.get('custom_domain', ''),
            'api_token': r2.get('api_token', ''),
        },
    })


# ─── Brevo ─────────────────────────────────────────────────────────

@integrations_bp.route('/api/settings/brevo', methods=['POST'])
@admin_required
def update_brevo():
    data = request.json or request.form
    enabled = data.get('enabled', False)
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    _, existing = get_integration('brevo')
    config = existing.copy()

    if enabled:
        api_key = data.get('api_key')
        if not api_key:
            return jsonify({'success': False, 'message': 'API Key é obrigatória quando Brevo está habilitado'}), 400
        config.update({
            'api_key': api_key,
            'email_subject': data.get('email_subject'),
            'email_template': data.get('email_template'),
            'template_mode': data.get('template_mode', 'simple'),
            'forgot_email_subject': data.get('forgot_email_subject'),
            'forgot_email_template': data.get('forgot_email_template'),
            'forgot_template_mode': data.get('forgot_template_mode', 'simple'),
        })

        # Sender info goes to support provider
        _, support = get_integration('support')
        support['sender_name'] = data.get('sender_name', support.get('sender_name', ''))
        support['sender_email'] = data.get('sender_email', support.get('sender_email', ''))
        set_integration('support', True, support)
    else:
        # Preserve existing credentials on disable — only update what is sent
        incoming_key = data.get('api_key')
        if incoming_key:
            config['api_key'] = incoming_key

    set_integration('brevo', enabled, config)
    return jsonify({'success': True, 'message': 'Configurações da Brevo atualizadas com sucesso'})


# ─── Evolution API ─────────────────────────────────────────────────

@integrations_bp.route('/api/settings/evolution', methods=['POST'])
@admin_required
def update_evolution():
    data = request.json or request.form
    enabled = data.get('enabled', False)
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    _, existing = get_integration('evolution')
    config = existing.copy()

    if enabled:
        url = data.get('url')
        api_key = data.get('api_key')
        version = data.get('version')
        instance = data.get('instance')

        if not url:
            return jsonify({'success': False, 'message': 'URL é obrigatória'}), 400
        if not api_key:
            return jsonify({'success': False, 'message': 'API Key é obrigatória'}), 400
        if not version:
            return jsonify({'success': False, 'message': 'Versão da API é obrigatória'}), 400
        if not instance:
            return jsonify({'success': False, 'message': 'Instância do WhatsApp é obrigatória'}), 400

        config.update({
            'url': url,
            'api_key': api_key,
            'version': version,
            'instance': instance,
            'message_template': data.get('message_template'),
            'template_mode': data.get('template_mode', 'simple'),
        })
    else:
        # Preserve existing credentials on disable — only update what is sent
        for field in ('url', 'api_key', 'version', 'instance', 'message_template', 'template_mode'):
            incoming = data.get(field)
            if incoming:
                config[field] = incoming

    set_integration('evolution', enabled, config)
    return jsonify({'success': True, 'message': 'Configurações da Evolution API atualizadas com sucesso'})


# ─── Evolution API — Detect version ───────────────────────────────

@integrations_bp.route('/api/settings/evolution/detect-version', methods=['POST'])
@admin_required
def detect_evolution_version():
    data = request.json or request.form
    url = data.get('url', '').rstrip('/')
    api_key = data.get('api_key')

    if not url or not api_key:
        return jsonify({'success': False, 'message': 'URL e API Key são obrigatórios'}), 400

    import requests as http_requests
    try:
        # Try v2 endpoint first
        resp = http_requests.get(
            f"{url}/instance/fetchInstances",
            headers={'apikey': api_key},
            timeout=10
        )
        if resp.status_code == 200:
            body = resp.json()
            if isinstance(body, list) and len(body) > 0:
                item = body[0]
                if isinstance(item, dict) and 'instance' in item and 'instanceName' in item['instance']:
                    return jsonify({'success': True, 'version': '2.x.x'})
            return jsonify({'success': True, 'version': '2.x.x'})

        # Fallback: try v1.8.x
        resp_v1 = http_requests.get(
            f"{url}/instance/list",
            headers={'apikey': api_key},
            timeout=10
        )
        if resp_v1.status_code == 200:
            return jsonify({'success': True, 'version': '1.8.x'})

        return jsonify({'success': False, 'message': f'Não foi possível detectar a versão (status {resp.status_code})'}), 400

    except http_requests.exceptions.ConnectionError:
        return jsonify({'success': False, 'message': 'Não foi possível conectar à Evolution API'}), 400
    except http_requests.exceptions.Timeout:
        return jsonify({'success': False, 'message': 'Timeout ao conectar à Evolution API'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ─── Evolution API — Fetch instances ──────────────────────────────

@integrations_bp.route('/api/settings/evolution/instances', methods=['POST'])
@admin_required
def fetch_evolution_instances():
    data = request.json or request.form
    url = data.get('url', '').rstrip('/')
    api_key = data.get('api_key')

    if not url or not api_key:
        return jsonify({'success': False, 'message': 'URL e API Key são obrigatórios'}), 400

    import requests as http_requests
    try:
        resp = http_requests.get(
            f"{url}/instance/fetchInstances",
            headers={'apikey': api_key},
            timeout=10
        )

        if resp.status_code != 200:
            return jsonify({'success': False, 'message': f'Erro da API: {resp.status_code}'}), 400

        body = resp.json()
        instances = []

        if isinstance(body, list):
            for item in body:
                if not isinstance(item, dict):
                    continue

                name = item.get('name', '')
                status = item.get('connectionStatus', 'unknown')
                owner_jid = item.get('ownerJid', '')

                phone = ''
                if owner_jid and '@' in owner_jid:
                    phone = owner_jid.split('@')[0]

                if name:
                    instances.append({
                        'name': name,
                        'status': status,
                        'phone': phone,
                    })

        return jsonify({'success': True, 'instances': instances})

    except http_requests.exceptions.ConnectionError:
        return jsonify({'success': False, 'message': 'Não foi possível conectar à Evolution API'}), 400
    except http_requests.exceptions.Timeout:
        return jsonify({'success': False, 'message': 'Timeout ao conectar à Evolution API'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ─── YouTube ───────────────────────────────────────────────────────

@integrations_bp.route('/api/settings/youtube', methods=['POST'])
@admin_required
def update_youtube():
    data = request.json or request.form
    enabled = data.get('enabled', False)
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    _, existing = get_integration('youtube')
    config = existing.copy()

    if enabled:
        client_id = data.get('client_id')
        client_secret = data.get('client_secret')

        if not client_id:
            return jsonify({'success': False, 'message': 'Client ID é obrigatório'}), 400
        if not client_secret:
            return jsonify({'success': False, 'message': 'Client Secret é obrigatório'}), 400

        config['client_id'] = client_id
        config['client_secret'] = client_secret
    else:
        # Preserve existing credentials on disable
        incoming_client_id = data.get('client_id')
        incoming_client_secret = data.get('client_secret')
        if incoming_client_id:
            config['client_id'] = incoming_client_id
        if incoming_client_secret:
            config['client_secret'] = incoming_client_secret

    set_integration('youtube', enabled, config)
    return jsonify({'success': True, 'message': 'Configurações do YouTube atualizadas com sucesso'})


# ─── VTurb ─────────────────────────────────────────────────────────

@integrations_bp.route('/api/settings/vturb', methods=['POST'])
@admin_required
def update_vturb():
    data = request.json or request.form
    enabled = data.get('enabled', False)
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    _, existing = get_integration('vturb')
    config = existing.copy()

    if enabled:
        api_key = data.get('api_key')
        if not api_key:
            return jsonify({'success': False, 'message': 'API Key é obrigatória quando VTurb está habilitado'}), 400
        config['api_key'] = api_key
    else:
        # Preserve existing api_key on disable (don't wipe credentials)
        incoming_api_key = data.get('api_key')
        if incoming_api_key:
            config['api_key'] = incoming_api_key

    # Always save org_id if provided
    org_id = data.get('org_id')
    if org_id is not None:
        config['org_id'] = org_id

    set_integration('vturb', enabled, config)
    return jsonify({'success': True, 'message': 'Configurações do VTurb atualizadas com sucesso'})


# ─── Proxy ─────────────────────────────────────────────────────────

@integrations_bp.route('/api/settings/proxy', methods=['POST'])
@admin_required
def update_proxy():
    data = request.json or request.form
    enabled = data.get('enabled', False)
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    _, existing = get_integration('proxy')
    config = existing.copy()

    if enabled:
        url = data.get('url')
        if not url:
            return jsonify({'success': False, 'message': 'URL do Proxy é obrigatória (ex: http://user:pass@host:port)'}), 400
        config['url'] = url
    else:
        # Preserve existing url on disable
        incoming_url = data.get('url')
        if incoming_url:
            config['url'] = incoming_url

    set_integration('proxy', enabled, config)
    return jsonify({'success': True, 'message': 'Configurações de Proxy atualizadas com sucesso'})


# ─── VTurb — List videos proxy ────────────────────────────────────

@integrations_bp.route('/api/settings/vturb/videos', methods=['GET'])
@admin_required
def list_vturb_videos():
    """Proxy to the VTurb analytics API to list player videos."""
    _, vturb = get_integration('vturb')
    api_key = vturb.get('api_key')

    if not api_key:
        return jsonify({'success': False, 'message': 'VTurb API Key não configurada. Acesse Integrações → VTurb.', 'videos': []}), 400

    search_query = request.args.get('q', '').strip()

    import requests as http_requests
    try:
        resp = http_requests.get(
            'https://analytics.vturb.net/players/list',
            headers={
                'X-Api-Token': api_key,
                'X-Api-Version': 'v1',
                'Content-Type': 'application/json',
                'Accept': '*/*',
            },
            timeout=15
        )

        if resp.status_code != 200:
            return jsonify({
                'success': False,
                'message': f'Erro da API VTurb: {resp.status_code}',
                'videos': []
            }), 400

        videos = resp.json()
        if not isinstance(videos, list):
            videos = []

        # Filter client-side if search query provided
        if search_query:
            q_lower = search_query.lower()
            videos = [
                v for v in videos
                if q_lower in v.get('name', '').lower() or q_lower in v.get('id', '').lower()
            ]

        return jsonify({'success': True, 'videos': videos})

    except http_requests.exceptions.ConnectionError:
        return jsonify({'success': False, 'message': 'Não foi possível conectar à API do VTurb.', 'videos': []}), 400
    except http_requests.exceptions.Timeout:
        return jsonify({'success': False, 'message': 'Timeout ao conectar à API do VTurb.', 'videos': []}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e), 'videos': []}), 500


# ─── Chatwoot ─────────────────────────────────────────────────────────

@integrations_bp.route('/api/settings/chatwoot', methods=['POST'])
@admin_required
def update_chatwoot():
    data = request.json or request.form
    enabled = data.get('enabled', False)
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    embed_enabled = data.get('embed_enabled', False)
    if isinstance(embed_enabled, str):
        embed_enabled = embed_enabled.lower() == 'true'

    _, existing = get_integration('chatwoot')
    config = existing.copy()

    # ── Embed mode (own Chatwoot widget) ──────────────────────────────
    # When embed is enabled, the sync API credentials are not required.
    config['embed_enabled'] = embed_enabled

    embed_script = data.get('embed_script', '').strip()
    if embed_script:
        config['embed_script'] = embed_script

    if embed_enabled and not config.get('embed_script'):
        return jsonify({'success': False, 'message': 'Cole o código embed do Chatwoot para ativar'}), 400

    # ── Sync / AI mode credentials ────────────────────────────────────
    if enabled:
        base_url = data.get('base_url', '').rstrip('/')
        account_id = data.get('account_id')
        inbox_id = data.get('inbox_id')
        api_key = data.get('api_key')

        if not base_url:
            return jsonify({'success': False, 'message': 'URL do Chatwoot é obrigatória'}), 400
        if not account_id:
            return jsonify({'success': False, 'message': 'Account ID é obrigatório'}), 400
        if not inbox_id:
            return jsonify({'success': False, 'message': 'Inbox ID é obrigatório'}), 400
        if not api_key:
            return jsonify({'success': False, 'message': 'API Access Token é obrigatório'}), 400

        config['base_url'] = base_url
        config['account_id'] = account_id
        config['inbox_id'] = inbox_id
        config['api_key'] = api_key
    else:
        # Preserve credentials if disabling
        for field, getter in [
            ('base_url', lambda v: v.rstrip('/')),
            ('account_id', lambda v: v),
            ('inbox_id', lambda v: v),
            ('api_key', lambda v: v),
        ]:
            incoming = data.get(field)
            if incoming:
                config[field] = getter(incoming)

    set_integration('chatwoot', enabled, config)
    return jsonify({'success': True, 'message': 'Configurações do Chatwoot atualizadas com sucesso'})


# ─── Chatwoot — Public embed endpoint (for members) ───────────────

@integrations_bp.route('/api/chatwoot/embed', methods=['GET'])
def get_chatwoot_embed():
    """Public endpoint: returns the embed script if the user has activated their own Chatwoot widget."""
    _, config = get_integration('chatwoot')
    embed_enabled = config.get('embed_enabled', False)
    embed_script = config.get('embed_script', '')

    return jsonify({
        'embed_enabled': bool(embed_enabled),
        'embed_script': embed_script if embed_enabled else '',
    })

# ─── AssemblyAI ──────────────────────────────────────────────────

@integrations_bp.route('/api/settings/assemblyai', methods=['POST'])
@admin_required
def update_assemblyai():
    data = request.json or request.form
    enabled = data.get('enabled', False)
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    _, existing = get_integration('assemblyai')
    config = existing.copy()

    if enabled:
        api_key = data.get('api_key')
        if not api_key:
            return jsonify({'success': False, 'message': 'API Key é obrigatória quando AssemblyAI está habilitado'}), 400
        config['api_key'] = api_key
    else:
        # Preserve existing credentials on disable
        incoming_api_key = data.get('api_key')
        if incoming_api_key:
            config['api_key'] = incoming_api_key

    set_integration('assemblyai', enabled, config)
    return jsonify({'success': True, 'message': 'Configurações da AssemblyAI atualizadas com sucesso'})


# ─── Cloudflare R2 ────────────────────────────────────────────────

@integrations_bp.route('/api/settings/cloudflare-r2', methods=['POST'])
@admin_required
def update_cloudflare_r2():
    """Save Cloudflare R2 credentials (preserves stored credentials when disabling)."""
    data = request.json or request.form
    enabled = data.get('enabled', False)
    if isinstance(enabled, str):
        enabled = enabled.lower() == 'true'

    _, existing = get_integration('cloudflare_r2')
    config = existing.copy()

    fields = ('account_id', 'access_key_id', 'secret_access_key', 'bucket', 'custom_domain')
    optional_fields = ('api_token',)

    if enabled:
        # When enabling, all required credentials must be present
        for f in fields:
            value = (data.get(f) or '').strip()
            if not value:
                labels = {
                    'account_id': 'Account ID',
                    'access_key_id': 'Access Key ID',
                    'secret_access_key': 'Secret Access Key',
                    'bucket': 'Bucket',
                    'custom_domain': 'Custom Domain (URL pública)',
                }
                return jsonify({'success': False, 'message': f'{labels[f]} é obrigatório'}), 400
            config[f] = value
        # Optional fields
        for f in optional_fields:
            incoming = data.get(f)
            if incoming is not None:
                config[f] = str(incoming).strip()
    else:
        # Preserve credentials when disabling — only update fields that came in
        for f in (*fields, *optional_fields):
            incoming = data.get(f)
            if incoming is not None and str(incoming).strip():
                config[f] = str(incoming).strip()

    set_integration('cloudflare_r2', enabled, config)

    if enabled:
        # Auto-configure bucket CORS via Cloudflare REST API (requires api_token)
        from integrations.cloudflare_r2 import apply_cors
        api_token = config.get('api_token') or config.get('access_key_id')
        cors_ok, cors_msg = apply_cors(
            config['account_id'],
            api_token,
            config['secret_access_key'],
            config['bucket'],
        )
        if cors_ok:
            return jsonify({
                'success': True,
                'message': 'Configurações do Cloudflare R2 salvas e CORS configurado automaticamente no bucket.'
            })
        else:
            # Non-fatal — credentials saved, but CORS needs manual setup
            return jsonify({
                'success': True,
                'cors_warning': cors_msg,
                'message': f'Configurações salvas. {cors_msg}'
            })

    return jsonify({'success': True, 'message': 'Configurações do Cloudflare R2 atualizadas com sucesso'})


@integrations_bp.route('/api/settings/cloudflare-r2/test', methods=['POST'])
@admin_required
def test_cloudflare_r2():
    """Test the provided R2 credentials by issuing a HEAD on the bucket."""
    from integrations.cloudflare_r2 import test_connection

    data = request.json or request.form
    account_id = (data.get('account_id') or '').strip()
    access_key_id = (data.get('access_key_id') or '').strip()
    secret_access_key = (data.get('secret_access_key') or '').strip()
    bucket = (data.get('bucket') or '').strip()

    if not all((account_id, access_key_id, secret_access_key, bucket)):
        return jsonify({'success': False, 'message': 'Preencha todos os campos antes de testar.'}), 400

    ok, message = test_connection(account_id, access_key_id, secret_access_key, bucket)
    status_code = 200 if ok else 400
    return jsonify({'success': ok, 'message': message}), status_code


@integrations_bp.route('/api/settings/cloudflare-r2/apply-cors', methods=['POST'])
@admin_required
def apply_cors_cloudflare_r2():
    """Apply (or refresh) CORS policy on the saved R2 bucket.

    Useful when the user changes the bucket or the automatic apply during save failed.
    Uses the credentials already stored in the database.
    """
    from integrations.cloudflare_r2 import get_client_from_config, apply_cors

    client, cfg = get_client_from_config()
    if client is None:
        return jsonify({'success': False, 'message': cfg}), 400  # cfg is error message here

    ok, message = apply_cors(
        cfg['account_id'],
        cfg['access_key_id'],
        cfg['secret_access_key'],
        cfg['bucket'],
    )
    status_code = 200 if ok else 400
    return jsonify({'success': ok, 'message': message}), status_code




@integrations_bp.route('/api/settings/cloudflare-r2/upload', methods=['POST'])
@admin_required
def upload_cloudflare_r2():
    """Upload a video file to R2 via server-side proxy (avoids browser CORS restrictions).

    Accepts multipart/form-data with:
        - file: the video file
        - content_type: optional MIME type override

    Returns: { success, public_url, key }
    """
    from integrations.cloudflare_r2 import upload_to_r2

    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Nenhum arquivo enviado'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'success': False, 'message': 'Nome de arquivo inválido'}), 400

    content_type = request.form.get('content_type') or file.content_type or 'video/mp4'

    result, error = upload_to_r2(file.stream, file.filename, content_type)
    if error:
        return jsonify({'success': False, 'message': error}), 400

    if not result.get('public_url'):
        return jsonify({
            'success': False,
            'message': 'Custom domain não configurado — defina-o em Integrações → Cloudflare R2.'
        }), 400

    return jsonify({'success': True, **result})


@integrations_bp.route('/api/settings/cloudflare-r2/presign', methods=['POST'])
@admin_required
def presign_cloudflare_r2_upload():
    """Generate a short-lived presigned PUT URL so the browser uploads directly to R2.

    Body JSON:
        - filename: original filename (used to build the object key)
        - content_type: MIME (e.g. 'video/mp4')

    Returns: { success, upload_url, public_url, key, headers, expires_in }
    """
    from integrations.cloudflare_r2 import presign_put

    data = request.json or {}
    filename = (data.get('filename') or '').strip()
    content_type = (data.get('content_type') or '').strip() or 'video/mp4'

    if not filename:
        return jsonify({'success': False, 'message': 'filename é obrigatório'}), 400

    result, error = presign_put(filename, content_type)
    if error:
        return jsonify({'success': False, 'message': error}), 400

    if not result.get('public_url'):
        return jsonify({
            'success': False,
            'message': 'Custom domain não configurado — defina-o em Integrações → Cloudflare R2.'
        }), 400

    return jsonify({'success': True, **result})

