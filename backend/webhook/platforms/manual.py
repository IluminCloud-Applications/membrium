"""Parser para webhook Manual (n8n ou qualquer integração customizada)."""


def parse_manual(data: dict) -> dict:
    """
    Formato esperado:
    {
        "status": "add" | "remove",
        "name": "João",
        "email": "joao@email.com",
        "phone": "11999999999"  (opcional)
    }
    """
    status = data.get('status')
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone', '')

    if not status or not name or not email:
        return {'error': 'Status, nome e email são obrigatórios'}

    if status not in ('add', 'remove'):
        return {'error': 'Status deve ser "add" ou "remove"'}

    return {
        'name': name,
        'email': email,
        'add': status == 'add',
        'phone': phone,
        'metadata': {'source': 'manual'},
    }
