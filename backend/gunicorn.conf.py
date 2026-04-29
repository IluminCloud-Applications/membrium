import multiprocessing
import os

# Server socket
bind = "0.0.0.0:3000"

# Worker processes
workers = int(os.getenv("GUNICORN_WORKERS", multiprocessing.cpu_count() * 2 + 1))
worker_class = "sync"
timeout = 600

# Allow large video uploads via the R2 proxy endpoint (2 GB)
limit_request_body = 2 * 1024 * 1024 * 1024  # 2 GB

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Reload in development
reload = os.getenv("FLASK_ENV") == "development"

