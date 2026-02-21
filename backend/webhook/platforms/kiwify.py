"""Parser para webhook Kiwify."""


def parse_kiwify(data: dict) -> dict:
    """
    Formato Kiwify:
    {
        "order_status": "paid" | "refunded" | "chargedback",
        "Customer": { "first_name": "...", "email": "...", "mobile": "..." }
    }
    """
    order_status = data.get('order_status')
    customer = data.get('Customer', {})

    name = customer.get('first_name', '')
    email = customer.get('email', '')
    phone = customer.get('mobile', '')

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    if order_status == 'paid':
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': {'source': 'kiwify'}}

    if order_status in ('refunded', 'chargedback'):
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': {'source': 'kiwify'}}

    return {'skip': True, 'message': 'Status não processado'}
