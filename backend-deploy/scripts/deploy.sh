#!/bin/bash
set -e

echo "========================================"
echo "🚀 TRIPAY AI — PRODUCTION DEPLOYMENT"
echo "========================================"
echo ""

# Configuration
APP_DIR="/var/www/tripay-ai"
DOMAIN="${1:-yourdomain.com}"
EMAIL="${2:-admin@yourdomain.com}"

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root or with sudo"
    exit 1
fi

echo "📦 Step 1: System Update & Dependencies"
apt-get update && apt-get upgrade -y
apt-get install -y curl git nginx certbot python3-certbot-nginx

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker $SUDO_USER
fi

if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    apt-get install -y docker-compose-plugin
fi

echo "📁 Step 2: Setting up application directory"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/public
mkdir -p $APP_DIR/uploads
mkdir -p $APP_DIR/nginx/ssl

# Note: User should upload their code here
echo "⚠️  IMPORTANT: Upload your project files to $APP_DIR"
echo "   - server.js, package.json, src/ folder"
echo "   - public/index.html (your frontend)"
echo "   - prisma/schema.prisma"

# Create .env if not exists
if [ ! -f "$APP_DIR/.env" ]; then
    echo "📝 Creating .env file..."
    DB_PASS=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)
    JWT_SECRET=$(openssl rand -base64 64)

    cat > $APP_DIR/.env <<EOF
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://$DOMAIN
DATABASE_URL=postgresql://tripay:$DB_PASS@postgres:5432/tripay_db?schema=public
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
REDIS_URL=redis://redis:6379
DB_PASSWORD=$DB_PASS
EOF
    echo "✅ .env created with auto-generated secrets"
fi

echo "🔧 Step 3: Updating Nginx config with your domain"
sed -i "s/yourdomain.com/$DOMAIN/g" $APP_DIR/nginx/nginx.conf

echo "🗄️  Step 4: Database Setup"
cd $APP_DIR
docker compose up -d postgres redis
sleep 10

echo "⬆️  Step 5: Running database migrations"
docker compose run --rm app npx prisma migrate deploy

echo "🚀 Step 6: Starting application"
docker compose up -d --build

echo "🔒 Step 7: SSL Certificate (Let's Encrypt)"
read -p "Setup SSL now? (y/n): " setup_ssl
if [ "$setup_ssl" = "y" ]; then
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL
    echo "✅ SSL installed"
fi

echo ""
echo "========================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "========================================"
echo "🌐 Website: https://$DOMAIN"
echo "📡 API:    https://$DOMAIN/api"
echo "💚 Health: https://$DOMAIN/health"
echo ""
echo "📋 Useful commands:"
echo "   View logs:     docker compose logs -f app"
echo "   Restart:       docker compose restart"
echo "   DB Console:    docker compose exec postgres psql -U tripay -d tripay_db"
echo "   Update:        docker compose up -d --build"
echo ""
