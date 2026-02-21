"""
Rotas de unsubscribe — página simples para o aluno sair da lista de emails.

Endpoints:
  GET  /unsubscribe?email=xxx  -> Página HTML de confirmação
  POST /unsubscribe            -> Confirma o unsubscribe (adiciona à blacklist)
"""
from flask import Blueprint, request, jsonify
from models import db, EmailBlacklist, Settings
import logging

logger = logging.getLogger(__name__)

unsubscribe_bp = Blueprint('unsubscribe', __name__)


@unsubscribe_bp.route('/unsubscribe', methods=['GET'])
def unsubscribe_page():
    """Exibe página HTML simples de confirmação de unsubscribe."""
    email = request.args.get('email', '')
    settings = Settings.query.first()
    platform_name = 'Plataforma'
    if settings:
        from models import Admin
        admin = Admin.query.first()
        if admin:
            platform_name = admin.platform_name or 'Plataforma'

    return _render_unsubscribe_html(email, platform_name)


@unsubscribe_bp.route('/unsubscribe', methods=['POST'])
def confirm_unsubscribe():
    """Confirma o unsubscribe e adiciona email à blacklist."""
    data = request.json or request.form
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'success': False, 'message': 'Email é obrigatório'}), 400

    # Verificar se já está na blacklist
    existing = EmailBlacklist.query.filter_by(email=email).first()
    if existing:
        return jsonify({'success': True, 'message': 'Email já foi removido da lista'})

    # Adicionar à blacklist
    try:
        blacklist_entry = EmailBlacklist(email=email)
        db.session.add(blacklist_entry)
        db.session.commit()
        logger.info(f"Email {email} adicionado à blacklist (unsubscribe)")
        return jsonify({'success': True, 'message': 'Email removido com sucesso'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao fazer unsubscribe: {str(e)}")
        return jsonify({'success': False, 'message': 'Erro ao processar unsubscribe'}), 500


def _render_unsubscribe_html(email: str, platform_name: str) -> str:
    """Gera a página HTML de confirmação de unsubscribe."""
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cancelar Inscrição - {platform_name}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }}
        .card {{
            background: white;
            border-radius: 16px;
            padding: 48px 40px;
            max-width: 480px;
            width: 100%;
            text-align: center;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }}
        .icon {{
            width: 64px;
            height: 64px;
            background: #fef2f2;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 28px;
        }}
        h1 {{
            font-size: 22px;
            color: #111;
            margin-bottom: 12px;
        }}
        p {{
            color: #666;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 8px;
        }}
        .email-display {{
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 12px 16px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 14px;
            color: #374151;
            word-break: break-all;
        }}
        .btn {{
            display: inline-block;
            padding: 12px 32px;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
            margin-top: 16px;
        }}
        .btn-danger {{
            background: #ef4444;
            color: white;
        }}
        .btn-danger:hover {{ background: #dc2626; }}
        .btn-danger:disabled {{
            background: #9ca3af;
            cursor: not-allowed;
        }}
        .result {{
            margin-top: 20px;
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 14px;
            display: none;
        }}
        .result.success {{
            background: #f0fdf4;
            color: #166534;
            border: 1px solid #bbf7d0;
        }}
        .result.error {{
            background: #fef2f2;
            color: #991b1b;
            border: 1px solid #fecaca;
        }}
        .footer {{
            margin-top: 24px;
            font-size: 13px;
            color: #9ca3af;
        }}
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">📧</div>
        <h1>Cancelar Inscrição</h1>
        <p>Tem certeza que deseja parar de receber emails de <strong>{platform_name}</strong>?</p>

        <div class="email-display">{email}</div>

        <p style="font-size: 13px; color: #9ca3af;">
            Ao confirmar, você não receberá mais emails de notificação.
        </p>

        <button class="btn btn-danger" id="confirmBtn" onclick="confirmUnsubscribe()">
            Confirmar Cancelamento
        </button>

        <div class="result" id="resultMsg"></div>

        <div class="footer">
            {platform_name}
        </div>
    </div>

    <script>
        async function confirmUnsubscribe() {{
            const btn = document.getElementById('confirmBtn');
            const result = document.getElementById('resultMsg');
            btn.disabled = true;
            btn.textContent = 'Processando...';

            try {{
                const resp = await fetch('/unsubscribe', {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify({{ email: '{email}' }})
                }});
                const data = await resp.json();

                result.style.display = 'block';
                if (data.success) {{
                    result.className = 'result success';
                    result.textContent = '✅ ' + data.message;
                    btn.style.display = 'none';
                }} else {{
                    result.className = 'result error';
                    result.textContent = '❌ ' + (data.message || 'Erro ao processar');
                    btn.disabled = false;
                    btn.textContent = 'Tentar novamente';
                }}
            }} catch (e) {{
                result.style.display = 'block';
                result.className = 'result error';
                result.textContent = '❌ Erro de conexão. Tente novamente.';
                btn.disabled = false;
                btn.textContent = 'Tentar novamente';
            }}
        }}
    </script>
</body>
</html>""", 200, {{'Content-Type': 'text/html'}}
