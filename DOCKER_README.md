# 🐳 Traffic Vision AI - Docker Setup

Complete Docker setup for Traffic Vision AI with production and development environments.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ RAM available for containers
- 10GB+ disk space

## 🚀 Quick Start

### Production Environment

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit environment variables (optional)
nano .env

# 3. Start production environment
./docker-scripts.sh prod-up

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Development Environment

```bash
# Start development environment with live reload
./docker-scripts.sh dev-up

# Access the application
# Frontend: http://localhost:3000 (with hot reload)
# Backend API: http://localhost:8000 (with auto-reload)
# Database: localhost:5432
```

## 📁 File Structure (Separated Backend & Frontend)

```
traffic-vision-ai-hub/
├── docker-compose.yml          # Production configuration
├── docker-compose.dev.yml      # Development configuration
├── Dockerfile.frontend         # Frontend Docker build (React + Nginx)
├── nginx.conf                  # Nginx configuration for frontend
├── .env.example               # Environment variables template
├── docker-scripts.sh          # Management scripts
└── backend/
    ├── Dockerfile             # Backend Docker build (FastAPI + Python)
    ├── init.sql              # Database initialization
    ├── .dockerignore          # Backend-specific ignore file
    └── ...
```

### 🔧 Container Architecture (Separated)

**Backend Container:**

- **Build:** `./backend/Dockerfile`
- **Technology:** FastAPI + Python + YOLOv8
- **Port:** 8000
- **Features:** AI processing, API endpoints, authentication

**Frontend Container:**

- **Build:** `./Dockerfile.frontend`
- **Technology:** React + Vite + Nginx
- **Port:** 3000 (production), 80 (nginx)
- **Features:** SPA, API proxy, static file serving

## 🛠️ Management Commands

Use the `docker-scripts.sh` script for easy management:

### Production Commands

```bash
./docker-scripts.sh prod-up      # Start production
./docker-scripts.sh prod-down    # Stop production
./docker-scripts.sh prod-logs    # View logs
```

### Development Commands

```bash
./docker-scripts.sh dev-up       # Start development
./docker-scripts.sh dev-down     # Stop development
./docker-scripts.sh dev-logs     # View logs
```

### Build Commands

```bash
./docker-scripts.sh build-all       # Build all images
./docker-scripts.sh build-backend   # Build backend only
./docker-scripts.sh build-frontend  # Build frontend only
```

### Utility Commands

```bash
./docker-scripts.sh status      # Show container status
./docker-scripts.sh clean       # Clean Docker resources
./docker-scripts.sh db-backup   # Backup database
./docker-scripts.sh db-restore  # Restore database
```

## 🔧 Configuration

### Environment Variables

Edit `.env` file to customize:

```env
# Database
DB_PASSWORD=your_secure_password
DATABASE_URL=postgresql://postgres:password@database:5432/traffic_vision

# JWT Security
SECRET_KEY=your_very_long_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API
VITE_API_URL=http://localhost:8000
```

### Volume Mounts

**Production volumes (persistent data):**

- `backend_uploads` - Uploaded videos
- `backend_results` - Processed results
- `backend_models` - AI models
- `postgres_data` - Database data

**Development volumes (live reload):**

- `./backend:/app` - Backend source code
- `./:/app` - Frontend source code

## 🏗️ Services

### 1. Database (PostgreSQL)

- **Image:** `postgres:15-alpine`
- **Port:** `5432`
- **Data:** Persistent volume
- **Health Check:** Built-in

### 2. Backend (FastAPI)

- **Build:** `./backend/Dockerfile`
- **Port:** `8000`
- **Features:** YOLOv8, video processing
- **Health Check:** `/docs` endpoint

### 3. Frontend (React + Nginx)

- **Build:** `./Dockerfile.frontend`
- **Port:** `3000` (production), `80` (nginx)
- **Features:** SPA routing, API proxy
- **Health Check:** Root endpoint

### 4. Redis (Optional)

- **Image:** `redis:7-alpine`
- **Port:** `6379`
- **Purpose:** Caching, sessions

## 🔍 Monitoring & Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

### Health Checks

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost:8000/docs  # Backend
curl http://localhost:3000       # Frontend
```

## 🛡️ Security Features

- **Non-root users** in containers
- **Security headers** in Nginx
- **Environment variable** protection
- **Network isolation** between services
- **Health checks** for all services

## 📊 Performance

### Resource Usage

- **Backend:** ~2GB RAM (with AI models)
- **Frontend:** ~100MB RAM
- **Database:** ~200MB RAM
- **Total:** ~2.5GB RAM

### Optimization

- **Multi-stage builds** for smaller images
- **Layer caching** for faster builds
- **Gzip compression** for frontend
- **Volume mounting** for persistent data

## 🔧 Troubleshooting

### Common Issues

**1. Port already in use:**

```bash
# Check what's using the port
lsof -i :8000
lsof -i :3000

# Stop conflicting services
./docker-scripts.sh prod-down
./docker-scripts.sh dev-down
```

**2. Database connection issues:**

```bash
# Check database health
docker-compose exec database pg_isready -U postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

**3. Build failures:**

```bash
# Clean build cache
docker system prune -f
./docker-scripts.sh build-all
```

**4. Permission issues:**

```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

### Logs & Debugging

```bash
# Backend logs
docker-compose logs backend

# Database logs
docker-compose logs database

# Enter container for debugging
docker-compose exec backend bash
docker-compose exec database psql -U postgres traffic_vision
```

## 🚀 Deployment

### Production Deployment

1. **Server Setup:**

   ```bash
   # Install Docker & Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

2. **Application Setup:**

   ```bash
   git clone <your-repo>
   cd traffic-vision-ai-hub
   cp .env.example .env
   # Edit .env with production values
   ```

3. **Start Services:**

   ```bash
   ./docker-scripts.sh prod-up
   ```

4. **Setup Reverse Proxy (Optional):**
   - Use Nginx or Traefik for SSL termination
   - Configure domain routing

### Backup & Restore

```bash
# Create backup
./docker-scripts.sh db-backup

# Restore from backup
./docker-scripts.sh db-restore backup_20231201_120000.sql
```

## 📞 Support

For issues and questions:

1. Check logs: `./docker-scripts.sh prod-logs`
2. Check status: `./docker-scripts.sh status`
3. Clean and rebuild: `./docker-scripts.sh clean && ./docker-scripts.sh build-all`
