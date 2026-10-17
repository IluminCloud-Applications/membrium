"""Parser para webhook Monetizze."""


def parse_monetizze(data: dict) -> dict:
    """
    Formato Monetizze:
    {
        "tipoPostback": { "codigo": 2 },  // 2 = aprovado, 4 = reembolso, 5 = chargeback
        "comprador": { "nome": "...", "email": "...", "telefone": "..." }
    }
    """
    tipo_postback = data.get('tipoPostback') if isinstance(data.get('tipoPostback'), dict) else {}
    codigo = tipo_postback.get('codigo')
    comprador = data.get('comprador') if isinstance(data.get('comprador'), dict) else {}
    venda = data.get('venda') if isinstance(data.get('venda'), dict) else {}
    produto = data.get('produto') if isinstance(data.get('produto'), dict) else {}

    full_name = comprador.get('nome', '')
    name = full_name.split(" ")[0] if full_name else ''
    email = comprador.get('email', '')
    phone = comprador.get('telefone', '')

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    metadata = {'source': 'monetizze', 'full_name': full_name}
    if comprador.get('cnpj_cpf'):
        metadata['doc'] = comprador.get('cnpj_cpf')
    if venda.get('codigo'):
        metadata['transaction_id'] = str(venda.get('codigo'))
    if venda.get('formaPagamento'):
        metadata['payment_method'] = venda.get('formaPagamento')
    if produto.get('nome'):
        metadata['product_name'] = produto.get('nome')

    if str(codigo) == '2' or codigo == 2:
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': metadata}

    if str(codigo) in ('4', '5') or codigo in (4, 5):
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': metadata}

    return {'skip': True, 'message': 'Status não processado'}
