"""Parser para webhook ActiveCampaign."""


def parse_activecampaign(data: dict, status: str) -> dict:
    """
    Formato ActiveCampaign (via form data ou JSON):
    {
        "contact[first_name]": "...",
        "contact[email]": "...",
        "contact[phone]": "..."
    }
    + query param: ?status=add|remove
    """
    name = data.get('contact[first_name]', '')
    email = data.get('contact[email]', '')
    phone = data.get('contact[phone]', '')

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    if status not in ('add', 'remove'):
        return {'error': 'Status deve ser "add" ou "remove"'}

    return {
        'name': name,
        'email': email,
        'add': status == 'add',
        'phone': phone,
        'metadata': {'source': 'activecampaign'},
    }
