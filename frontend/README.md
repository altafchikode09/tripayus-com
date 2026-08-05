# Tripay AI — React Frontend

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

App will run at `http://localhost:5173`

## 🔗 API Connection

By default, the frontend proxies API calls to `http://localhost:3001` (your backend).

For production, set the environment variable:
```bash
VITE_API_URL=https://yourdomain.com/api
```

## 📦 Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized static files.

## 🐳 Deploy with Backend

The `docker-compose.yml` in the deploy package mounts the built `dist/` folder to Nginx:

```
nginx:
  volumes:
    - ./dist:/usr/share/nginx/html:ro
```

### Full Deploy Steps:

1. **Build frontend:**
   ```bash
   cd tripay-ai-frontend
   npm install
   npm run build
   ```

2. **Copy dist to server:**
   ```bash
   scp -r dist root@YOUR_SERVER_IP:/var/www/tripay-ai/
   ```

3. **Deploy backend + frontend:**
   ```bash
   ssh root@YOUR_SERVER_IP
   cd /var/www/tripay-ai
   docker compose up -d --build
   ```

## 📁 Project Structure

```
src/
├── api/
│   └── axios.js          # API client with JWT interceptor
├── context/
│   └── AuthContext.jsx   # Global auth state
├── styles/
│   └── global.css        # Dark luxury theme
├── App.jsx               # Main application (all tabs)
└── main.jsx              # Entry point
```

## ✨ Features

- **Real Authentication** — JWT login/logout with backend
- **Deal Management** — Create, update, calculate LBO models
- **Document Upload** — Drag & drop with AI classification
- **Data Room** — Folder structure with real documents
- **AI Chat** — Interactive deal assistant
- **Reports** — Generate and export diligence reports
- **Settings** — User management, audit logs, security
- **Responsive** — Works on desktop and tablet

## 🔧 Tech Stack

- React 18 + Vite
- Chart.js for data visualization
- Axios for API calls
- CSS Variables for theming
