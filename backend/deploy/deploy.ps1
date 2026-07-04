# Deploy script for Claros MIS AI Dashboard Backend (Windows PowerShell)
# 배포 스크립트 (Windows PowerShell)

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "dev", "production", "prod")]
    [string]$Environment = "development",

    [Parameter(Mandatory=$false)]
    [ValidateSet("deploy", "migrate", "makemigrations", "logs", "restart", "stop", "status", "health", "backup", "clean")]
    [string]$Action = "deploy"
)

# Configuration
$PROJECT_NAME = "claros-mis-backend"
$CONTAINER_NAME = "$PROJECT_NAME-app"

function Write-ColorMessage {
    param(
        [string]$Color,
        [string]$Message
    )
    $colorMap = @{
        "Red" = "Red"
        "Green" = "Green"
        "Yellow" = "Yellow"
        "Blue" = "Blue"
    }
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline
    Write-Host $Message -ForegroundColor $colorMap[$Color]
}

function Test-Command {
    param([string]$Command)
    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Main deployment logic
Write-ColorMessage "Green" "========================================"
Write-ColorMessage "Green" "Claros MIS AI Dashboard Deployment"
Write-ColorMessage "Green" "========================================"

# Check prerequisites
Write-ColorMessage "Yellow" "Checking prerequisites..."
if (-not (Test-Command "docker")) {
    Write-ColorMessage "Red" "Docker is not installed. Please install Docker Desktop first."
    exit 1
}

if (-not (Test-Command "docker-compose")) {
    Write-ColorMessage "Red" "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
}

Write-ColorMessage "Green" "Prerequisites check passed."

# Set environment file
$envFile = switch ($Environment) {
    "development" { ".env.development" }
    "dev" { ".env.development" }
    "production" { ".env.production" }
    "prod" { ".env.production" }
}

Write-ColorMessage "Yellow" "Deploying to $Environment environment..."

# Check if environment file exists
if (-not (Test-Path $envFile)) {
    Write-ColorMessage "Red" "Environment file $envFile not found!"
    exit 1
}

# Execute action
switch ($Action) {
    "deploy" {
        Write-ColorMessage "Yellow" "Building Docker image..."
        docker-compose build backend

        Write-ColorMessage "Yellow" "Stopping existing containers..."
        docker-compose down

        Write-ColorMessage "Yellow" "Starting services..."
        docker-compose up -d

        Start-Sleep -Seconds 5

        Write-ColorMessage "Yellow" "Running database migrations..."
        docker-compose exec backend python manage.py migrate --noinput

        Write-ColorMessage "Yellow" "Collecting static files..."
        docker-compose exec backend python manage.py collectstatic --noinput

        Write-ColorMessage "Green" "Deployment completed successfully!"
        Write-ColorMessage "Green" "Application is running at: http://localhost:8000"
    }

    "migrate" {
        Write-ColorMessage "Yellow" "Running database migrations..."
        docker-compose exec backend python manage.py migrate
    }

    "makemigrations" {
        Write-ColorMessage "Yellow" "Creating new migrations..."
        docker-compose exec backend python manage.py makemigrations
    }

    "logs" {
        Write-ColorMessage "Yellow" "Showing logs (press Ctrl+C to exit)..."
        docker-compose logs -f backend
    }

    "restart" {
        Write-ColorMessage "Yellow" "Restarting services..."
        docker-compose restart backend
        Write-ColorMessage "Green" "Services restarted successfully!"
    }

    "stop" {
        Write-ColorMessage "Yellow" "Stopping services..."
        docker-compose down
        Write-ColorMessage "Green" "Services stopped successfully!"
    }

    "status" {
        Write-ColorMessage "Yellow" "Checking service status..."
        docker-compose ps
    }

    "health" {
        Write-ColorMessage "Yellow" "Checking application health..."
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/api/monitoring/health/" -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-ColorMessage "Green" "Health check passed!"
                Write-Host $response.Content
            } else {
                Write-ColorMessage "Red" "Health check failed with status code: $($response.StatusCode)"
            }
        }
        catch {
            Write-ColorMessage "Red" "Health check failed: $($_.Exception.Message)"
        }
    }

    "backup" {
        $backupDir = "./backups/$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

        Write-ColorMessage "Yellow" "Creating backup..."
        docker-compose exec -T db pg_dump -U claros_user claros_mis > "$backupDir/database.sql"
        Write-ColorMessage "Green" "Backup created at: $backupDir"
    }

    "clean" {
        Write-ColorMessage "Red" "Cleaning up Docker resources..."
        $confirmation = Read-Host "Are you sure you want to remove all containers, volumes, and images? (y/N)"
        if ($confirmation -eq "y" -or $confirmation -eq "Y") {
            docker-compose down -v
            docker system prune -a
            Write-ColorMessage "Green" "Cleanup completed!"
        }
        else {
            Write-ColorMessage "Yellow" "Cleanup cancelled."
        }
    }

    default {
        Write-ColorMessage "Yellow" "Available actions:"
        Write-Host "  deploy     - Deploy the application (default)"
        Write-Host "  migrate    - Run database migrations"
        Write-Host "  makemigrations - Create new migrations"
        Write-Host "  logs       - Show application logs"
        Write-Host "  restart    - Restart services"
        Write-Host "  stop       - Stop services"
        Write-Host "  status     - Check service status"
        Write-Host "  health     - Check application health"
        Write-Host "  backup     - Create database backup"
        Write-Host "  clean      - Clean up Docker resources"
        exit 1
    }
}

Write-ColorMessage "Green" "========================================"
Write-ColorMessage "Green" "Deployment script completed"
Write-ColorMessage "Green" "========================================"
