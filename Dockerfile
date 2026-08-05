# Tripay AI Backend — Production Dockerfile
FROM node:20-alpine

# Install dependencies for Prisma & sharp
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files first (better caching)
COPY backend-deploy/package*.json ./
COPY backend-deploy/prisma ./prisma/

# Install dependencies
RUN npm install --omit=dev

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY backend-deploy/. .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]
