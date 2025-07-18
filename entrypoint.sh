#!/bin/bash
set -e

# Run migrations (db_init equivalent)
echo "Running Django migrations..."
python manage.py migrate

# Start Django backend in background
python manage.py runserver 0.0.0.0:8116 &

# Start React frontend (serve static build)
echo "Starting static frontend on port 3116..."
cd static && npx serve -s . -l 3116
