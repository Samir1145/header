# Production Deployment Guide

This guide covers deploying the Rezolution Bazar application with the SQLite backend.

---

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A server or hosting platform (VPS, Docker, or cloud service)

---

## Project Structure

```
rezolutionBazar/
├── neon-backend/           # Backend API server
│   ├── sqlite-server.js    # Main SQLite backend
│   ├── database.sqlite     # SQLite database file (auto-created)
│   └── package.json
├── src/                    # Frontend React app
├── dist/                   # Production build output
└── package.json
```

---

## Step 1: Backend Setup

### 1.1 Install Dependencies

```bash
cd neon-backend
npm install
```

### 1.2 Configure Environment Variables

Create a `.env` file in the `neon-backend/` directory:

```env
# Server configuration
PORT=4000
NODE_ENV=production

# JWT Secret - CHANGE THIS IN PRODUCTION!
JWT_SECRET=your-super-secure-random-string-at-least-32-characters

# Optional: Database path (defaults to ./database.sqlite)
# DATABASE_PATH=/path/to/database.sqlite
```

> ⚠️ **Important**: Generate a strong JWT secret for production:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 1.3 Start the Backend

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The API will be available at `http://localhost:4000`

---

## Step 2: Frontend Setup

### 2.1 Install Dependencies

```bash
cd rezolutionBazar
npm install
```

### 2.2 Configure Environment Variables

Create a `.env.production` file:

```env
# API URL - Point to your backend server
VITE_API_URL=https://api.yourdomain.com

# Or for same-server deployment
VITE_API_URL=http://localhost:4000
```

### 2.3 Build for Production

```bash
npm run build-no-bun
```

This creates an optimized build in the `dist/` folder.

---

## Step 3: Deployment Options

### Option A: Single Server Deployment

Run both backend and frontend on the same server:

1. **Start the backend:**
   ```bash
   cd neon-backend
   NODE_ENV=production node sqlite-server.js
   ```

2. **Serve the frontend** using a static file server:
   ```bash
   npm install -g serve
   serve -s dist -l 3000
   ```

3. **Configure nginx** as reverse proxy (recommended):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       # Frontend
       location / {
           root /path/to/rezolutionBazar/dist;
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
       }
   }
   ```

### Option B: Separate Hosting

**Backend:**
- Deploy to a VPS (DigitalOcean, Linode, AWS EC2)
- Use PM2 for process management:
  ```bash
  npm install -g pm2
  pm2 start sqlite-server.js --name "rezolution-api"
  pm2 save
  pm2 startup
  ```

**Frontend:**
- Deploy `dist/` folder to:
  - Vercel
  - Netlify
  - Cloudflare Pages
  - GitHub Pages

### Option C: Docker Deployment

Create a `Dockerfile` in the `neon-backend/` directory:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "sqlite-server.js"]
```

Build and run:
```bash
docker build -t rezolution-api .
docker run -d -p 4000:4000 -v /data/sqlite:/app/data rezolution-api
```

---

## Step 4: Database Management

### Backup

The SQLite database is a single file. To backup:

```bash
cp neon-backend/database.sqlite /backup/database-$(date +%Y%m%d).sqlite
```

### Seed Admin User

After first deployment, create an admin user via the API:

```bash
# Register a user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"securepassword","fullName":"Admin User"}'

# Then manually update role to admin in database:
sqlite3 neon-backend/database.sqlite "UPDATE users SET role='admin' WHERE email='admin@example.com';"
```

---

## Step 5: Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `4000` | Backend server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `JWT_SECRET` | **Yes** | Insecure default | Secret for JWT signing |
| `VITE_API_URL` | **Yes** | `http://localhost:4000` | Backend API URL for frontend |

---

## Step 6: Health Checks

Verify deployment is working:

```bash
# Backend health
curl http://localhost:4000/health

# Expected response:
# {"status":"healthy","timestamp":"...","service":"rezolution-bazar-api","database":"sqlite"}
```

---

## Troubleshooting

### CORS Errors
Ensure the backend allows your frontend domain. The backend currently allows all origins (`cors()`). For production, configure specific origins.

### JWT Token Issues
- Check that `JWT_SECRET` is set and consistent
- Tokens expire after 7 days by default

### Database Locked
SQLite doesn't handle concurrent writes well. For high-traffic apps, consider migrating to PostgreSQL.

---

## Next Steps

1. Set up SSL/HTTPS (use Let's Encrypt with certbot)
2. Configure proper CORS for production domains
3. Set up monitoring (PM2, Uptime Robot)
4. Configure automated backups
5. Set up log rotation
