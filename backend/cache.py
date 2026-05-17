"""
Redis cache helpers — TTL 1h, graceful fallback when Redis is unavailable.
"""
import os
import json
import logging

logger = logging.getLogger(__name__)

CACHE_TTL = 3600  # 1 hour

_client = None


def _get_client():
    global _client
    if _client is None:
        import redis
        url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
        try:
            r = redis.from_url(url, decode_responses=True, socket_connect_timeout=2)
            r.ping()
            _client = r
        except Exception as e:
            logger.warning(f"Redis unavailable ({e}). Cache disabled.")
    return _client


def cache_get(key):
    client = _get_client()
    if not client:
        return None
    try:
        value = client.get(key)
        return json.loads(value) if value else None
    except Exception as e:
        logger.warning(f"cache_get {key!r}: {e}")
        return None


def cache_set(key, value, ttl=CACHE_TTL):
    client = _get_client()
    if not client:
        return
    try:
        client.setex(key, ttl, json.dumps(value, default=str))
    except Exception as e:
        logger.warning(f"cache_set {key!r}: {e}")


def cache_delete(*keys):
    client = _get_client()
    if not client or not keys:
        return
    try:
        client.delete(*keys)
    except Exception as e:
        logger.warning(f"cache_delete {keys}: {e}")


def cache_delete_pattern(pattern):
    client = _get_client()
    if not client:
        return
    try:
        keys = list(client.scan_iter(pattern, count=100))
        if keys:
            client.delete(*keys)
    except Exception as e:
        logger.warning(f"cache_delete_pattern {pattern!r}: {e}")


# ── Domain-level invalidation helpers ─────────────────────────────

def invalidate_login_page():
    cache_delete('customization:login_page')


def invalidate_member_area():
    cache_delete('customization:member_area')


def invalidate_course(course_id):
    cache_delete('courses:published', f'course:{course_id}:detail')


def invalidate_module(course_id, module_id):
    cache_delete(
        'courses:published',
        f'course:{course_id}:detail',
        f'module:{module_id}:content',
    )


def invalidate_lesson(course_id, module_id):
    cache_delete(
        f'course:{course_id}:detail',
        f'module:{module_id}:content',
    )


def invalidate_all_content():
    """Wipe everything — used after bulk operations like image compression."""
    cache_delete('customization:login_page', 'customization:member_area', 'courses:published')
    cache_delete_pattern('course:*:detail')
    cache_delete_pattern('module:*:content')
