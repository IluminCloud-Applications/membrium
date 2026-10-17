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
    event_data = data.get('data') if isinstance(data.get('data'), dict) else {}
    buyer = event_data.get('buyer') if isinstance(event_data.get('buyer'), dict) else {}
    purchase = event_data.get('purchase') if isinstance(event_data.get('purchase'), dict) else {}
    product = event_data.get('product') if isinstance(event_data.get('product'), dict) else {}
    payment = purchase.get('payment') if isinstance(purchase.get('payment'), dict) else {}
    tracking = purchase.get('tracking') if isinstance(purchase.get('tracking'), dict) else {}

    full_name = buyer.get('name', '')
    name = full_name.split(" ")[0] if full_name else ''
    email = buyer.get('email', '')
    phone = buyer.get('checkout_phone', '')

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    metadata = {'source': 'hotmart', 'full_name': full_name}
    if buyer.get('document'):
        metadata['doc'] = buyer.get('document')
    if purchase.get('transaction'):
        metadata['transaction_id'] = purchase.get('transaction')
    if payment.get('type'):
        metadata['payment_method'] = payment.get('type')
    if product.get('name'):
        metadata['product_name'] = product.get('name')
    if tracking:
        utms = {k: v for k, v in {
            'src': tracking.get('source') or tracking.get('src'),
            'sck': tracking.get('source_sck') or tracking.get('sck'),
            'utm_source': tracking.get('utm_source'),
            'utm_medium': tracking.get('utm_medium'),
            'utm_campaign': tracking.get('utm_campaign'),
            'utm_content': tracking.get('utm_content'),
            'utm_term': tracking.get('utm_term'),
        }.items() if v}
        if utms:
            metadata['utms'] = utms

    if event == 'PURCHASE_APPROVED':
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': metadata}

    if event in ('PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK', 'PURCHASE_CANCELED', 'PURCHASE_PROTESTED'):
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': metadata}

    return {'skip': True, 'message': 'Evento não processado'}
