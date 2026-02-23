#!/bin/bash
set -e

# Create necessary directories
mkdir -p /app/backend/static/uploads
mkdir -p /var/log/supervisor
mkdir -p /var/log/nginx

# Remove default nginx config if exists
rm -f /etc/nginx/sites-enabled/default.bak

echo "============================================"
echo "  Membrium — Starting Services"
echo "============================================"
echo "  Frontend: Nginx (port 80)"
echo "  Backend:  Gunicorn (port 3000 internal)"
echo "============================================"

exec "$@"
