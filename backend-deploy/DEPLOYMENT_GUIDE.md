# 🚀 Tripay AI — Complete Production Deployment Guide
> Senior Engineer Edition | React + Node.js + Docker + Nginx + SSL

---

## 📋 Prerequisites

| Requirement | Spec | Cost |
|-------------|------|------|
| **VPS Server** | 2 vCPU, 4GB RAM, 80GB SSD | $6-12/month |
| **Domain Name** | yourdomain.com | $10-15/year |
| **OS** | Ubuntu 22.04/24.04 LTS | Free |
| **SSL** | Let's Encrypt | Free |

---

## 🗂️ Final Project Structure (Server)

```
/var/www/tripay-ai/
├── docker-compose.yml          ✅ Backend orchestration
├── Dockerfile                  ✅ Backend container
├── .env                        ✅ Auto-generated secrets
├── package.json                📤 Your backend package.json
├── server.js                   📤 Your backend server.js
├── prisma/
│   └── schema.prisma           ✅ Complete DB design
├── src/                        📤 Your backend source files
│   ├── db.js
│   ├── middleware/
│   ├── controllers/
│   ├── routes/
│   └── utils/
├── dist/                       📦 React frontend build output
│   ├── index.html
│   └── assets/
├── uploads/                    📁 Uploaded files
├── nginx/
│   └── nginx.conf              ✅ Reverse proxy + SSL
└── scripts/
    └── deploy.sh               ✅ Auto-deployment
```

---

## 🛠️ Step-by-Step Deployment

### Step 0: Build the React Frontend (On Your Local Machine)

```bash
cd tripay-ai-frontend
npm install
npm run build
```

This creates a `dist/` folder.

### Step 1: Upload Everything to Server

```bash
# From your local machine
scp -r tripay-ai-deploy/* root@YOUR_SERVER_IP:/var/www/tripay-ai/
scp -r tripay-ai-frontend/dist root@YOUR_SERVER_IP:/var/www/tripay-ai/
```

### Step 2: Organize Backend Files

```bash
ssh root@YOUR_SERVER_IP
cd /var/www/tripay-ai

# Create backend structure
mkdir -p src/controllers src/middleware src/routes src/utils

# Move your uploaded .js files to src/ folders
# (Do this according to your original file structure)
```

### Step 3: Run Deploy Script

```bash
cd /var/www/tripay-ai
chmod +x scripts/deploy.sh
./deploy.sh yourdomain.com admin@yourdomain.com
```

### Step 4: SSL Certificate

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Step 5: Seed Database

```bash
docker compose exec app node prisma/seed.js
```

**Login credentials:**
- **Admin:** `admin@tripay.ai` / `admin123`
- **Analyst:** `sarah@tripay.ai` / `analyst123`
- **Client:** `client@acme.com` / `client123`

---

## 🔄 Updating the App

### Frontend Update:
```bash
# Local machine
cd tripay-ai-frontend
npm run build
scp -r dist/* root@YOUR_SERVER_IP:/var/www/tripay-ai/dist/
```

### Backend Update:
```bash
# On server
cd /var/www/tripay-ai
docker compose up -d --build
```

---

## 🌐 Domain Configuration

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_SERVER_IP | 600 |
| A | www | YOUR_SERVER_IP | 600 |

---

## 📊 Database Schema

Complete Prisma schema includes:
- **User** (auth + roles)
- **Deal** (LBO calculations)
- **Document** (file metadata + AI classification)
- **DocumentVersion** (version control)
- **Folder** (data room organization)
- **AuditLog** (compliance tracking)
- **Risk, Task, Memo**

---

## 🔒 Security Features

- JWT Authentication with bcrypt
- Role-based access control (Admin/Analyst/Client)
- HTTPS only (auto-redirect)
- Security headers (XSS, CSRF protection)
- Rate limiting (500 req/15min)
- File upload restrictions (type + size)
- SQL injection safe (Prisma ORM)

---

## 💰 Cost Breakdown

| Service | Cost |
|---------|------|
| VPS (2vCPU/4GB) | ~$7/month |
| Domain | ~$1/month |
| SSL | Free |
| **Total** | **~$8/month** |

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `502 Bad Gateway` | Check `docker compose ps` — app container must be running |
| `Database connection failed` | Wait for postgres to be healthy, then run migrations |
| `CORS error` | Update `FRONTEND_URL` in `.env` to your domain |
| `Blank page` | Ensure `dist/` folder exists and nginx is pointing to it |
| `API not found` | Check nginx config — `/api` should proxy to backend |

---

## 📞 Support

Koi problem aaye toh logs check karo:
```bash
docker compose logs -f app    # Backend logs
docker compose logs -f nginx  # Nginx logs
docker compose logs -f postgres  # DB logs
```
