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
    customer = data.get('customer') if isinstance(data.get('customer'), dict) else {}
    payment = data.get('payment') if isinstance(data.get('payment'), dict) else {}
    utm = data.get('utm') if isinstance(data.get('utm'), dict) else {}

    full_name = customer.get('name', '')
    name = full_name.split(" ")[0] if full_name else ''
    email = customer.get('email', '')
    phone = customer.get('phone_number', '')

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    metadata = {'source': 'kirvano', 'full_name': full_name}
    if customer.get('document'):
        metadata['doc'] = customer.get('document')
    if data.get('sale_id') or data.get('checkout_id'):
        metadata['transaction_id'] = data.get('sale_id') or data.get('checkout_id')
    if payment.get('method') or data.get('payment_method'):
        metadata['payment_method'] = payment.get('method') or data.get('payment_method')
    if utm:
        utms = {k: v for k, v in utm.items() if v}
        if utms:
            metadata['utms'] = utms

    if event == 'SALE_APPROVED':
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': metadata}

    if event in ('SALE_REFUNDED', 'SALE_CHARGEBACK', 'SALE_CANCELED'):
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': metadata}

    return {'skip': True, 'message': 'Evento não processado'}
