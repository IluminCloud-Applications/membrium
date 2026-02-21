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
    customer = data.get('customer', {})

    full_name = customer.get('full_name', '')
    name = full_name.split(" ")[0] if full_name else ''
    email = customer.get('email', '')
    phone = customer.get('phone_number', '')

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    if sale_status == 2:
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': {'source': 'perfectpay', 'full_name': full_name}}

    if sale_status in (7, 9):
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': {'source': 'perfectpay'}}

    return {'skip': True, 'message': 'Status não processado'}
