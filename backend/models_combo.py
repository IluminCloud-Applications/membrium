"""Modelo para Combos de Cursos (Ofertas com múltiplos cursos entregues juntos)."""
from uuid import uuid4
from datetime import datetime
from db.database import db

combo_courses = db.Table(
    'combo_courses',
    db.Column('combo_id', db.Integer, db.ForeignKey('course_combo.id', ondelete='CASCADE'), primary_key=True),
    db.Column('course_id', db.Integer, db.ForeignKey('course.id', ondelete='CASCADE'), primary_key=True),
)


class CourseCombo(db.Model):
    """Agrupamento de cursos para venda/entrega conjunta via Webhook único."""
    __tablename__ = 'course_combo'

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid4()))
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    courses = db.relationship('Course', secondary=combo_courses, backref=db.backref('combos', lazy='dynamic'))

    def to_dict(self):
        """Serializa o combo com os cursos inclusos."""
        courses_list = [
            {
                'id': c.id,
                'uuid': c.uuid,
                'name': c.name,
                'category': c.category,
                'image': c.image,
            }
            for c in self.courses
        ]
        return {
            'id': self.id,
            'uuid': self.uuid,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'courses_count': len(courses_list),
            'courses': courses_list,
        }
