"""Parser para webhook Monetizze."""


def parse_monetizze(data: dict) -> dict:
    """
    Formato Monetizze:
    {
        "tipoPostback": { "codigo": 2 },  // 2 = aprovado, 4 = reembolso, 5 = chargeback
        "comprador": { "nome": "...", "email": "...", "telefone": "..." }
    }
    """
    tipo_postback = data.get('tipoPostback', {})
    codigo = tipo_postback.get('codigo')
    comprador = data.get('comprador', {})

    full_name = comprador.get('nome', '')
    name = full_name.split(" ")[0] if full_name else ''
    email = comprador.get('email', '')
    phone = comprador.get('telefone', '')

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    if codigo == 2:
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': {'source': 'monetizze', 'full_name': full_name}}

    if codigo in (4, 5):
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': {'source': 'monetizze'}}

    return {'skip': True, 'message': 'Status não processado'}
