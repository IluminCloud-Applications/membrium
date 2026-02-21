FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

EXPOSE 3000

# Use Gunicorn for production
CMD ["gunicorn", "--config", "gunicorn.conf.py", "app:app"]
