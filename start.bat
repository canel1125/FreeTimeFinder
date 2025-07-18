@echo off
echo 🚀 Starting FreeTimeFinder Application...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ docker-compose could not be found. Please install docker-compose.
    pause
    exit /b 1
)

echo 📦 Building containers...
docker-compose build

echo 🗄️ Setting up database...
docker-compose run --rm backend python manage.py migrate

echo 👤 Creating superuser (optional)...
set /p createuser="Do you want to create a Django admin superuser? (y/n): "
if /i "%createuser%"=="y" (
    docker-compose run --rm backend python manage.py createsuperuser
)

echo 🎯 Starting services...
docker-compose up -d

echo.
echo ✅ FreeTimeFinder is now running!
echo.
echo 🌐 Frontend: http://localhost:3116
echo 🔧 Backend API: http://localhost:8116/api
echo ⚙️ Django Admin: http://localhost:8116/admin
echo.
echo 📊 To view logs: docker-compose logs -f
echo 🛑 To stop: docker-compose down
echo.
echo Happy scheduling! 🎉
pause
