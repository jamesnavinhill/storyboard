# Deployment Guide

This guide covers deploying the VibeBoard AI Music Video Storyboarder to production environments.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Build Process](#build-process)
- [Deployment Options](#deployment-options)
- [Post-Deployment Verification](#post-deployment-verification)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Disk Space**: Minimum 2GB for application + assets
- **Memory**: Minimum 512MB RAM (2GB recommended)
- **OS**: Linux, macOS, or Windows Server

### Required Secrets

- **Gemini API Key**: Required for AI generation features
- **CORS Origin**: Your production domain (for API security)

### Optional Services

- **Reverse Proxy**: nginx or Apache for SSL termination
- **Process Manager**: PM2 or systemd for server management
- **Monitoring**: Application monitoring service (e.g., Sentry, DataDog)

---

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd vibeboard
```

### 2. Install Dependencies

```bash
npm install --production
```

For development dependencies (needed for build):
```bash
npm install
```

### 3. Configure Environment Variables

Create `.env.local` in the project root:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=4000
NODE_ENV=production

# Database
DB_PATH=data/storyboard.db
DATA_DIR=data/

# CORS (set to your frontend domain)
CORS_ORIGIN=https://yourdomain.com

# AI Telemetry (recommended for production)
ENABLE_AI_TELEMETRY=true

# Rate Limiting (adjust based on your needs)
AI_RATE_LIMIT_WINDOW_MS=60000
AI_RATE_LIMIT_MAX_REQUESTS=30

# Frontend API URL (if serving from different domain)
VITE_API_URL=https://api.yourdomain.com/api
```

### 4. Verify Configuration

```bash
npm run check:db
```

This command:
- Runs database migrations
- Verifies table structure
- Checks asset directory permissions

---

## Database Setup

### Initial Migration

The database is automatically initialized on first server start. To manually run migrations:

```bash
npm run migrate
```

### Migration Files

Migrations are located in `server/migrations/`:
- `001_init.sql` - Base schema (projects, scenes, chat, assets)
- `002_scene_groups_tags.sql` - Groups and tags
- `003_scene_history.sql` - Scene versioning

### Database Backup

**Before deployment**, backup your database:

```bash
# Create backup
cp data/storyboard.db data/storyboard.db.backup-$(date +%Y%m%d-%H%M%S)

# Verify backup
sqlite3 data/storyboard.db.backup-* "SELECT COUNT(*) FROM projects;"
```

### Database Migration Strategy

**For zero-downtime deployments:**

1. **Test migrations** in staging environment first
2. **Backup production database** before applying migrations
3. **Run migrations** during low-traffic period
4. **Verify data integrity** after migration
5. **Keep backup** for 30 days minimum

---

## Build Process

### 1. Build Frontend

```bash
npm run build
# or
npm run build:web
```

Output: `dist/` directory containing static assets

### 2. Build Backend

```bash
npm run build:server
```

Output: `dist-server/` directory containing compiled server code

### 3. Build Both

```bash
npm run build:all
```

### 4. Verify Build

```bash
# Check frontend build
ls -lh dist/

# Check server build
ls -lh dist-server/

# Verify no errors
npm run typecheck
npm run typecheck:server
```

---

## Deployment Options

### Option 1: Single Server Deployment (Recommended for Small-Medium Scale)

**Architecture:**
- Frontend and backend on same server
- nginx reverse proxy for SSL and static file serving
- PM2 for process management

**Steps:**

1. **Build application:**
   ```bash
   npm run build:all
   ```

2. **Configure nginx:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name yourdomain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       # Frontend static files
       location / {
           root /path/to/vibeboard/dist;
           try_files $uri $uri/ /index.html;
       }

       # API proxy
       location /api {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }

       # Asset files
       location /api/assets/files {
           alias /path/to/vibeboard/data/assets;
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

3. **Start server with PM2:**
   ```bash
   # Install PM2 globally
   npm install -g pm2

   # Start server
   pm2 start npm --name "vibeboard-server" -- run start:server

   # Save PM2 configuration
   pm2 save

   # Setup PM2 to start on boot
   pm2 startup
   ```

4. **Verify deployment:**
   ```bash
   # Check PM2 status
   pm2 status

   # View logs
   pm2 logs vibeboard-server

   # Monitor
   pm2 monit
   ```

### Option 2: Separate Frontend/Backend Deployment

**Architecture:**
- Frontend on CDN or static hosting (Vercel, Netlify, S3+CloudFront)
- Backend on dedicated server or container

**Frontend Deployment:**

1. **Build frontend:**
   ```bash
   npm run build:web
   ```

2. **Deploy to static hosting:**
   ```bash
   # Example: Vercel
   vercel deploy --prod

   # Example: Netlify
   netlify deploy --prod --dir=dist

   # Example: S3
   aws s3 sync dist/ s3://your-bucket/ --delete
   ```

3. **Configure environment:**
   ```bash
   # Set API URL to backend server
   VITE_API_URL=https://api.yourdomain.com/api
   ```

**Backend Deployment:**

1. **Build backend:**
   ```bash
   npm run build:server
   ```

2. **Deploy to server:**
   ```bash
   # Copy files to server
   rsync -avz --exclude node_modules --exclude dist . user@server:/path/to/vibeboard/

   # Install production dependencies
   ssh user@server "cd /path/to/vibeboard && npm install --production"

   # Start with PM2
   ssh user@server "cd /path/to/vibeboard && pm2 start npm --name vibeboard-server -- run start:server"
   ```

### Option 3: Docker Deployment

**Dockerfile (example):**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy application files
COPY . .

# Build application
RUN npm run build:all

# Expose ports
EXPOSE 4000

# Start server
CMD ["npm", "run", "start:server"]
```

**Docker Compose (example):**

```yaml
version: '3.8'

services:
  vibeboard:
    build: .
    ports:
      - "4000:4000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - NODE_ENV=production
      - ENABLE_AI_TELEMETRY=true
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

**Deploy:**

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Post-Deployment Verification

### 1. Health Check

```bash
# Check server health
curl https://yourdomain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-24T12:00:00.000Z"}
```

### 2. API Endpoints

```bash
# Test project list
curl https://yourdomain.com/api/projects

# Test AI endpoint (requires authentication)
curl -X POST https://yourdomain.com/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello","history":[],"chatModel":"gemini-2.0-flash-exp"}'
```

### 3. Frontend

1. Open browser to `https://yourdomain.com`
2. Verify application loads
3. Test project creation
4. Test scene generation
5. Verify assets load correctly

### 4. Database

```bash
# Check database integrity
sqlite3 data/storyboard.db "PRAGMA integrity_check;"

# Verify tables exist
sqlite3 data/storyboard.db ".tables"

# Check project count
sqlite3 data/storyboard.db "SELECT COUNT(*) FROM projects;"
```

### 5. Logs

```bash
# PM2 logs
pm2 logs vibeboard-server --lines 100

# Check for errors
pm2 logs vibeboard-server --err

# Monitor in real-time
pm2 logs vibeboard-server --lines 0
```

---

## Rollback Procedures

### Quick Rollback (PM2)

```bash
# Stop current version
pm2 stop vibeboard-server

# Restore previous code
git checkout <previous-commit-or-tag>

# Rebuild
npm run build:all

# Restart
pm2 restart vibeboard-server
```

### Database Rollback

```bash
# Stop server
pm2 stop vibeboard-server

# Restore database backup
cp data/storyboard.db data/storyboard.db.failed
cp data/storyboard.db.backup-YYYYMMDD-HHMMSS data/storyboard.db

# Verify backup
sqlite3 data/storyboard.db "SELECT COUNT(*) FROM projects;"

# Restart server
pm2 restart vibeboard-server
```

### Full Rollback Procedure

1. **Stop services:**
   ```bash
   pm2 stop vibeboard-server
   ```

2. **Backup current state:**
   ```bash
   cp data/storyboard.db data/storyboard.db.rollback-$(date +%Y%m%d-%H%M%S)
   tar -czf data-backup-$(date +%Y%m%d-%H%M%S).tar.gz data/
   ```

3. **Restore previous version:**
   ```bash
   git checkout <previous-stable-tag>
   npm install
   npm run build:all
   ```

4. **Restore database if needed:**
   ```bash
   cp data/storyboard.db.backup-<timestamp> data/storyboard.db
   ```

5. **Restart services:**
   ```bash
   pm2 restart vibeboard-server
   ```

6. **Verify rollback:**
   ```bash
   curl https://yourdomain.com/api/health
   pm2 logs vibeboard-server --lines 50
   ```

---

## Monitoring & Maintenance

### Log Management

**PM2 Log Rotation:**

```bash
# Install PM2 log rotate module
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

**Manual Log Rotation:**

```bash
# Rotate logs
pm2 flush

# Archive old logs
tar -czf logs-$(date +%Y%m%d).tar.gz ~/.pm2/logs/
```

### Database Maintenance

**Regular Maintenance Tasks:**

```bash
# Prune orphaned assets (weekly)
npm run maintain prune

# Vacuum database (monthly)
sqlite3 data/storyboard.db "VACUUM;"

# Analyze database (monthly)
sqlite3 data/storyboard.db "ANALYZE;"

# Check database size
du -h data/storyboard.db
```

**Automated Maintenance (cron):**

```bash
# Edit crontab
crontab -e

# Add maintenance tasks
0 2 * * 0 cd /path/to/vibeboard && npm run maintain prune
0 3 1 * * cd /path/to/vibeboard && sqlite3 data/storyboard.db "VACUUM; ANALYZE;"
```

### Backup Strategy

**Automated Backups:**

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d-%H%M%S)

# Backup database
cp data/storyboard.db "$BACKUP_DIR/storyboard-$DATE.db"

# Backup assets
tar -czf "$BACKUP_DIR/assets-$DATE.tar.gz" data/assets/

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "storyboard-*.db" -mtime +30 -delete
find "$BACKUP_DIR" -name "assets-*.tar.gz" -mtime +30 -delete
```

**Schedule with cron:**

```bash
# Daily backup at 1 AM
0 1 * * * /path/to/vibeboard/backup.sh
```

### Performance Monitoring

**PM2 Monitoring:**

```bash
# Real-time monitoring
pm2 monit

# CPU and memory usage
pm2 status

# Detailed info
pm2 info vibeboard-server
```

**Application Metrics:**

Enable telemetry in production:
```bash
ENABLE_AI_TELEMETRY=true
```

Monitor logs for:
- Request latency (`latencyMs`)
- Error rates (`status: 500`)
- Rate limit hits (`errorCode: "RATE_LIMIT_EXCEEDED"`)

### Health Checks

**Automated Health Check Script:**

```bash
#!/bin/bash
# health-check.sh

HEALTH_URL="https://yourdomain.com/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$RESPONSE" != "200" ]; then
    echo "Health check failed: HTTP $RESPONSE"
    # Send alert (email, Slack, PagerDuty, etc.)
    # Optionally restart service
    pm2 restart vibeboard-server
fi
```

**Schedule with cron:**

```bash
# Check every 5 minutes
*/5 * * * * /path/to/vibeboard/health-check.sh
```

### Security Updates

**Regular Update Schedule:**

```bash
# Check for security vulnerabilities
npm audit

# Update dependencies
npm update

# Rebuild and test
npm run build:all
npm run test:api

# Deploy updates
pm2 restart vibeboard-server
```

---

## Troubleshooting

### Server Won't Start

**Check logs:**
```bash
pm2 logs vibeboard-server --err
```

**Common issues:**
- Missing `GEMINI_API_KEY` environment variable
- Database file permissions
- Port 4000 already in use
- Missing dependencies

### High Memory Usage

**Check memory:**
```bash
pm2 info vibeboard-server
```

**Solutions:**
- Increase Node.js memory limit: `node --max-old-space-size=4096`
- Restart server periodically
- Run `npm run maintain prune` to clean up assets

### Slow Performance

**Check:**
- Database size: `du -h data/storyboard.db`
- Asset directory size: `du -sh data/assets/`
- Server logs for slow queries

**Solutions:**
- Run `VACUUM` and `ANALYZE` on database
- Prune old assets
- Consider upgrading server resources

---

## Additional Resources

- [Configuration Guide](./CONFIGURATION.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Project History](./HISTORY.md)
- [Main README](../README.md)

---

**Last Updated:** October 24, 2025
