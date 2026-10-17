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
    customer = data.get('Customer') if isinstance(data.get('Customer'), dict) else {}
    product = data.get('Product') if isinstance(data.get('Product'), dict) else {}
    tracking = data.get('TrackingParameters') if isinstance(data.get('TrackingParameters'), dict) else {}

    name = customer.get('first_name', '') or (customer.get('full_name', '').split(' ')[0] if customer.get('full_name') else '')
    email = customer.get('email', '')
    phone = customer.get('mobile', '')

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    metadata = {'source': 'kiwify'}
    if customer.get('full_name'):
        metadata['full_name'] = customer.get('full_name')
    if customer.get('CPF'):
        metadata['doc'] = customer.get('CPF')
    if data.get('order_id'):
        metadata['transaction_id'] = data.get('order_id')
    if data.get('payment_method'):
        metadata['payment_method'] = data.get('payment_method')
    if product.get('product_name'):
        metadata['product_name'] = product.get('product_name')
    if tracking:
        utms = {k: v for k, v in tracking.items() if v}
        if utms:
            metadata['utms'] = utms

    if order_status == 'paid':
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': metadata}

    if order_status in ('refunded', 'chargedback', 'canceled'):
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': metadata}

    return {'skip': True, 'message': 'Status não processado'}
