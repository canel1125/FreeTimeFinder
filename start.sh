#!/bin/bash

echo "🚀 Starting FreeTimeFinder Application..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose could not be found. Please install docker-compose."
    exit 1
fi

echo "📦 Building containers..."
docker-compose build

echo "🗄️ Setting up database..."
docker-compose run --rm backend python manage.py migrate

echo "👤 Creating superuser (optional)..."
read -p "Do you want to create a Django admin superuser? (y/n): " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose run --rm backend python manage.py createsuperuser
fi

echo "🎯 Starting services..."
docker-compose up -d

echo ""
echo "✅ FreeTimeFinder is now running!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000/api"
echo "⚙️ Django Admin: http://localhost:8000/admin"
echo ""
echo "📊 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo ""
echo "Happy scheduling! 🎉"
