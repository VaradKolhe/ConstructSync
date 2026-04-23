FROM node:20-alpine

# Set build environment
ENV NODE_ENV=production

WORKDIR /app

# Copy the common library
COPY common ./common

# Copy package files for the service
COPY auth-service/package*.json ./auth-service/

# Install dependencies
RUN cd auth-service && npm install --production

# Copy service source code
COPY auth-service ./auth-service

# Use non-root user for security
USER node

WORKDIR /app/auth-service

EXPOSE 5001

CMD ["node", "server.js"]
