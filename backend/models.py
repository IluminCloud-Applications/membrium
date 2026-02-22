from uuid import uuid4
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from db.database import db

# Tabelas de associação
student_courses = db.Table('student_courses',
    db.Column('student_id', db.Integer, db.ForeignKey('student.id'), primary_key=True),
    db.Column('course_id', db.Integer, db.ForeignKey('course.id'), primary_key=True)
)

student_lessons = db.Table('student_lessons',
    db.Column('student_id', db.Integer, db.ForeignKey('student.id'), primary_key=True),
    db.Column('lesson_id', db.Integer, db.ForeignKey('lesson.id'), primary_key=True)
)

course_group_courses = db.Table('course_group_courses',
    db.Column('group_id', db.Integer, db.ForeignKey('course_group.id'), primary_key=True),
    db.Column('course_id', db.Integer, db.ForeignKey('course.id'), primary_key=True),
    db.Column('order', db.Integer, default=0)
)

showcase_courses = db.Table('showcase_courses',
    db.Column('showcase_id', db.Integer, db.ForeignKey('showcase.id'), primary_key=True),
    db.Column('course_id', db.Integer, db.ForeignKey('course.id'), primary_key=True)
)

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    platform_name = db.Column(db.String(120), nullable=False)
    is_installed = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid4()))
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    image = db.Column(db.String(255))
    category = db.Column(db.String(20), default='principal')  # 'principal', 'order_bump', 'upsell', 'bonus'
    is_published = db.Column(db.Boolean, default=True)
    module_format = db.Column(db.String(20), default='standard')  # 'standard' or 'netflix'
    theme = db.Column(db.String(20), default='light')  # 'light' or 'dark'
    cover_desktop = db.Column(db.String(255))  # filename for desktop cover
    cover_mobile = db.Column(db.String(255))   # filename for mobile cover
    menu_items = db.Column(db.JSON, default=list)  # [{name, url, icon, order}]
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    modules = db.relationship('Module', backref='course', lazy=True, cascade="all, delete-orphan", order_by='Module.order')

class Module(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    image = db.Column(db.String(255))
    order = db.Column(db.Integer)
    unlock_after_days = db.Column(db.Integer, default=0)  # 0 = immediate, 1+ = days after enrollment
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    lessons = db.relationship('Lesson', backref='module', lazy=True, cascade="all, delete-orphan", order_by='Lesson.order')

class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    video_url = db.Column(db.Text, nullable=True)
    video_type = db.Column(db.String(50), default='youtube')  # Pode ser 'youtube' ou 'vturb'
    order = db.Column(db.Integer, nullable=False)
    has_button = db.Column(db.Boolean, default=False)
    button_text = db.Column(db.String(100))
    button_link = db.Column(db.String(500))
    button_delay = db.Column(db.Integer)
    module_id = db.Column(db.Integer, db.ForeignKey('module.id'), nullable=False)
    documents = db.relationship('Document', backref='lesson', lazy=True)
    
    def format_video_url(self):
        if self.video_type == 'youtube':
            # Formato atual para YouTube
            return self.video_url
        elif self.video_type == 'vturb':
            # Retorna o código VTurb como está
            return self.video_url
        return self.video_url

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    extra_data = db.Column(db.JSON, default=dict)  # Dados extras da plataforma de pagamento
    uuid = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid4()))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    courses = db.relationship('Course', secondary=student_courses, backref=db.backref('students', lazy='dynamic'))
    completed_lessons = db.relationship('Lesson', secondary=student_lessons, backref=db.backref('completed_by', lazy='dynamic'))

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

class EmailBlacklist(db.Model):
    """Emails que fizeram unsubscribe e não devem receber notificações."""
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CourseGroup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    principal_course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    principal_course = db.relationship('Course', foreign_keys=[principal_course_id])
    courses = db.relationship('Course', secondary=course_group_courses, backref=db.backref('groups', lazy='dynamic'))

class Settings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # Platform preferences
    default_theme = db.Column(db.String(10), default='light')  # 'light' or 'dark' — default theme for students
    # Support
    support_email = db.Column(db.String(120), nullable=True)
    support_whatsapp = db.Column(db.String(20), nullable=True)
    sender_name = db.Column(db.String(255))
    sender_email = db.Column(db.String(255))
    
    # Brevo Integration
    brevo_enabled = db.Column(db.Boolean, default=False)
    brevo_api_key = db.Column(db.String(255), nullable=True)
    brevo_email_subject = db.Column(db.String(255), nullable=True)
    brevo_email_template = db.Column(db.Text, nullable=True)
    brevo_template_mode = db.Column(db.String(10), default='simple')  # 'simple' or 'html'
    
    # Evolution API Integration
    evolution_enabled = db.Column(db.Boolean, default=False)
    evolution_url = db.Column(db.String(255), nullable=True)
    evolution_api_key = db.Column(db.String(255), nullable=True)
    evolution_message_template = db.Column(db.Text, nullable=True)
    evolution_template_mode = db.Column(db.String(10), default='simple')  # 'simple' or 'html'
    evolution_version = db.Column(db.String(10), nullable=True)
    evolution_instance = db.Column(db.String(255), nullable=True)
    
    # YouTube Integration
    youtube_enabled = db.Column(db.Boolean, default=False)
    youtube_client_id = db.Column(db.String(255), nullable=True)
    youtube_client_secret = db.Column(db.String(255), nullable=True)
    
    # Gemini AI Integration
    gemini_api_enabled = db.Column(db.Boolean, default=False)
    gemini_api_key = db.Column(db.String(255), nullable=True)

    # OpenAI Integration
    openai_api_enabled = db.Column(db.Boolean, default=False)
    openai_api = db.Column(db.String(255), nullable=True)
    
    # Chatbot Integration
    chatbot_enabled = db.Column(db.Boolean, default=False)
    chatbot_provider = db.Column(db.String(20), nullable=True)  # 'gemini' or 'openai'
    chatbot_model = db.Column(db.String(50), nullable=True)  # modelo específico a ser usado
    chatbot_name = db.Column(db.String(100), nullable=True)  # nome do chatbot
    chatbot_avatar = db.Column(db.String(255), nullable=True)  # caminho para a imagem do avatar
    chatbot_welcome_message = db.Column(db.Text, nullable=True)  # mensagem de boas-vindas
    chatbot_use_internal_knowledge = db.Column(db.Boolean, default=False)  # permite que o chatbot use seu conhecimento interno

class Promotion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    media_type = db.Column(db.String(10), nullable=False)  # 'image' or 'video'
    media_url = db.Column(db.Text, nullable=False)  # Image filename, video URL, or embed code
    video_source = db.Column(db.String(20), nullable=True)  # 'youtube', 'vimeo', 'custom' (VTurb, Panda, etc.)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    button_delay = db.Column(db.Integer, default=0)
    has_cta = db.Column(db.Boolean, default=False)
    cta_text = db.Column(db.String(120))
    cta_url = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    hide_video_controls = db.Column(db.Boolean, default=True)

    @property
    def status(self):
        now = datetime.utcnow()
        if not self.is_active:
            return 'inactive'
        elif now < self.start_date:
            return 'upcoming'
        elif now > self.end_date:
            return 'expired'
        else:
            return 'active'

class PromotionAnalytics(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    promotion_id = db.Column(db.Integer, db.ForeignKey('promotion.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    views = db.Column(db.Integer, default=0)
    clicks = db.Column(db.Integer, default=0)
    __table_args__ = (db.UniqueConstraint('promotion_id', 'date', name='uix_promotion_date'),)
    promotion = db.relationship('Promotion', backref='analytics', lazy=True)

class Showcase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    image = db.Column(db.String(255))
    url = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(20), default='inactive')
    priority = db.Column(db.Integer, default=5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    courses = db.relationship('Course', secondary=showcase_courses, backref=db.backref('showcase_items', lazy='dynamic'))

class ShowcaseAnalytics(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    showcase_id = db.Column(db.Integer, db.ForeignKey('showcase.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)  # Nova coluna para a data (ex: 2025-01-30)
    views = db.Column(db.Integer, default=0)
    conversions = db.Column(db.Integer, default=0)
    __table_args__ = (db.UniqueConstraint('showcase_id', 'date', name='uix_showcase_date'),)
    showcase = db.relationship('Showcase', backref='analytics', lazy=True)

class FAQ(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    question = db.Column(db.String(255), nullable=False)
    answer = db.Column(db.Text, nullable=False)
    order = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LessonTranscript(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False, unique=True)
    
    # Cache hierarchical data for faster searches
    lesson_title = db.Column(db.String(120), nullable=False)
    module_id = db.Column(db.Integer, nullable=False)
    module_name = db.Column(db.String(120), nullable=False)
    course_id = db.Column(db.Integer, nullable=False)
    course_name = db.Column(db.String(120), nullable=False)
    video_url = db.Column((db.Text), nullable=True)  # Store the video URL for comparison
    
    # Transcript content
    transcript_text = db.Column(db.Text, nullable=False)
    
    # Metadata
    transcription_provider = db.Column(db.String(50), nullable=True)  # e.g., 'openai', 'groq', etc.
    transcription_model = db.Column(db.String(100), nullable=True)    # Model used for transcription
    language = db.Column(db.String(10), default='pt-BR')  # ISO language code
    duration_seconds = db.Column(db.Integer, nullable=True)  # Video/audio duration
    word_count = db.Column(db.Integer, nullable=True)
    
    # For search optimization
    transcript_vector = db.Column(db.Text, nullable=True)  # Optional: For vector embedding storage
    searchable_keywords = db.Column(db.Text, nullable=True)  # Optional: Extracted keywords
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<LessonTranscript: {self.lesson_title}>"

def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()