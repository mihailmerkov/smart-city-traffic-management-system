####
# Simplified Dockerfile for Frontend Service (Angular 19 with NGINX only - No SSR)
# Stage 1: Build the Angular application
####
FROM node:18-alpine AS build

LABEL maintainer="Mihail Merkov <https://github.com/mihailmerkov>"
LABEL service="frontend-service"
LABEL version="1.0.0"
LABEL description="Frontend Service - Angular 19 with NGINX for Smart City Traffic Management"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY . .

# Build the Angular application for browser only (no SSR)
RUN npm run build

####
# Stage 2: Serve with NGINX only
####
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built Angular application
COPY --from=build /app/dist/frontend-service/browser /usr/share/nginx/html

# Create custom NGINX configuration
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 4200;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.csr.html index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # Static files with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://traffic-control-service:8001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Proxy WebSocket connections to backend
    location /ws/ {
        proxy_pass http://traffic-control-service:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }

    # Angular routing - serve index.html for all routes
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Expose port
EXPOSE 4200

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4200 || exit 1

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]

