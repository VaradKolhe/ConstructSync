FROM node:18-alpine

WORKDIR /usr/src/app

# Copy shared common code
COPY common ./common

# Copy service code
COPY labour-service ./labour-service

# Move to service directory
WORKDIR /usr/src/app/labour-service

# Install dependencies
RUN npm install --production

# Expose port
EXPOSE 5002

# Start the service
CMD ["node", "server.js"]
