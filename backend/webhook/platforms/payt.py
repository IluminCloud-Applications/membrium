"""Parser para webhook Payt."""


def _extract_extra_data(data: dict) -> dict:
    """Extrai dados extras do payload da Payt para salvar em extra_data."""
    customer = data.get('customer') if isinstance(data.get('customer'), dict) else {}
    transaction = data.get('transaction') if isinstance(data.get('transaction'), dict) else {}
    link = data.get('link') if isinstance(data.get('link'), dict) else {}
    sources = link.get('sources') if isinstance(link.get('sources'), dict) else {}

    extra = {
        'transaction_id': data.get('transaction_id'),
        'seller_id': data.get('seller_id'),
        'customer_code': customer.get('code'),
        'payment_method': transaction.get('payment_method'),
        'customer': customer,
    }

    # UTMs e source (sources pode vir como lista vazia [] da Payt quando não há rastreamento)
    extra['utms'] = {
        'src': sources.get('src'),
        'utm_term': sources.get('utm_term'),
        'utm_medium': sources.get('utm_medium'),
        'utm_source': sources.get('utm_source'),
        'utm_content': sources.get('utm_content'),
        'utm_campaign': sources.get('utm_campaign'),
    }

    return extra


def parse_payt(data: dict) -> dict:
    """
    Formato Payt:
    {
        "status": "paid" | "canceled" | "chargeback",
        "customer": { "name": "...", "email": "...", "phone": "...", "code": "..." },
        "transaction_id": "...",
        "seller_id": "...",
        "transaction": { "payment_method": "..." },
        "link": { "sources": { "src": "...", "utm_*": "..." } }
    }
    """
    status = data.get('status')
    customer = data.get('customer') if isinstance(data.get('customer'), dict) else {}

    full_name = customer.get('name', '') or ''
    name = full_name.split(" ")[0] if full_name else ''
    email = customer.get('email', '') or ''
    phone = customer.get('phone', '') or ''

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    extra_data = _extract_extra_data(data)
    metadata = {'source': 'payt', 'full_name': full_name, 'payt': extra_data}

    if status == 'paid':
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': metadata}

    if status in ('canceled', 'chargeback'):
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': {'source': 'payt'}}

    return {'skip': True, 'message': 'Status não processado'}
