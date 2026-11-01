FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Create storage directories and set non-root permissions if needed
RUN mkdir -p storage/datasets storage/images storage/models storage/charts

ENV PORT=5000
ENV FLASK_DEBUG=False
ENV MPLCONFIGDIR=/tmp/matplotlib

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "app:app"]

