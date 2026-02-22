"""Auth helpers — shared decorators for auth routes."""
from flask import session, redirect, url_for
from functools import wraps
from db.utils import check_installation


def installation_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not check_installation() and request.endpoint != 'auth.api_install':
            return redirect(url_for('auth.api_check_install'))
        return f(*args, **kwargs)
    return decorated_function
