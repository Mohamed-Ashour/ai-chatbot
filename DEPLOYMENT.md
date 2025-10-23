# Deployment Guide

This guide explains how to deploy the chatbot in different environments.

## Environment-Specific Builds

The CI/CD pipeline builds environment-specific Docker images:
- **Server & Worker**: Environment-agnostic (single image for all environments)
- **Client**: Separate images for staging and production (URLs baked in at build time)

### GitHub Secrets Required

Configure these secrets in your GitHub repository:

#### Staging
- `STAGING_API_URL`: e.g., `http://staging.example.com:8000`
- `STAGING_WS_URL`: e.g., `ws://staging.example.com:8000`

#### Production
- `PRODUCTION_API_URL`: e.g., `http://api.example.com`
- `PRODUCTION_WS_URL`: e.g., `ws://api.example.com`

## Docker Images

The workflow builds and pushes:
- `ghcr.io/<org>/<repo>/server:latest`
- `ghcr.io/<org>/<repo>/worker:latest`
- `ghcr.io/<org>/<repo>/client:latest-staging`
- `ghcr.io/<org>/<repo>/client:latest-prod`

## Deployment

### Using Docker Compose (Production)

#### Deploy to Staging
```bash
# Set environment
export CLIENT_ENV=staging

# Deploy
docker compose -f docker-compose.prod.yml up -d
```

#### Deploy to Production
```bash
# Set environment
export CLIENT_ENV=production

# Deploy
docker compose -f docker-compose.prod.yml up -d
```

### Local Development Builds

For local development with custom URLs:

```bash
# Build client with custom URLs
docker compose build \
  --build-arg NEXT_PUBLIC_API_URL=http://141.145.159.209:8000 \
  --build-arg NEXT_PUBLIC_WS_URL=ws://141.145.159.209:8000 \
  client

# Start services
docker compose up -d
```

## Environment Variables

### Server (.env)
```bash
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_USER=default
REDIS_PASSWORD=your_password
CORS_ORIGINS=http://localhost:3000,http://client:3000
TOKEN_EXPIRY_HOURS=1
```

### Worker (.env)
```bash
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_USER=default
REDIS_PASSWORD=your_password
GROQ_API_KEY=your_groq_api_key
```

### Client (Build-time only)
```bash
NEXT_PUBLIC_API_URL=http://your-api-url
NEXT_PUBLIC_WS_URL=ws://your-api-url
```

**Note**: Client environment variables are baked into the build and cannot be changed at runtime.

## Troubleshooting

### Wrong API URL in Client
If the client is connecting to the wrong URL:
1. Check which image tag you're using (`latest-staging` or `latest-prod`)
2. Verify GitHub secrets are set correctly
3. Rebuild the client image with correct build arguments

### Checking Client Environment Variables
```bash
# Check environment inside container
docker compose exec client env | grep NEXT_PUBLIC

# These should be baked into the JavaScript bundle
# Runtime env vars won't affect the client behavior
```

## Architecture Notes

- **Why separate client images?** Next.js bakes `NEXT_PUBLIC_*` variables into the JavaScript bundle at build time. They cannot be changed at runtime.
- **Why not separate server/worker images?** Server and worker use runtime environment variables, so one image works for all environments.
