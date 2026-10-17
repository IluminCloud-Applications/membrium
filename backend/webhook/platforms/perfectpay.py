"""Parser para webhook PerfectPay."""


def parse_perfectpay(data: dict) -> dict:
    """
    Formato PerfectPay:
    {
        "sale_status_enum": 2,  // 2 = aprovado, 7 = reembolso, 9 = chargeback
        "customer": { "full_name": "...", "email": "...", "phone_number": "..." }
    }
    """
    sale_status = data.get('sale_status_enum')
    customer = data.get('customer') if isinstance(data.get('customer'), dict) else {}
    product = data.get('product') if isinstance(data.get('product'), dict) else {}
    metadata_utm = data.get('metadata') if isinstance(data.get('metadata'), dict) else {}

    full_name = customer.get('full_name', '')
    name = full_name.split(" ")[0] if full_name else ''
    email = customer.get('email', '')
    phone = customer.get('phone_number', '')

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    metadata = {'source': 'perfectpay', 'full_name': full_name}
    if customer.get('identification_number'):
        metadata['doc'] = customer.get('identification_number')
    if data.get('code'):
        metadata['transaction_id'] = str(data.get('code'))
    if data.get('payment_type_description') or data.get('payment_method'):
        metadata['payment_method'] = data.get('payment_type_description') or data.get('payment_method')
    if product.get('name'):
        metadata['product_name'] = product.get('name')
    if metadata_utm:
        utms = {k: v for k, v in metadata_utm.items() if v and k.startswith(('utm_', 'src', 'sck'))}
        if utms:
            metadata['utms'] = utms

    if sale_status == 2:
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': metadata}

    if sale_status in (7, 9):
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': metadata}

    return {'skip': True, 'message': 'Status não processado'}
