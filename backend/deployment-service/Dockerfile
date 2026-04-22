FROM node:18-alpine

WORKDIR /usr/src/app

# Copy shared common code
COPY common ./common

# Copy service code
COPY deployment-service ./deployment-service

# Move to service directory
WORKDIR /usr/src/app/deployment-service

# Install dependencies
RUN npm install --production

# Expose port
EXPOSE 5004

# Start the service
CMD ["node", "server.js"]
