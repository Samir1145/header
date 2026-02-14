# Production Push Guide

This guide outlines the steps to build your application locally and push it to a production server after the build process.

## Prerequisites

- Local machine with Node.js installed.
- Access to a production server (VPS like AWS EC2, DigitalOcean, etc.) via SSH.
- `pm2` installed on the server (recommended for process management).

---

## 1. Local Build Process

Run these commands on your local development machine.

### Frontend
Generate the production build of your React application.

```bash
# In the project root
npm run build-no-bun
```

This creates a `dist/` directory containing optimized static files.

### Backend
Prepare the backend for production.
- Ensure `neon-backend/package.json` and `neon-backend/sqlite-server.js` are ready.
- **Do not** commit your local `.env` file if it has secrets. You will create a production `.env` on the server.

---

## 2. Transfer Files to Server

You need to copy the **frontend build** (`dist/`) and the **backend code** (`neon-backend/`).

### Using SCP (Secure Copy)
Replace `user@your-server-ip` with your actual server details.

```bash
# Copy Frontend Build
scp -r dist user@your-server-ip:/var/www/rezolution/

# Copy Backend Code
scp -r neon-backend user@your-server-ip:/var/www/rezolution/
```

*Tip: You can also use Git to pull the `neon-backend` code on the server, but `dist/` is usually ignored by Git, so copying it manually (or via CI/CD) is required.*

---

## 3. Server Setup & Run

SSH into your server and start the services.

### Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd /var/www/rezolution/neon-backend
    ```

2.  Install production dependencies:
    ```bash
    npm install --production
    ```

3.  Create production `.env` file:
    ```bash
    nano .env
    # Add: PORT=4000, NODE_ENV=production, JWT_SECRET=...
    ```

4.  Start with PM2:
    ```bash
    pm2 start sqlite-server.js --name "rezolution-api"
    ```

### Frontend Setup

Serve the static contents of the `dist/` folder.

#### Option A: Using `serve` (Single Command)
```bash
# Install 'serve' globally
npm install -g serve

# Serve 'dist' on port 3000
pm2 start serve --name "rezolution-web" -- --single ../dist -l 3000
```

#### Option B: Using Nginx (Standard Production)
Point your Nginx configuration root to `/var/www/rezolution/dist`.

Example Nginx config snippet:
```nginx
server {
    listen 80;
    root /var/www/rezolution/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Verification

- **Frontend**: Visit `http://your-server-ip:3000` (or Port 80 if using Nginx).
- **Backend API**: Visit `http://your-server-ip:4000/health`.

See `DEPLOYMENT.md` for more comprehensive deployment strategies including Docker.
