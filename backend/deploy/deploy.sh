#!/bin/bash
# Deploy script for Claros MIS AI Dashboard Backend
# 배포 스크립트

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="claros-mis-backend"
DOCKER_IMAGE="${PROJECT_NAME}:latest"
CONTAINER_NAME="${PROJECT_NAME}-app"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Claros MIS AI Dashboard Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Function to print colored messages
print_message() {
    COLOR=$1
    MESSAGE=$2
    echo -e "${COLOR}[INFO]${NC} $MESSAGE"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_message "${YELLOW}" "Checking prerequisites..."
if ! command_exists docker; then
    print_message "${RED}" "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    print_message "${RED}" "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_message "${GREEN}" "Prerequisites check passed."

# Parse command line arguments
ENVIRONMENT=${1:-development}
ACTION=${2:-deploy}

case $ENVIRONMENT in
    development|dev)
        ENV_FILE=".env.development"
        print_message "${YELLOW}" "Deploying to DEVELOPMENT environment..."
        ;;
    production|prod)
        ENV_FILE=".env.production"
        print_message "${YELLOW}" "Deploying to PRODUCTION environment..."
        ;;
    *)
        print_message "${RED}" "Invalid environment. Use: development|dev|production|prod"
        exit 1
        ;;
esac

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    print_message "${RED}" "Environment file $ENV_FILE not found!"
    exit 1
fi

# Source environment variables
print_message "${YELLOW}" "Loading environment variables from $ENV_FILE..."
export $(cat "$ENV_FILE" | grep -v '^#' | xargs)

# Perform action
case $ACTION in
    deploy)
        print_message "${YELLOW}" "Building Docker image..."
        docker-compose build backend

        print_message "${YELLOW}" "Stopping existing containers..."
        docker-compose down

        print_message "${YELLOW}" "Starting services..."
        docker-compose up -d

        print_message "${YELLOW}" "Running database migrations..."
        docker-compose exec backend python manage.py migrate --noinput

        print_message "${YELLOW}" "Collecting static files..."
        docker-compose exec backend python manage.py collectstatic --noinput

        print_message "${GREEN}" "Deployment completed successfully!"
        print_message "${GREEN}" "Application is running at: http://localhost:8000"
        ;;

    migrate)
        print_message "${YELLOW}" "Running database migrations..."
        docker-compose exec backend python manage.py migrate
        ;;

    makemigrations)
        print_message "${YELLOW}" "Creating new migrations..."
        docker-compose exec backend python manage.py makemigrations
        ;;

    shell)
        print_message "${YELLOW}" "Opening Django shell..."
        docker-compose exec backend python manage.py shell
        ;;

    logs)
        print_message "${YELLOW}" "Showing logs (press Ctrl+C to exit)..."
        docker-compose logs -f backend
        ;;

    restart)
        print_message "${YELLOW}" "Restarting services..."
        docker-compose restart backend
        print_message "${GREEN}" "Services restarted successfully!"
        ;;

    stop)
        print_message "${YELLOW}" "Stopping services..."
        docker-compose down
        print_message "${GREEN}" "Services stopped successfully!"
        ;;

    status)
        print_message "${YELLOW}" "Checking service status..."
        docker-compose ps
        ;;

    health)
        print_message "${YELLOW}" "Checking application health..."
        curl -f http://localhost:8000/api/monitoring/health/ || print_message "${RED}" "Health check failed!"
        ;;

    backup)
        BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"

        print_message "${YELLOW}" "Creating backup..."
        docker-compose exec -T db pg_dump -U claros_user claros_mis > "$BACKUP_DIR/database.sql"
        print_message "${GREEN}" "Backup created at: $BACKUP_DIR"
        ;;

    clean)
        print_message "${RED}" "Cleaning up Docker resources..."
        read -p "Are you sure you want to remove all containers, volumes, and images? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v
            docker system prune -a
            print_message "${GREEN}" "Cleanup completed!"
        else
            print_message "${YELLOW}" "Cleanup cancelled."
        fi
        ;;

    *)
        print_message "${YELLOW}" "Available actions:"
        echo "  deploy     - Deploy the application (default)"
        echo "  migrate    - Run database migrations"
        echo "  makemigrations - Create new migrations"
        echo "  shell      - Open Django shell"
        echo "  logs       - Show application logs"
        echo "  restart    - Restart services"
        echo "  stop       - Stop services"
        echo "  status     - Check service status"
        echo "  health     - Check application health"
        echo "  backup     - Create database backup"
        echo "  clean      - Clean up Docker resources"
        exit 1
        ;;
esac

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment script completed${NC}"
echo -e "${GREEN}========================================${NC}"
