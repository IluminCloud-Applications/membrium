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
    order = data.get('order') if isinstance(data.get('order'), dict) else {}
    customer = order.get('customer') if isinstance(order.get('customer'), dict) else {}

    name = customer.get('first_name', '') or (customer.get('full_name', '').split(' ')[0] if customer.get('full_name') else '')
    email = customer.get('email', '')
    phone = customer.get('phone', '')
    full_name = customer.get('full_name', '')

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    metadata = {'source': 'cartpanda', 'full_name': full_name}
    if order.get('id') or order.get('number'):
        metadata['transaction_id'] = str(order.get('id') or order.get('number'))
    if order.get('payment_gateway') or order.get('payment_method'):
        metadata['payment_method'] = order.get('payment_gateway') or order.get('payment_method')

    if event == 'order.paid':
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': metadata}

    if event in ('order.refunded', 'order.chargeback', 'order.canceled'):
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': metadata}

    return {'skip': True, 'message': 'Evento não processado'}
