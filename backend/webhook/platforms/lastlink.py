"""Parser para webhook LastLink."""
from urllib.parse import urlparse, parse_qs
import logging

logger = logging.getLogger(__name__)

# Eventos de concessão / ativação de acesso
ADD_EVENTS = (
    'purchase_order_confirmed',
    'product_access_started',
    'purchase_order_approved',
    'order_confirmed',
    'order_approved',
    'access_started',
    'product_access_created',
)

# Eventos de revogação / reembolso / cancelamento de acesso
REMOVE_EVENTS = (
    'payment_refund',
    'payment_chargeback',
    'product_access_ended',
    'product_access_revoked',
    'product_access_cancelled',
    'purchase_order_canceled',
    'order_canceled',
    'payment_canceled',
    'subscription_canceled',
)


def _extract_utms(payload_data: dict, purchase: dict) -> dict:
    """Extrai parâmetros de UTM e tracking (src, sck, etc.) do payload ou da URL de origem."""
    utm = payload_data.get('Utm') or payload_data.get('utm') or {}
    if not isinstance(utm, dict):
        utm = {}

    origin_url = purchase.get('OriginUrl') or purchase.get('origin_url') or ''
    url_params = {}
    if origin_url and '?' in origin_url:
        try:
            parsed = parse_qs(urlparse(origin_url).query)
            url_params = {k: v[0] for k, v in parsed.items() if v}
        except Exception:
            pass

    return {
        'src': utm.get('Src') or utm.get('src') or url_params.get('src'),
        'sck': utm.get('Sck') or utm.get('sck') or url_params.get('sck'),
        'utm_source': utm.get('UtmSource') or utm.get('utm_source') or url_params.get('utm_source'),
        'utm_medium': utm.get('UtmMedium') or utm.get('utm_medium') or url_params.get('utm_medium'),
        'utm_campaign': utm.get('UtmCampaign') or utm.get('utm_campaign') or url_params.get('utm_campaign'),
        'utm_term': utm.get('UtmTerm') or utm.get('utm_term') or url_params.get('utm_term'),
        'utm_content': utm.get('UtmContent') or utm.get('utm_content') or url_params.get('utm_content'),
        'vtid': utm.get('Vtid') or utm.get('vtid') or url_params.get('vtid'),
    }


def parse_lastlink(data: dict) -> dict:
    """
    Parser robusto para LastLink:
    - Suporta 'Purchase_Order_Confirmed' (comprador, utms, src/sck, transação, etc.)
    - Suporta 'Product_Access_Started' como fallback de liberação imediata (quando vem Member ao invés de Buyer)
    - Suporta 'Payment_Refund', 'Payment_Chargeback', 'Product_Access_Ended', etc. para remoção
    """
    if not isinstance(data, dict):
        return {'error': 'Payload inválido'}

    event = (data.get('Event') or data.get('event') or '').strip()
    event_lower = event.lower()

    payload_data = data.get('Data') or data.get('data') or {}
    if not isinstance(payload_data, dict):
        payload_data = {}

    buyer = payload_data.get('Buyer') or payload_data.get('buyer') or {}
    member = payload_data.get('Member') or payload_data.get('member') or {}

    # Email: busca em Buyer ou Member
    email = (buyer.get('Email') or buyer.get('email') or member.get('Email') or member.get('email') or '').strip()

    # Nome: busca em Buyer ou Member; fallback para usuário do email
    full_name = (buyer.get('Name') or buyer.get('name') or member.get('Name') or member.get('name') or '').strip()
    if not full_name and email:
        username = email.split('@')[0]
        derived = username.replace('.', ' ').replace('_', ' ').replace('-', ' ').title().strip()
        full_name = derived or 'Aluno'

    name = full_name.split()[0] if full_name else 'Aluno'

    # Telefone: busca em Buyer ou Member
    phone = (buyer.get('PhoneNumber') or buyer.get('phone') or buyer.get('phone_number') or member.get('PhoneNumber') or member.get('phone') or '').strip()

    if not email:
        return {'error': 'Email do comprador/membro é obrigatório'}

    purchase = payload_data.get('Purchase') or payload_data.get('purchase') or {}
    payment_info = purchase.get('Payment') or purchase.get('payment') or {}
    seller = payload_data.get('Seller') or payload_data.get('seller') or {}
    offer = payload_data.get('Offer') or payload_data.get('offer') or {}
    products = payload_data.get('Products') or payload_data.get('products') or []
    product = payload_data.get('Product') or payload_data.get('product') or (products[0] if products else {})

    document = buyer.get('Document') or buyer.get('document') or ''
    transaction_id = purchase.get('PaymentId') or purchase.get('payment_id') or ''
    payment_method = payment_info.get('PaymentMethod') or payment_info.get('payment_method') or ''
    customer_code = buyer.get('Id') or member.get('Id') or ''
    seller_id = seller.get('Id') or seller.get('id') or ''

    utms = _extract_utms(payload_data, purchase)

    # Detalhes ricos para salvar em extra_data
    metadata = {
        'source': 'lastlink',
        'full_name': full_name,
        'doc': document,
        'document': document,
        'transaction_id': transaction_id,
        'payment_method': payment_method,
        'seller_id': seller_id,
        'customer_code': customer_code,
        'customer': buyer or member,
        'utms': utms,
        'lastlink': {
            'event': event,
            'event_id': data.get('Id'),
            'created_at': data.get('CreatedAt'),
            'is_test': data.get('IsTest', False),
            'product_name': product.get('Name'),
            'product_id': product.get('Id'),
            'offer_name': offer.get('Name'),
            'offer_id': offer.get('Id'),
            'payment_id': transaction_id,
            'payment_method': payment_method,
            'payment_date': purchase.get('PaymentDate'),
            'price': purchase.get('Price', {}).get('Value') if isinstance(purchase.get('Price'), dict) else purchase.get('Price'),
            'invoice_url': purchase.get('InvoiceUrl'),
            'origin_url': purchase.get('OriginUrl'),
            'coupon': purchase.get('Coupon'),
            'access_type': payload_data.get('AccessType'),
            'access_started_at': payload_data.get('AccessStartedAt'),
            'access_ended_at': payload_data.get('AccessEndedAt'),
            'utms': utms,
        }
    }

    if event_lower in ADD_EVENTS:
        return {
            'name': name,
            'email': email,
            'add': True,
            'phone': phone,
            'metadata': metadata,
        }

    if event_lower in REMOVE_EVENTS:
        return {
            'name': name,
            'email': email,
            'add': False,
            'phone': phone,
            'metadata': metadata,
        }

    return {'skip': True, 'message': f'Evento "{event}" não processado'}

