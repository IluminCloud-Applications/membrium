"""Controle de acesso por curso e liberação gradual (drip) feito no back-end.

O front só esconde o clique no card: sem esta checagem, um aluno abre
/curso/X/modulo/Y direto ou lê os vídeos pela API. Aluno em modo preview
(student is None) nunca é bloqueado.
"""
from datetime import datetime
from flask import jsonify


def module_days_remaining(student, module):
    """Dias que faltam para liberar o módulo (0 = liberado)."""
    unlock_days = module.unlock_after_days or 0
    if student is None or unlock_days <= 0:
        return 0
    elapsed = (datetime.utcnow() - student.created_at).days
    return max(0, unlock_days - elapsed)


def module_access_error(student, module):
    """Resposta de erro se o aluno não pode ver o módulo, senão None."""
    if student is None:
        return None
    if module.course not in student.courses:
        return jsonify({'error': 'Sem acesso a este curso'}), 403
    remaining = module_days_remaining(student, module)
    if remaining > 0:
        return jsonify({
            'error': 'Este módulo ainda não foi liberado',
            'unlockDaysRemaining': remaining,
        }), 403
    return None


def lesson_access_error(student, lesson):
    """Resposta de erro se o aluno não pode acessar a aula, senão None."""
    if student is None or lesson.module is None:
        return None
    return module_access_error(student, lesson.module)
