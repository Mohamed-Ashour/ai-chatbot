#!/bin/bash

# Docker startup script for Full-Stack AI Chatbot
# Usage: ./docker-start.sh [build|rebuild|dev|logs|stop|clean]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        log_warning ".env file not found. Creating from .env-example template..."
        cp .env-example .env
        log_warning "Please edit .env file with your API keys and configuration before running again."
        exit 1
    fi
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Build and start services
start_services() {
    log_info "Building and starting AI Chatbot services..."
    docker compose up -d --build
    
    # Clean up dangling images after build
    log_info "Cleaning up dangling images..."
    docker image prune -f > /dev/null 2>&1 || true
    
    log_success "Services started successfully!"
    log_info "Client: http://localhost:3000"
    log_info "Server: http://localhost:8000"
    log_info "Redis: localhost:6379"
}

# Start development mode
start_dev() {
    log_info "Starting development mode with hot reload..."
    docker compose --profile dev up -d --build
    
    # Clean up dangling images after build
    log_info "Cleaning up dangling images..."
    docker image prune -f > /dev/null 2>&1 || true
    
    log_success "Development services started!"
    log_info "Production Client: http://localhost:3000"
    log_info "Development Client: http://localhost:3001"
    log_info "Server: http://localhost:8000"
}

# Rebuild all services
rebuild_services() {
    log_info "Rebuilding all services from scratch..."
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    
    # Clean up dangling images after build
    log_info "Cleaning up dangling images..."
    docker image prune -f > /dev/null 2>&1 || true
    
    log_success "Services rebuilt and started!"
}

# Show logs
show_logs() {
    log_info "Showing service logs (Ctrl+C to exit)..."
    docker compose logs -f
}

# Stop services
stop_services() {
    log_info "Stopping all services..."
    docker compose down
    log_success "Services stopped!"
}

# Clean up everything
clean_all() {
    log_warning "This will remove all containers, images, and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "Cleaning up Docker resources..."
        docker compose down -v --rmi all
        docker image prune -af
        docker system prune -f
        log_success "Cleanup completed!"
    else
        log_info "Cleanup cancelled."
    fi
}

# Show service status
show_status() {
    log_info "Service Status:"
    docker compose ps
    echo
    log_info "Health Checks:"
    docker compose exec redis redis-cli ping || echo "Redis: Not responding"
    curl -sf http://localhost:8000/health > /dev/null && echo "Server: Healthy" || echo "Server: Unhealthy"
    curl -sf http://localhost:3000 > /dev/null && echo "Client: Healthy" || echo "Client: Unhealthy"
}

# Main script logic
main() {
    check_docker
    
    case "${1:-start}" in
        "build"|"start")
            check_env
            start_services
            ;;
        "rebuild")
            check_env
            rebuild_services
            ;;
        "dev")
            check_env
            start_dev
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "stop")
            stop_services
            ;;
        "clean")
            clean_all
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  start     Build and start all services (default)"
            echo "  build     Same as start"
            echo "  rebuild   Rebuild all services from scratch"
            echo "  dev       Start with development profile"
            echo "  logs      Show service logs"
            echo "  status    Show service status and health"
            echo "  stop      Stop all services"
            echo "  clean     Remove all containers, images, and volumes"
            echo "  help      Show this help message"
            ;;
        *)
            log_error "Unknown command: $1"
            echo "Use '$0 help' for usage information."
            exit 1
            ;;
    esac
}

main "$@"