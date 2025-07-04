# This image will run migrations, Django backend, and React frontend in one container

FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim AS backend-build
WORKDIR /app
# Install system dependencies and nodejs for serve
RUN apt-get update \
    && apt-get install -y gcc libpq-dev curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g serve \
    && rm -rf /var/lib/apt/lists/*
# Copy backend code
COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/build ./backend/static/
WORKDIR /app/backend
# Install Python dependencies
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose ports for Django and React
EXPOSE 8000 3000

# Use a volume for SQLite DB
VOLUME ["/app/backend/db"]

# Start everything via entrypoint
ENTRYPOINT ["/entrypoint.sh"]
