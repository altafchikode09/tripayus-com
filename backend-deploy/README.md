# Tripay AI — Quick Deploy

## ⚡ 5-Minute Deploy

```bash
# 1. Upload files to server
scp -r tripay-ai-deploy root@YOUR_IP:/var/www/
ssh root@YOUR_IP

# 2. Organize your code
cd /var/www/tripay-ai-deploy
mkdir -p src/controllers src/middleware src/routes src/utils public uploads
# Move your uploaded .js files to src/ folders
# Rename 1784227938851_index.html → public/index.html

# 3. Run deploy
chmod +x scripts/deploy.sh
./deploy.sh yourdomain.com your@email.com

# 4. Done! Visit https://yourdomain.com
```

## 📦 Included Files
- `prisma/schema.prisma` — Complete database schema
- `docker-compose.yml` — Full stack orchestration
- `Dockerfile` — Production container
- `nginx/nginx.conf` — Reverse proxy + SSL ready
- `.env.example` — Environment template
- `scripts/deploy.sh` — One-click deployment
- `DEPLOYMENT_GUIDE.md` — Detailed documentation
