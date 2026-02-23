# ==============================================================
# Membrium — Single Docker Image (Frontend + Backend)
# ==============================================================
# Stage 1: Build the React frontend
# Stage 2: Production image with Nginx + Gunicorn (supervisord)
# ==============================================================

# ---- Stage 1: Frontend Build ----
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Install dependencies first (better caching)
COPY frontend/package*.json ./
RUN npm ci

# Copy source and build
COPY frontend/ .
RUN npm run build


# ---- Stage 2: Production Image ----
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# ---- Backend Setup ----
WORKDIR /app/backend

COPY backend/requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# ---- Frontend: Copy build output ----
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# ---- Nginx Config ----
COPY docker/nginx.conf /etc/nginx/sites-available/default
RUN rm -f /etc/nginx/sites-enabled/default && \
    ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# ---- Supervisord Config ----
COPY docker/supervisord.conf /etc/supervisor/conf.d/membrium.conf

# ---- Entrypoint Script ----
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create upload directory
RUN mkdir -p /app/backend/static/uploads

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["supervisord", "-n", "-c", "/etc/supervisor/conf.d/membrium.conf"]
