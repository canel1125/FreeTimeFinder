#!/bin/bash
set -e

# Change to the backend directory where manage.py is located
cd backend

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Collect static files (React build output and Django's static files)
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start Gunicorn server
# Gunicorn will serve the Django app and Whitenoise will handle static files.
# We bind to 0.0.0.0 to allow external connections (from Docker's host).
echo "Starting Gunicorn server..."
gunicorn freetimefinder.wsgi:application --bind 0.0.0.0:8000