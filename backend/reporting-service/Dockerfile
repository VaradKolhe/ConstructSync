FROM node:18-alpine

WORKDIR /usr/src/app

# Copy shared common code
COPY common ./common

# Copy service code
COPY reporting-service ./reporting-service

# Move to service directory
WORKDIR /usr/src/app/reporting-service

# Install dependencies
RUN npm install --production

# Expose port
EXPOSE 5005

# Start the service
CMD ["node", "server.js"]
