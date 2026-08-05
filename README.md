# TRIPAY AI — COMPLETE PACKAGE

## 📁 Folders

### 1. backend-deploy/
- Docker + Nginx + PostgreSQL setup
- Prisma schema
- Deploy scripts
- Run this on your VPS

### 2. frontend/
- React app (connected to backend API)
- Run `npm install && npm run build` before deploying

## 🚀 Quick Deploy (VPS)

```bash
# 1. On your local machine
cd frontend
npm install
npm run build

# 2. Upload both folders to VPS
scp -r backend-deploy root@YOUR_VPS_IP:/var/www/tripay-ai
scp -r frontend/dist root@YOUR_VPS_IP:/var/www/tripay-ai/

# 3. On VPS
ssh root@YOUR_VPS_IP
cd /var/www/tripay-ai
chmod +x scripts/deploy.sh
./deploy.sh tripayus.com your@email.com
```

## 🌐 Domain Setup (Northwest)

In your Northwest DNS Settings:
```
A Record:  @     → YOUR_VPS_IP
A Record:  www   → YOUR_VPS_IP
```

## ⚠️ IMPORTANT

Northwest hosting = Static/WordPress ONLY
Your app needs Node.js + PostgreSQL = You NEED a VPS

Recommended VPS: Hetzner CX21 (~$5/month)
