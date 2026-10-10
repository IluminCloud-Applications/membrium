"""
Disk usage endpoint – returns Docker volume stats.
"""
import shutil
from flask import Blueprint, jsonify, session
from auth_decorators import admin_required
from functools import wraps
from models import Admin

disk_bp = Blueprint('files_disk', __name__)


@disk_bp.route('/disk-usage', methods=['GET'])
@admin_required
def disk_usage():
    """Return disk usage stats for the Docker volume."""
    try:
        usage = shutil.disk_usage('/')
        return jsonify({
            'used': usage.used,
            'total': usage.total,
            'free': usage.free,
            'usedPercentage': round((usage.used / usage.total) * 100, 1) if usage.total > 0 else 0
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
