"""Parser para webhook Hotmart."""


def parse_hotmart(data: dict) -> dict:
    """
    Formato Hotmart:
    {
        "event": "PURCHASE_APPROVED" | "PURCHASE_REFUNDED" | "PURCHASE_CHARGEBACK",
        "data": { "buyer": { "name": "...", "email": "...", "checkout_phone": "..." } }
    }
    """
    event = data.get('event')
    event_data = data.get('data', {})
    buyer = event_data.get('buyer', {})

    full_name = buyer.get('name', '')
    name = full_name.split(" ")[0] if full_name else ''
    email = buyer.get('email', '')
    phone = buyer.get('checkout_phone', '')

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    if event == 'PURCHASE_APPROVED':
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': {'source': 'hotmart', 'full_name': full_name}}

    if event in ('PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK'):
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': {'source': 'hotmart'}}

    return {'skip': True, 'message': 'Evento não processado'}
