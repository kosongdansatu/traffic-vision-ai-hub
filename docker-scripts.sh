#!/bin/bash

# Traffic Vision AI Docker Management Scripts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_status "Docker is running"
}

# Production commands
prod_up() {
    print_header "Starting Production Environment"
    check_docker
    
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example"
        cp .env.example .env
        print_warning "Please edit .env file with your production settings"
    fi
    
    docker-compose up -d
    print_status "Production environment started"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend API: http://localhost:8000"
    print_status "API Docs: http://localhost:8000/docs"
}

prod_down() {
    print_header "Stopping Production Environment"
    docker-compose down
    print_status "Production environment stopped"
}

prod_logs() {
    print_header "Production Logs"
    docker-compose logs -f
}

# Development commands
dev_up() {
    print_header "Starting Development Environment"
    check_docker
    
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example"
        cp .env.example .env
    fi
    
    docker-compose -f docker-compose.dev.yml up -d
    print_status "Development environment started"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend API: http://localhost:8000"
    print_status "Database: localhost:5432"
}

dev_down() {
    print_header "Stopping Development Environment"
    docker-compose -f docker-compose.dev.yml down
    print_status "Development environment stopped"
}

dev_logs() {
    print_header "Development Logs"
    docker-compose -f docker-compose.dev.yml logs -f
}

# Build commands
build_all() {
    print_header "Building All Images"
    check_docker
    docker-compose build --no-cache
    print_status "All images built successfully"
}

build_backend() {
    print_header "Building Backend Image"
    check_docker
    docker-compose build --no-cache backend
    print_status "Backend image built successfully"
}

build_frontend() {
    print_header "Building Frontend Image"
    check_docker
    docker-compose build --no-cache frontend
    print_status "Frontend image built successfully"
}

# Utility commands
clean() {
    print_header "Cleaning Docker Resources"
    print_warning "This will remove all stopped containers, unused networks, and dangling images"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker system prune -f
        print_status "Docker resources cleaned"
    else
        print_status "Cleanup cancelled"
    fi
}

status() {
    print_header "Docker Compose Status"
    echo "Production:"
    docker-compose ps
    echo
    echo "Development:"
    docker-compose -f docker-compose.dev.yml ps
}

# Database commands
db_backup() {
    print_header "Creating Database Backup"
    timestamp=$(date +%Y%m%d_%H%M%S)
    docker-compose exec database pg_dump -U postgres traffic_vision > "backup_${timestamp}.sql"
    print_status "Database backup created: backup_${timestamp}.sql"
}

db_restore() {
    if [ -z "$1" ]; then
        print_error "Please provide backup file: ./docker-scripts.sh db-restore backup_file.sql"
        exit 1
    fi
    
    print_header "Restoring Database from $1"
    docker-compose exec -T database psql -U postgres traffic_vision < "$1"
    print_status "Database restored from $1"
}

# Help function
show_help() {
    echo "Traffic Vision AI Docker Management"
    echo
    echo "Usage: ./docker-scripts.sh [COMMAND]"
    echo
    echo "Production Commands:"
    echo "  prod-up       Start production environment"
    echo "  prod-down     Stop production environment"
    echo "  prod-logs     Show production logs"
    echo
    echo "Development Commands:"
    echo "  dev-up        Start development environment"
    echo "  dev-down      Stop development environment"
    echo "  dev-logs      Show development logs"
    echo
    echo "Build Commands:"
    echo "  build-all     Build all images"
    echo "  build-backend Build backend image only"
    echo "  build-frontend Build frontend image only"
    echo
    echo "Utility Commands:"
    echo "  status        Show container status"
    echo "  clean         Clean Docker resources"
    echo "  db-backup     Create database backup"
    echo "  db-restore    Restore database from backup"
    echo "  help          Show this help message"
}

# Main command handler
case "$1" in
    "prod-up")
        prod_up
        ;;
    "prod-down")
        prod_down
        ;;
    "prod-logs")
        prod_logs
        ;;
    "dev-up")
        dev_up
        ;;
    "dev-down")
        dev_down
        ;;
    "dev-logs")
        dev_logs
        ;;
    "build-all")
        build_all
        ;;
    "build-backend")
        build_backend
        ;;
    "build-frontend")
        build_frontend
        ;;
    "status")
        status
        ;;
    "clean")
        clean
        ;;
    "db-backup")
        db_backup
        ;;
    "db-restore")
        db_restore "$2"
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac
