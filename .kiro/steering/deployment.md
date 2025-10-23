---
inclusion: always
---

# Deployment Guidelines

## Docker Architecture Patterns

### Multi-Service Container Strategy
- **Server & Worker**: Environment-agnostic images using runtime environment variables
- **Client**: Environment-specific images with build-time URL injection
- **Redis**: Persistent data with health checks and password authentication
- **Optional Services**: Nginx reverse proxy and monitoring stack (Prometheus/Grafana)

### Container Resource Management
- **Memory Limits**: Server/Client (512M), Worker (1G), Redis (512M)
- **CPU Limits**: Server/Client (0.5), Worker (1.0), Redis (0.5)
- **Health Checks**: All services have proper health endpoints and checks
- **Restart Policy**: `unless-stopped` for production resilience

## Environment Configuration

### Build-Time vs Runtime Variables
- **Client**: `NEXT_PUBLIC_*` variables are baked into JavaScript bundle at build time
- **Server/Worker**: All variables are runtime configurable via environment
- **Required Secrets**: `GROQ_API_KEY`, `REDIS_PASSWORD`, API URLs for staging/production

### Environment Separation
- **Staging**: Uses `-staging` image suffix and staging API URLs
- **Production**: Uses `-production` image suffix and production API URLs
- **Development**: Local builds with custom URLs via build args

## CI/CD Pipeline Conventions

### Image Naming Strategy
```
ghcr.io/{org}/{repo}/server:latest
ghcr.io/{org}/{repo}/worker:latest
ghcr.io/{org}/{repo}/client:latest-staging
ghcr.io/{org}/{repo}/client:latest-production
```

### Multi-Architecture Builds
- **Platforms**: `linux/amd64`, `linux/arm64`
- **Cache Strategy**: GitHub Actions cache for faster builds
- **SBOM Generation**: Security bill of materials for all images

### Deployment Triggers
- **Automatic**: On successful CI workflow completion for main branch
- **Manual**: Direct push to main or tag creation
- **Environment Selection**: Via `CLIENT_ENV` variable (staging/production)

## Production Deployment Commands

### Standard Deployment
```bash
# Staging environment
CLIENT_ENV=staging docker compose -f docker-compose.prod.yml up -d

# Production environment
CLIENT_ENV=production docker compose -f docker-compose.prod.yml up -d
```

### Development with Custom URLs
```bash
# Local development with remote backend
docker compose build \
  --build-arg NEXT_PUBLIC_API_URL=http://your-server:8000 \
  --build-arg NEXT_PUBLIC_WS_URL=ws://your-server:8000 \
  client
```

## Service Dependencies & Health

### Startup Order
1. Redis (with health check)
2. Server (depends on Redis health)
3. Worker (depends on Redis health)
4. Client (depends on Server)
5. Nginx (optional, depends on Client/Server)

### Health Check Endpoints
- **Server**: `GET /health` (curl-based)
- **Client**: `GET /` (curl-based)
- **Worker**: Redis connection test
- **Redis**: `redis-cli ping` with authentication

## Troubleshooting Patterns

### Client URL Issues
- Check image tag suffix (`-staging` vs `-production`)
- Verify GitHub secrets configuration
- Remember: Client URLs cannot be changed at runtime

### Service Communication
- All services communicate via Docker network names
- External access via mapped ports (3000, 8000, 6379)
- CORS configuration must include all client origins

### Resource Monitoring
- Optional Prometheus/Grafana stack available via profiles
- Resource limits prevent container resource exhaustion
- Health checks enable automatic container restart

## Security Considerations

### Container Security
- Non-root users in all containers
- Minimal base images (Alpine where possible)
- No sensitive data in image layers

### Network Security
- Isolated Docker network with custom subnet
- Redis password authentication required
- CORS origins explicitly configured

### Secrets Management
- All secrets via environment variables
- GitHub secrets for CI/CD pipeline
- No hardcoded credentials in any files
