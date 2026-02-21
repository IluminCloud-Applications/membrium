"""Parser para webhook Payt."""


def parse_payt(data: dict) -> dict:
    """
    Formato Payt:
    {
        "status": "paid" | "canceled" | "chargeback",
        "customer": { "name": "...", "email": "...", "phone": "..." }
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

    if status == 'paid':
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': {'source': 'payt', 'full_name': full_name}}

    if status in ('canceled', 'chargeback'):
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': {'source': 'payt'}}

    return {'skip': True, 'message': 'Status não processado'}
