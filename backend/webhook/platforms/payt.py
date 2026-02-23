"""Parser para webhook Payt."""


def _extract_extra_data(data: dict) -> dict:
    """Extrai dados extras do payload da Payt para salvar em extra_data."""
    extra = {
        'transaction_id': data.get('transaction_id'),
        'seller_id': data.get('seller_id'),
        'customer_code': data.get('customer', {}).get('code'),
        'payment_method': data.get('transaction', {}).get('payment_method'),
    }

    # UTMs e source
    sources = data.get('link', {}).get('sources', {})
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
    customer = data.get('customer', {})

    full_name = customer.get('name', '')
    name = full_name.split(" ")[0] if full_name else ''
    email = customer.get('email', '')
    phone = customer.get('phone', '')

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    extra_data = _extract_extra_data(data)
    metadata = {'source': 'payt', 'full_name': full_name, 'payt': extra_data}

    if status == 'paid':
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': metadata}

    if status in ('canceled', 'chargeback'):
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': {'source': 'payt'}}

    return {'skip': True, 'message': 'Status não processado'}
