from flask import Blueprint, jsonify, Response, request
from datetime import datetime, date, timedelta
from icalendar import Calendar, Event as ICalEvent
from models import Event, EventAnalytics
from db.database import db
from .auth_helpers import member_or_preview

member_events_bp = Blueprint('member_events', __name__)

@member_events_bp.route('/events/active', methods=['GET'])
@member_or_preview
def get_active_events(student):
    """Returns all currently active events."""
    now = datetime.utcnow()

    events = Event.query.filter(
        Event.is_active == True,
        Event.event_date >= now
    ).order_by(Event.event_date.asc()).all()

    result = []
    for event in events:
        media_url = event.media_url
        if event.media_type == 'image' and media_url:
            media_url = f'/static/uploads/{media_url}'

        result.append({
            'id': event.id,
            'title': event.title,
            'description': event.description,
            'mediaType': event.media_type,
            'mediaUrl': media_url,
            'htmlContent': event.html_content or '',
            'callLink': event.call_link or '',
            'eventDate': event.event_date.isoformat() if event.event_date else '',
        })

    return jsonify({'events': result})

@member_events_bp.route('/events/<int:event_id>/view', methods=['POST'])
@member_or_preview
def track_event_view(student, event_id):
    if student is None:
        return jsonify({'success': True})

    today = date.today()
    analytics = EventAnalytics.query.filter_by(event_id=event_id, date=today).first()

    if analytics:
        analytics.views += 1
    else:
        analytics = EventAnalytics(event_id=event_id, date=today, views=1, clicks=0)
        db.session.add(analytics)

    db.session.commit()
    return jsonify({'success': True})

@member_events_bp.route('/events/<int:event_id>/click', methods=['POST'])
@member_or_preview
def track_event_click(student, event_id):
    if student is None:
        return jsonify({'success': True})

    today = date.today()
    analytics = EventAnalytics.query.filter_by(event_id=event_id, date=today).first()

    if analytics:
        analytics.clicks += 1
    else:
        analytics = EventAnalytics(event_id=event_id, date=today, views=0, clicks=1)
        db.session.add(analytics)

    db.session.commit()
    return jsonify({'success': True})

@member_events_bp.route('/events/<int:event_id>', methods=['GET'])
def get_public_event(event_id):
    """Returns public event details for the landing page."""
    event = Event.query.get_or_404(event_id)
    if not event.is_active:
        return jsonify({'error': 'Event not active or not found'}), 404
        
    return jsonify({
        'id': event.id,
        'title': event.title,
        'description': event.description,
        'callLink': event.call_link or '',
        'eventDate': event.event_date.isoformat() if event.event_date else '',
    })

@member_events_bp.route('/events/<int:event_id>/calendar.ics', methods=['GET'])
def get_event_calendar(event_id):
    """Generates an ICS file for the event"""
    event = Event.query.get_or_404(event_id)
    if not event.is_active:
        return "Event not found or inactive", 404

    cal = Calendar()
    cal.add('prodid', '-//Membrium//Event Calendar//EN')
    cal.add('version', '2.0')

    ievent = ICalEvent()
    ievent.add('summary', event.title)
    if event.description:
        desc = event.description
        if event.call_link:
            desc += f"\n\nLink da chamada: {event.call_link}"
        ievent.add('description', desc)
    else:
        if event.call_link:
            ievent.add('description', f"Link da chamada: {event.call_link}")

    # Set dtstart and dtend. If it has a specific time, event_date stores it.
    # Assuming the event is 1 hour long.
    start_time = event.event_date
    end_time = start_time + timedelta(hours=1)

    ievent.add('dtstart', start_time)
    ievent.add('dtend', end_time)
    ievent.add('dtstamp', datetime.utcnow())
    if event.call_link:
        ievent.add('url', event.call_link)
        ievent.add('location', event.call_link)

    cal.add_component(ievent)

    ics_content = cal.to_ical()
    return Response(
        ics_content,
        mimetype='text/calendar',
        headers={
            "Content-Disposition": f"attachment; filename=event_{event.id}.ics"
        }
    )
