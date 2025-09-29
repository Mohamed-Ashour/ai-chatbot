#!/bin/bash

# Production deployment script for Full-Stack AI Chatbot
# Usage: ./docker-deploy.sh [staging|production] [version]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY="${DOCKER_REGISTRY:-your-registry.com}"
PROJECT_NAME="fullstack-ai-chatbot"
ENVIRONMENT="${1:-staging}"
VERSION="${2:-latest}"

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

# Build and tag images
build_images() {
    log_info "Building Docker images for $ENVIRONMENT environment..."
    
    # Build server
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-server:$VERSION ./server
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-server:latest ./server
    
    # Build client
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-client:$VERSION ./client
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-client:latest ./client
    
    # Build worker
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-worker:$VERSION ./worker
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-worker:latest ./worker
    
    log_success "Images built successfully!"
}

# Push images to registry
push_images() {
    log_info "Pushing images to registry..."
    
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-server:$VERSION
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-server:latest
    
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-client:$VERSION
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-client:latest
    
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-worker:$VERSION
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-worker:latest
    
    log_success "Images pushed successfully!"
}

# Create production docker-compose
create_production_compose() {
    log_info "Creating production docker-compose.yml..."
    
    cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: chatbot-redis-prod
    restart: unless-stopped
    volumes:
      - redis_data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    networks:
      - chatbot-network
    deploy:
      resources:
        limits:
          memory: 512mb
          cpus: '0.5'

  server:
    image: $DOCKER_REGISTRY/$PROJECT_NAME-server:$VERSION
    container_name: chatbot-server-prod
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379
      - CORS_ORIGINS=\${CORS_ORIGINS}
      - JWT_SECRET=\${JWT_SECRET}
      - TOKEN_EXPIRY_HOURS=\${TOKEN_EXPIRY_HOURS}
    depends_on:
      - redis
    networks:
      - chatbot-network
    deploy:
      resources:
        limits:
          memory: 1gb
          cpus: '1.0'
      replicas: 2

  worker:
    image: $DOCKER_REGISTRY/$PROJECT_NAME-worker:$VERSION
    container_name: chatbot-worker-prod
    restart: unless-stopped
    environment:
      - REDIS_URL=redis://redis:6379
      - GROQ_API_KEY=\${GROQ_API_KEY}
    depends_on:
      - redis
    networks:
      - chatbot-network
    deploy:
      resources:
        limits:
          memory: 1gb
          cpus: '1.0'
      replicas: 2

  client:
    image: $DOCKER_REGISTRY/$PROJECT_NAME-client:$VERSION
    container_name: chatbot-client-prod
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=\${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_WS_URL=\${NEXT_PUBLIC_WS_URL}
      - NODE_ENV=production
    depends_on:
      - server
    networks:
      - chatbot-network
    deploy:
      resources:
        limits:
          memory: 512mb
          cpus: '0.5'

volumes:
  redis_data:
    driver: local

networks:
  chatbot-network:
    driver: bridge
EOF

    log_success "Production docker-compose.yml created!"
}

# Create environment template for production
create_production_env() {
    log_info "Creating production environment template..."
    
    cat > .env.production.template << EOF
# Production Environment Configuration
# Copy this to .env.production and fill in your values

# Groq API Configuration
GROQ_API_KEY=your-groq-api-key-here

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
TOKEN_EXPIRY_HOURS=24

# CORS Configuration (your domain)
CORS_ORIGINS=https://yourapp.com

# Client Configuration (your domain)
NEXT_PUBLIC_API_URL=https://api.yourapp.com
NEXT_PUBLIC_WS_URL=wss://api.yourapp.com

# Docker Registry
DOCKER_REGISTRY=$DOCKER_REGISTRY
EOF

    log_success "Production environment template created!"
}

# Deploy to environment
deploy() {
    log_info "Deploying to $ENVIRONMENT environment..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        if [ ! -f .env.production ]; then
            log_error ".env.production file not found. Please create it from .env.production.template"
            exit 1
        fi
        docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
    elif [ "$ENVIRONMENT" = "staging" ]; then
        if [ ! -f .env.staging ]; then
            log_warning ".env.staging file not found. Using .env.docker as fallback"
            cp .env.docker .env.staging
        fi
        docker-compose -f docker-compose.prod.yml --env-file .env.staging up -d
    else
        log_error "Unknown environment: $ENVIRONMENT. Use 'staging' or 'production'"
        exit 1
    fi
    
    log_success "Deployment completed!"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf http://localhost:8000/health > /dev/null; then
            log_success "Server is healthy!"
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Waiting for server to be healthy... ($attempt/$max_attempts)"
        sleep 5
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "Health check failed after $max_attempts attempts"
        exit 1
    fi
}

# Show deployment info
show_info() {
    log_info "Deployment Information:"
    echo "Environment: $ENVIRONMENT"
    echo "Version: $VERSION"
    echo "Registry: $DOCKER_REGISTRY"
    echo ""
    docker-compose -f docker-compose.prod.yml ps
}

# Main script logic
main() {
    case "${3:-deploy}" in
        "build")
            build_images
            ;;
        "push")
            push_images
            ;;
        "prepare")
            create_production_compose
            create_production_env
            ;;
        "deploy")
            build_images
            create_production_compose
            deploy
            health_check
            show_info
            ;;
        "health")
            health_check
            ;;
        "info")
            show_info
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [staging|production] [version] [command]"
            echo ""
            echo "Commands:"
            echo "  deploy    Full deployment (build, deploy, health check)"
            echo "  build     Build Docker images only"
            echo "  push      Push images to registry"
            echo "  prepare   Create production files"
            echo "  health    Perform health checks"
            echo "  info      Show deployment information"
            echo "  help      Show this help message"
            ;;
        *)
            log_error "Unknown command: ${3:-deploy}"
            echo "Use '$0 help' for usage information."
            exit 1
            ;;
    esac
}

main "$@"