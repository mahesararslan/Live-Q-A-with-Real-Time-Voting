# 🐳 Docker Setup

## Prerequisites
- Docker and Docker Compose installed
- Google OAuth credentials (for authentication)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Live-Q-A-with-Real-Time-Voting
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your Google OAuth credentials
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3001
   - Backend: http://localhost:3000
   - GraphQL Playground: http://localhost:3000/graphql

## Services

- **Frontend (Next.js)**: Port 3001
- **Backend (NestJS)**: Port 3000
- **PostgreSQL**: Port 5432
- **Redis**: Port 6379

## Development

### Run in development mode
```bash
# Start services
docker-compose up postgres redis

# Run backend locally
cd backend
npm install
npm run start:dev

# Run frontend locally
cd frontend
npm install
npm run dev
```

### Useful Commands

```bash
# Build and start all services
docker-compose up --build

# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down

# Remove volumes (reset database)
docker-compose down -v

# Rebuild specific service
docker-compose build [service-name]
```

## Production Deployment

For production, consider:
- Using external managed databases (PostgreSQL, Redis)
- Setting up proper environment variables
- Using reverse proxy (nginx)
- Implementing SSL/TLS
- Setting up monitoring and logging

## Environment Variables

### Required
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_SECRET`: Your Google OAuth client secret

### Optional
- `REDIS_URL`: External Redis URL (overrides Docker Redis)
- `DATABASE_URL`: External PostgreSQL URL (overrides Docker PostgreSQL)
