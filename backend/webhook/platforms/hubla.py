"""Parser para webhook Hubla."""


def _extract_extra_data(event: dict, invoice: dict, subscription: dict) -> dict:
    """Extrai dados extras do payload da Hubla para salvar em extra_data."""
    transaction_id = invoice.get('id') or subscription.get('id')
    payment_method = invoice.get('paymentMethod') or subscription.get('paymentMethod')

    extra = {
        'transaction_id': transaction_id,
        'payment_method': payment_method,
        'installments': invoice.get('installments'),
        'currency': invoice.get('currency'),
        'subscription_id': subscription.get('id'),
        'subscription_status': subscription.get('status'),
        'free_trial': subscription.get('freeTrial', False),
    }

    # UTMs (podem vir na invoice ou na subscription)
    session = (
        invoice.get('paymentSession')
        or invoice.get('firstPaymentSession')
        or subscription.get('paymentSession')
        or subscription.get('firstPaymentSession')
        or {}
    )
    if not isinstance(session, dict):
        session = {}

    utm = session.get('utm', {}) if isinstance(session.get('utm'), dict) else {}

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
    Formato Hubla:
    - Faturas: invoice.payment_succeeded, invoice.status_updated, invoice.refunded, etc.
    - Membros: customer.member_added (acesso concedido / free trial), customer.member_removed (acesso removido).
    """
    event_type = data.get('type')

    # Eventos de adição/ativação (compra confirmada, acesso liberado ou free trial)
    ADD_EVENTS = ('invoice.payment_succeeded', 'customer.member_added')
    # Eventos de remoção/cancelamento/reembolso/acesso removido
    REMOVE_EVENTS = ('invoice.refunded', 'invoice.charged_back', 'invoice.canceled', 'customer.member_removed')
    # Outros eventos genéricos de atualização de status
    ALLOWED_EVENTS = ('invoice.status_updated',) + ADD_EVENTS + REMOVE_EVENTS

    if event_type not in ALLOWED_EVENTS:
        return {'skip': True, 'message': f'Evento {event_type} não processado'}

    event = data.get('event') if isinstance(data.get('event'), dict) else {}
    invoice = event.get('invoice') if isinstance(event.get('invoice'), dict) else {}
    subscription = event.get('subscription') if isinstance(event.get('subscription'), dict) else {}

    status = invoice.get('status') or subscription.get('status')

    user = event.get('user') if isinstance(event.get('user'), dict) else {}
    payer = invoice.get('payer') if isinstance(invoice.get('payer'), dict) else {}

    if user and user.get('email'):
        target_user = user
    else:
        target_user = payer

    email = (target_user.get('email') or '').strip()
    first_name = (target_user.get('firstName') or '').strip()
    last_name = (target_user.get('lastName') or '').strip()
    full_name = f"{first_name} {last_name}".strip()

    name = first_name if first_name else (full_name.split(" ")[0] if full_name else '')
    phone = (target_user.get('phone') or '').strip()

    if not name or not email:
        return {'error': 'Nome e email são obrigatórios'}

    extra_data = _extract_extra_data(event, invoice, subscription)
    metadata = {'source': 'hubla', 'full_name': full_name or name, 'hubla': extra_data}

    # Adição de aluno (acesso liberado, free trial ou pagamento confirmado)
    if event_type in ADD_EVENTS or status in ('paid', 'succeeded'):
        return {'name': name, 'email': email, 'add': True, 'phone': phone, 'metadata': metadata}

    # Remoção de aluno (reembolso / cancelamento / acesso removido)
    if event_type in REMOVE_EVENTS or status in ('refunded', 'chargeback', 'canceled', 'inactive'):
        return {'name': name, 'email': email, 'add': False, 'phone': phone, 'metadata': metadata}

    return {'skip': True, 'message': 'Status não processado'}


