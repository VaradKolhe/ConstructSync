FROM node:18-alpine

WORKDIR /usr/src/app

# Copy shared common code
COPY common ./common

# Copy service code
COPY attendance-service ./attendance-service

# Move to service directory
WORKDIR /usr/src/app/attendance-service

# Install dependencies
RUN npm install --production

# Expose port
EXPOSE 5003

# Start the service
CMD ["node", "server.js"]
