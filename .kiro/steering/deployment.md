---
inclusion: always
---

# Deployment & Infrastructure Guidelines

## Critical Rules for AI Assistant

### Docker Compose File Selection
- **Development**: Use `docker-compose.yml` (default)
- **Production/Staging**: ALWAYS use `docker-compose.prod.yml` with `-f` flag
- **Never modify**: Production compose files without understanding resource limits

### Environment-Specific Client Builds
- **Client images are environment-specific** - URLs baked in at build time
- **Staging**: `client:latest-staging` with staging API URLs
- **Production**: `client:latest-production` with production API URLs
- **Cannot change URLs at runtime** - must rebuild for different environments

### Service Dependencies (Critical Order)
1. Redis must start first and pass health check
2. Server and Worker start after Redis is healthy
3. Client starts after Server is healthy
4. Never start services out of order

## Container Architecture

### Image Strategy
- **Server/Worker**: Environment-agnostic, configured via runtime env vars
- **Client**: Environment-specific builds with baked-in API URLs
- **Redis**: `redis/redis-stack-server:7.4.0-v0` with mandatory password auth
- **Base Images**: Alpine Linux preferred for security and size

### Resource Limits (Production)
```yaml
# These limits are enforced in production
server: { memory: "512M", cpus: "0.5" }
client: { memory: "512M", cpus: "0.5" }
worker: { memory: "1G", cpus: "1.0" }
redis: { memory: "512M", cpus: "0.5" }
```

### Health Check Endpoints
- **Server**: `GET /health` on port 8000
- **Client**: `GET /` on port 3000
- **Worker**: Redis connection test (no HTTP endpoint)
- **Redis**: `PING` command with password authentication

## Environment Configuration

### Client Build-Time Variables (Immutable)
```bash
# These cannot be changed at runtime
NEXT_PUBLIC_API_URL=https://api.domain.com
NEXT_PUBLIC_WS_URL=wss://api.domain.com
```

### Required Runtime Secrets
```bash
GROQ_API_KEY=         # AI model API key (required for worker)
REDIS_PASSWORD=       # Redis authentication (required for all services)
CORS_ORIGINS=         # Comma-separated origins (required for server)
```

### Image Tag Conventions
```
ghcr.io/username/repo/server:latest
ghcr.io/username/repo/worker:latest
ghcr.io/username/repo/client:latest-staging
ghcr.io/username/repo/client:latest-production
```

## Deployment Commands

### Standard Deployment
```bash
# Staging deployment
CLIENT_ENV=staging docker compose -f docker-compose.prod.yml up -d

# Production deployment
CLIENT_ENV=production docker compose -f docker-compose.prod.yml up -d

# Development (local only)
./docker-start.sh dev
```

### Service Management
```bash
# Check service status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs [service]

# Restart specific service
docker compose -f docker-compose.prod.yml restart [service]
```

## CI/CD Workflow Integration

### Automatic Triggers
- **Build Images**: On push to main branch after tests pass
- **Deploy Staging**: Automatically after successful image build
- **Deploy Production**: On version tag push (format: `v*`)

### GitHub Actions Workflow Files
- `.github/workflows/build-and-push.yml`: Builds and pushes images
- `.github/workflows/deploy-staging.yml`: Deploys to staging environment
- `.github/workflows/deploy-production.yml`: Deploys to production environment

### Required GitHub Repository Secrets
```
# SSH Access
STAGING_SSH_PRIVATE_KEY, STAGING_USER, STAGING_HOST
PRODUCTION_SSH_PRIVATE_KEY, PRODUCTION_USER, PRODUCTION_HOST

# API Keys
STAGING_GROQ_API_KEY, PRODUCTION_GROQ_API_KEY

# Infrastructure
STAGING_REDIS_PASSWORD, PRODUCTION_REDIS_PASSWORD

# Client URLs (build-time)
STAGING_API_URL, STAGING_WS_URL
PRODUCTION_API_URL, PRODUCTION_WS_URL, PRODUCTION_DOMAIN
```

## Network & Security

### Service Communication
- **Internal**: Use Docker service names (`redis`, `server`, `client`)
- **External**: Mapped ports (3000→client, 8000→server, 6379→redis)
- **Network**: Custom bridge network `172.20.0.0/16`

### CORS Configuration
- **Must include**: External domain AND internal `http://client:3000`
- **Never use**: Wildcard `*` in production
- **Format**: Comma-separated list in `CORS_ORIGINS`

### Security Requirements
- All containers run as non-root users
- No secrets in Dockerfiles or build context
- Redis requires password authentication
- Use `.env.example` as template, never commit `.env` files

## Troubleshooting Common Issues

### Client URL Problems
- **Symptom**: Client cannot connect to API
- **Cause**: Wrong image tag or incorrect build-time URLs
- **Solution**: Verify image tag suffix matches environment

### Service Startup Failures
- **Check**: Health check endpoints before declaring success
- **Redis**: Ensure password is set and connection works
- **Dependencies**: Verify startup order (Redis → Server/Worker → Client)

### Deployment Failures
- **Production**: Has automatic rollback on health check failure
- **Override**: Use `force_deploy` workflow input to skip health checks
- **Logs**: Check service logs for specific error messages

### Environment Variable Issues
- **Client**: Build-time vars cannot be changed at runtime
- **Server/Worker**: Runtime vars can be updated with container restart
- **Secrets**: Must be set in GitHub repository secrets for CI/CD
