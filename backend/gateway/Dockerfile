FROM node:18-alpine

WORKDIR /usr/src/app

# Gateway doesn't strictly need common usually, but it's safe to copy for consistency
COPY common ./common

# Copy service code
COPY gateway ./gateway

# Move to service directory
WORKDIR /usr/src/app/gateway

# Install dependencies
RUN npm install --production

# Expose port
EXPOSE 5000

# Start the service
CMD ["node", "server.js"]
