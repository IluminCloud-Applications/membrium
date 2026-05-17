import threading
import time
from datetime import datetime, timedelta
from db.database import db
from models import Event, Student, IntegrationConfig
from integrations.email.brevo import BrevoClient
from integrations.whatsapp.evolutionapi import EvolutionClient

def run_scheduler(app):
    with app.app_context():
        while True:
            try:
                now = datetime.utcnow()
                target_time = now + timedelta(minutes=30)
                
                # Check events that need 30 min reminder
                events = Event.query.filter(
                    Event.is_active == True,
                    Event.sent_reminder == False,
                    Event.event_date > now,
                    Event.event_date <= target_time
                ).all()
                
                if events:
                    # Load configs
                    settings_configs = IntegrationConfig.query.all()
                    settings_dict = {}
                    for config in settings_configs:
                        settings_dict[f"{config.provider}_enabled"] = config.enabled
                        if isinstance(config.config, dict):
                            for k, v in config.config.items():
                                settings_dict[f"{config.provider}_{k}"] = v
                                
                    brevo = BrevoClient(settings_dict)
                    evo = EvolutionClient(settings_dict)
                    
                    students = Student.query.all()
                    
                    for event in events:
                        # Prepare templates
                        subject = f"Lembrete: O evento '{event.title}' começa em 30 minutos!"
                        text = f"Olá {{name}},\n\nO evento '{event.title}' começará em 30 minutos!\nLink de acesso: {event.call_link}\n\nTe esperamos lá!"
                        
                        settings_dict['brevo_email_subject'] = subject
                        settings_dict['brevo_email_template'] = text.replace('\n', '<br>')
                        settings_dict['brevo_template_mode'] = 'html'
                        settings_dict['evolution_message_template'] = text
                        
                        for student in students:
                            student_data = {
                                'name': student.name,
                                'email': student.email,
                                'first_name': student.name.split()[0] if student.name else '',
                            }
                            if event.send_email and brevo.is_configured():
                                brevo.send_email(student_data)
                            if event.send_whatsapp and evo.is_configured():
                                evo.send_message(student.phone, student_data)
                                
                        event.sent_reminder = True
                        db.session.commit()
                        
            except Exception as e:
                print(f"Error in event scheduler: {e}")
                db.session.rollback()
            
            time.sleep(60)

def start_scheduler(app):
    thread = threading.Thread(target=run_scheduler, args=(app,), daemon=True)
    thread.start()
