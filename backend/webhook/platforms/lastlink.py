"""Parser para webhook LastLink."""


def parse_lastlink(data: dict) -> dict:
    """
    Formato LastLink:
    {
        "Event": "Purchase_Order_Confirmed" | "Payment_Refund" | "Payment_Chargeback",
        "Data": { "Buyer": { "Name": "...", "Email": "...", "PhoneNumber": "..." } }
    }
    """
    event = data.get('Event')
    buyer = data.get('Data', {}).get('Buyer', {})

    full_name = buyer.get('Name', '')
    name = full_name.split(" ")[0] if full_name else ''
    email = buyer.get('Email', '')
    phone = buyer.get('PhoneNumber', '')

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    if event == 'Purchase_Order_Confirmed':
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': {'source': 'lastlink', 'full_name': full_name}}

    if event in ('Payment_Refund', 'Payment_Chargeback'):
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': {'source': 'lastlink'}}

    return {'skip': True, 'message': 'Evento não processado'}
