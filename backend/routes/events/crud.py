from flask import jsonify, request, session
from functools import wraps
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from db.database import db
from models import Admin, Event, EventAnalytics
from sqlalchemy import func
from . import events_bp

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 401
        if not Admin.query.get(session['user_id']):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

def get_event_status(event):
    now = datetime.utcnow()
    if not event.is_active:
        return 'inactive'
    elif now > event.event_date:
        return 'expired'
    else:
        return 'upcoming'

def serialize_event(e, analytics_map=None):
    views = 0
    clicks = 0
    if analytics_map and e.id in analytics_map:
        views = analytics_map[e.id]['views']
        clicks = analytics_map[e.id]['clicks']

    return {
        'id': e.id,
        'title': e.title,
        'description': e.description,
        'mediaType': e.media_type,
        'mediaUrl': e.media_url,
        'htmlContent': e.html_content or '',
        'callLink': e.call_link or '',
        'eventDate': e.event_date.isoformat() if e.event_date else '',
        'sendEmail': e.send_email,
        'sendWhatsapp': e.send_whatsapp,
        'isActive': e.is_active,
        'status': get_event_status(e),
        'views': views,
        'clicks': clicks,
        'createdAt': e.created_at.isoformat() if e.created_at else '',
    }

def get_analytics_map():
    results = db.session.query(
        EventAnalytics.event_id,
        func.sum(EventAnalytics.views).label('total_views'),
        func.sum(EventAnalytics.clicks).label('total_clicks')
    ).group_by(EventAnalytics.event_id).all()

    return {
        r.event_id: {
            'views': r.total_views or 0,
            'clicks': r.total_clicks or 0
        }
        for r in results
    }

@events_bp.route('', methods=['GET'])
@admin_required
def get_events():
    page = request.args.get('page', 1, type=int)
    per_page = 10
    search = request.args.get('search', '')
    status_filter = request.args.get('status', '')

    query = Event.query

    if search:
        query = query.filter(Event.title.ilike(f'%{search}%'))

    now = datetime.utcnow()
    if status_filter:
        if status_filter == 'active':
            query = query.filter(Event.is_active == True)
        elif status_filter == 'inactive':
            query = query.filter(Event.is_active == False)
        elif status_filter == 'upcoming':
            query = query.filter(Event.is_active == True, Event.event_date >= now)
        elif status_filter == 'expired':
            query = query.filter(Event.event_date < now)

    events = query.order_by(Event.created_at.desc()).paginate(page=page, per_page=per_page)
    analytics_map = get_analytics_map()

    total_views = sum(a['views'] for a in analytics_map.values())
    total_clicks = sum(a['clicks'] for a in analytics_map.values())

    active_count = Event.query.filter(Event.is_active == True, Event.event_date >= now).count()

    return jsonify({
        'events': [serialize_event(e, analytics_map) for e in events.items],
        'total_pages': events.pages,
        'current_page': page,
        'total': events.total,
        'active': active_count,
        'total_views': total_views,
        'total_clicks': total_clicks,
    })

def save_uploaded_image(file):
    uploads_dir = os.path.join('static', 'uploads')
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
    filename = f'event_{datetime.utcnow().strftime("%Y%m%d%H%M%S")}_{secure_filename(file.filename)}'
    file_path = os.path.join(uploads_dir, filename)
    file.save(file_path)
    return filename

def delete_old_image(media_url):
    if media_url:
        old_file = os.path.join('static', 'uploads', media_url)
        if os.path.exists(old_file):
            try:
                os.remove(old_file)
            except Exception as e:
                print(f"Failed to delete old image: {str(e)}")

@events_bp.route('', methods=['POST'])
@admin_required
def create_event():
    try:
        data = request.form.to_dict()
        media_type = data.get('mediaType', 'image')

        media_url = None
        html_content = None

        if media_type == 'image':
            if 'media_file' in request.files and request.files['media_file'].filename:
                media_url = save_uploaded_image(request.files['media_file'])
        elif media_type == 'html':
            html_content = data.get('htmlContent', '').strip()

        send_email = str(data.get('sendEmail', 'false')).lower() in ['true', '1', 'yes']
        send_whatsapp = str(data.get('sendWhatsapp', 'false')).lower() in ['true', '1', 'yes']

        new_event = Event(
            title=data.get('title', ''),
            description=data.get('description', ''),
            media_type=media_type,
            media_url=media_url,
            html_content=html_content,
            call_link=data.get('callLink', ''),
            event_date=datetime.fromisoformat(data['eventDate'].replace('Z', '+00:00')).replace(tzinfo=None) if 'eventDate' in data else datetime.utcnow(),
            send_email=send_email,
            send_whatsapp=send_whatsapp,
            is_active=True,
            created_at=datetime.utcnow()
        )

        db.session.add(new_event)
        db.session.commit()

        # Se tiver que enviar agora (opcional: a lógica do usuário pediu na hora que adicionar ou 30 min antes)
        # O scheduler vai rodar se tiver a 30min de começar. Para mandar na hora:
        # Se for para mandar na hora, poderiamos despachar agora via dispatch_notifications 

        return jsonify({
            'success': True,
            'message': 'Evento criado com sucesso',
            'event': serialize_event(new_event)
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error creating event: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@events_bp.route('/<int:id>', methods=['PUT'])
@admin_required
def update_event(id):
    event = Event.query.get_or_404(id)

    try:
        data = request.form.to_dict()
        media_type = data.get('mediaType', event.media_type)

        if media_type == 'image':
            if 'media_file' in request.files and request.files['media_file'].filename:
                if event.media_type == 'image':
                    delete_old_image(event.media_url)
                event.media_url = save_uploaded_image(request.files['media_file'])
            event.media_type = 'image'
            event.html_content = None
        elif media_type == 'html':
            event.html_content = data.get('htmlContent', '').strip()
            if event.media_type == 'image':
                delete_old_image(event.media_url)
                event.media_url = None
            event.media_type = 'html'
        elif media_type == 'default':
            if event.media_type == 'image':
                delete_old_image(event.media_url)
                event.media_url = None
            event.html_content = None
            event.media_type = 'default'

        event.title = data.get('title', event.title)
        event.description = data.get('description', event.description)
        event.call_link = data.get('callLink', event.call_link)
        if 'eventDate' in data:
            event.event_date = datetime.fromisoformat(data['eventDate'].replace('Z', '+00:00')).replace(tzinfo=None)
        
        event.send_email = str(data.get('sendEmail', event.send_email)).lower() in ['true', '1', 'yes']
        event.send_whatsapp = str(data.get('sendWhatsapp', event.send_whatsapp)).lower() in ['true', '1', 'yes']

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Evento atualizado com sucesso',
            'event': serialize_event(event)
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error updating event: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@events_bp.route('/<int:id>', methods=['DELETE'])
@admin_required
def delete_event(id):
    event = Event.query.get_or_404(id)
    try:
        if event.media_type == 'image':
            delete_old_image(event.media_url)

        EventAnalytics.query.filter_by(event_id=id).delete()
        db.session.delete(event)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Evento excluído com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@events_bp.route('/<int:id>/toggle', methods=['POST'])
@admin_required
def toggle_event(id):
    event = Event.query.get_or_404(id)
    event.is_active = not event.is_active
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': 'Status alterado com sucesso', 'is_active': event.is_active})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
