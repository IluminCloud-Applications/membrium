"""
Rotas de webhook — ponto de entrada para todas as plataformas.
Registra as URLs e despacha para o processador correto.
"""
from flask import Blueprint, request, jsonify
from models import Course
from .platforms.manual import parse_manual
from .platforms.payt import parse_payt
from .platforms.cartpanda import parse_cartpanda
from .platforms.kiwify import parse_kiwify
from .platforms.hotmart import parse_hotmart
from .platforms.monetizze import parse_monetizze
from .platforms.perfectpay import parse_perfectpay
from .platforms.kirvano import parse_kirvano
from .platforms.lastlink import parse_lastlink
from .platforms.activecampaign import parse_activecampaign
from .core import process_student
import logging

logger = logging.getLogger(__name__)

webhook_bp = Blueprint('webhook', __name__)

# Mapa de plataformas → funções de parsing
PLATFORM_PARSERS = {
    'manual': parse_manual,
    'payt': parse_payt,
    'cartpanda': parse_cartpanda,
    'kiwify': parse_kiwify,
    'hotmart': parse_hotmart,
    'monetizze': parse_monetizze,
    'perfectpay': parse_perfectpay,
    'kirvano': parse_kirvano,
    'lastlink': parse_lastlink,
}

# Lista de plataformas suportadas (para o frontend)
SUPPORTED_PLATFORMS = [
    {'id': 'hotmart', 'name': 'Hotmart', 'logo': '/platforms/hotmart.png'},
    {'id': 'kiwify', 'name': 'Kiwify', 'logo': '/platforms/kiwify.png'},
    {'id': 'payt', 'name': 'Payt', 'logo': '/platforms/payt.png'},
    {'id': 'monetizze', 'name': 'Monetizze', 'logo': '/platforms/monetizze.png'},
    {'id': 'perfectpay', 'name': 'PerfectPay', 'logo': '/platforms/perfectpay.png'},
    {'id': 'kirvano', 'name': 'Kirvano', 'logo': '/platforms/kirvano.png'},
    {'id': 'lastlink', 'name': 'LastLink', 'logo': '/platforms/lastlink.png'},
    {'id': 'cartpanda', 'name': 'CartPanda', 'logo': '/platforms/cartpanda.svg'},
    {'id': 'activecampaign', 'name': 'ActiveCampaign', 'logo': '/platforms/active.png'},
    {'id': 'manual', 'name': 'API (n8n)', 'logo': '/platforms/n8n.webp'},
]


@webhook_bp.route('/api/webhook/platforms', methods=['GET'])
def list_platforms():
    """Retorna a lista de plataformas suportadas e a base URL para webhook."""
    # Detecta base URL (funciona em dev e produção com reverse proxy)
    if request.headers.get('X-Forwarded-Proto') and request.headers.get('X-Forwarded-Host'):
        base_url = f"{request.headers.get('X-Forwarded-Proto')}://{request.headers.get('X-Forwarded-Host')}"
    else:
        base_url = request.url_root.rstrip('/')

    return jsonify({
        'platforms': SUPPORTED_PLATFORMS,
        'base_url': base_url,
    }), 200


@webhook_bp.route('/webhook/<platform>/<uuid>', methods=['POST'])
def receive_webhook(platform, uuid):
    """Rota principal de webhook — recebe dados de qualquer plataforma."""
    course = Course.query.filter_by(uuid=uuid).first()
    if not course:
        return jsonify({'error': 'Curso não encontrado'}), 404

    # ActiveCampaign tem tratamento especial (form data + query param)
    if platform == 'activecampaign':
        return _handle_activecampaign(course)

    # Verifica se a plataforma é suportada
    parser = PLATFORM_PARSERS.get(platform)
    if not parser:
        return jsonify({'error': 'Plataforma não suportada'}), 400

    data = request.json
    if not data:
        return jsonify({'error': 'Dados da requisição não encontrados'}), 400

    # Parseia os dados (cada plataforma normaliza para o formato padrão)
    result = parser(data)

    if result.get('error'):
        return jsonify({'error': result['error']}), 400

    if result.get('skip'):
        return jsonify({'message': result.get('message', 'Evento não processado')}), 200

    return process_student(
        nome=result['name'],
        email=result['email'],
        course_id=course.id,
        add=result['add'],
        phone=result.get('phone'),
        extra_data=result.get('metadata'),
    )


def _handle_activecampaign(course):
    """Tratamento especial para ActiveCampaign (envia via form data)."""
    status = request.args.get('status')
    if not status:
        return jsonify({'error': 'O parâmetro status é obrigatório'}), 400

    data = request.form.to_dict()
    if not data:
        data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({'error': 'Dados da requisição não encontrados'}), 400

    result = parse_activecampaign(data, status)

    if result.get('error'):
        return jsonify({'error': result['error']}), 400

    if result.get('skip'):
        return jsonify({'message': result.get('message', 'Evento não processado')}), 200

    return process_student(
        nome=result['name'],
        email=result['email'],
        course_id=course.id,
        add=result['add'],
        phone=result.get('phone'),
        extra_data=result.get('metadata'),
    )
