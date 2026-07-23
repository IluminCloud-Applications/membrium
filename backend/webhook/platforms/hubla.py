"""Parser para webhook Hubla."""


def _extract_extra_data(event: dict, invoice: dict) -> dict:
    """Extrai dados extras do payload da Hubla para salvar em extra_data."""
    extra = {
        'transaction_id': invoice.get('id'),
        'payment_method': invoice.get('paymentMethod'),
        'installments': invoice.get('installments'),
        'currency': invoice.get('currency'),
    }

    # UTMs (pode vir em paymentSession ou firstPaymentSession)
    session = invoice.get('paymentSession') or invoice.get('firstPaymentSession', {})
    utm = session.get('utm', {})
    extra['utms'] = {
        'utm_source': utm.get('source'),
        'utm_medium': utm.get('medium'),
        'utm_campaign': utm.get('campaign'),
        'utm_content': utm.get('content'),
        'utm_term': utm.get('term'),
    }

    return extra


def parse_hubla(data: dict) -> dict:
    """
    Formato Hubla (invoice.status_updated, invoice.payment_succeeded, invoice.refunded, etc.)
    """
    event_type = data.get('type')

    # Eventos de adição/ativação
    ADD_EVENTS = ('invoice.payment_succeeded',)
    # Eventos de remoção/cancelamento/reembolso
    REMOVE_EVENTS = ('invoice.refunded', 'invoice.charged_back', 'invoice.canceled')
    # Outros eventos genéricos de atualização de status
    ALLOWED_EVENTS = ('invoice.status_updated',) + ADD_EVENTS + REMOVE_EVENTS

    if event_type not in ALLOWED_EVENTS:
        return {'skip': True, 'message': f'Evento {event_type} não processado'}

    event = data.get('event', {})
    invoice = event.get('invoice', {})

    status = invoice.get('status')

    user = event.get('user')
    payer = invoice.get('payer', {})

    if user and user.get('email'):
        target_user = user
    else:
        target_user = payer

    email = target_user.get('email', '')
    first_name = target_user.get('firstName', '')
    last_name = target_user.get('lastName', '')
    name = f"{first_name} {last_name}".strip()

    first_name_only = first_name.strip() if first_name else name.split(" ")[0] if name else ''
    phone = target_user.get('phone', '')

    if not first_name_only or not email:
        return {'error': 'Nome e email são obrigatórios'}

    extra_data = _extract_extra_data(event, invoice)
    metadata = {'source': 'hubla', 'full_name': name, 'hubla': extra_data}

    # Adição de aluno
    if event_type in ADD_EVENTS or status in ('paid', 'succeeded'):
        return {'name': first_name_only, 'email': email, 'add': True, 'phone': phone, 'metadata': metadata}

    # Remoção de aluno (reembolso / estorno / cancelamento)
    if event_type in REMOVE_EVENTS or status in ('refunded', 'chargeback', 'canceled'):
        return {'name': first_name_only, 'email': email, 'add': False, 'phone': phone, 'metadata': {'source': 'hubla'}}

    return {'skip': True, 'message': 'Status não processado'}


