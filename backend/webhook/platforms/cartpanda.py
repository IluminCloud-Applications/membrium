"""Parser para webhook CartPanda."""


def parse_cartpanda(data: dict) -> dict:
    """
    Formato CartPanda:
    {
        "event": "order.paid" | "order.refunded",
        "order": { "customer": { "full_name": "...", "first_name": "...", "email": "...", "phone": "..." } }
    }
    """
    event = data.get('event')
    order = data.get('order', {})
    customer = order.get('customer', {})

    name = customer.get('first_name', '')
    email = customer.get('email', '')
    phone = customer.get('phone', '')
    full_name = customer.get('full_name', '')

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    if event == 'order.paid':
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': {'source': 'cartpanda', 'full_name': full_name}}

    if event == 'order.refunded':
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': {'source': 'cartpanda'}}

    return {'skip': True, 'message': 'Evento não processado'}
