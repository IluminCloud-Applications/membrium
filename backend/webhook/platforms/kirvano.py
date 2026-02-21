"""Parser para webhook Kirvano."""


def parse_kirvano(data: dict) -> dict:
    """
    Formato Kirvano:
    {
        "event": "SALE_APPROVED" | "SALE_REFUNDED" | "SALE_CHARGEBACK",
        "customer": { "name": "...", "email": "...", "phone_number": "..." }
    }
    """
    event = data.get('event')
    customer = data.get('customer', {})

    full_name = customer.get('name', '')
    name = full_name.split(" ")[0] if full_name else ''
    email = customer.get('email', '')
    phone = customer.get('phone_number', '')

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    if event == 'SALE_APPROVED':
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': {'source': 'kirvano', 'full_name': full_name}}

    if event in ('SALE_REFUNDED', 'SALE_CHARGEBACK'):
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': {'source': 'kirvano'}}

    return {'skip': True, 'message': 'Evento não processado'}
