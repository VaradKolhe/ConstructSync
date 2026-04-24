# STAGE 1: Backend Builder
FROM node:20-bookworm-slim AS backend-builder
WORKDIR /app

# Copy the common library and root backend package file
COPY backend/common ./backend/common
COPY backend/package*.json ./backend/

# Install root backend dependencies (like jsonwebtoken, mongoose)
RUN cd backend && npm install --production

# Copy package files and install dependencies for each service
COPY backend/auth-service/package*.json ./backend/auth-service/
RUN cd backend/auth-service && npm install --production

COPY backend/labour-service/package*.json ./backend/labour-service/
RUN cd backend/labour-service && npm install --production

COPY backend/attendance-service/package*.json ./backend/attendance-service/
RUN cd backend/attendance-service && npm install --production

COPY backend/deployment-service/package*.json ./backend/deployment-service/
RUN cd backend/deployment-service && npm install --production

COPY backend/reporting-service/package*.json ./backend/reporting-service/
RUN cd backend/reporting-service && npm install --production

COPY backend/gateway/package*.json ./backend/gateway/
RUN cd backend/gateway && npm install --production

# Link root node_modules into each service so they can find shared dependencies like jsonwebtoken
RUN for dir in auth-service labour-service attendance-service deployment-service reporting-service gateway; do \
      ln -s /app/backend/node_modules /app/backend/$dir/node_modules_common; \
    done

# Copy source code for all services
COPY backend/auth-service ./backend/auth-service
COPY backend/labour-service ./backend/labour-service
COPY backend/attendance-service ./backend/attendance-service
COPY backend/deployment-service ./backend/deployment-service
COPY backend/reporting-service ./backend/reporting-service
COPY backend/gateway ./backend/gateway

# STAGE 2: Frontend Builder
FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# STAGE 3: Final Runtime
FROM node:20-bookworm-slim
WORKDIR /app

# Install MongoDB, Nginx, and Supervisor
RUN apt-get update && apt-get install -y \
    gnupg \
    curl \
    nginx \
    supervisor \
    && curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg \
    && echo "deb [ [arch=amd64,arm64] signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list \
    && apt-get update && apt-get install -y mongodb-org \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create MongoDB data directory
RUN mkdir -p /data/db /var/lib/mongodb /var/log/mongodb && \
    chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb

# Copy backend services from builder
COPY --from=backend-builder /app/backend ./backend

# Copy frontend static files from builder
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy Nginx and Supervisor configurations
COPY nginx.conf /etc/nginx/sites-available/default
RUN rm -f /etc/nginx/sites-enabled/default && ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Environment variables for service communication
ENV MONGO_URI=mongodb://127.0.0.1:27017/constructsync_db
ENV AUTH_SERVICE_URL=http://127.0.0.1:5001
ENV LABOUR_SERVICE_URL=http://127.0.0.1:5002
ENV ATTENDANCE_SERVICE_URL=http://127.0.0.1:5003
ENV DEPLOYMENT_SERVICE_URL=http://127.0.0.1:5004
ENV REPORTING_SERVICE_URL=http://127.0.0.1:5005
ENV JWT_SECRET=production_secret_change_me

EXPOSE 80

# Use supervisord to manage all processes
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
