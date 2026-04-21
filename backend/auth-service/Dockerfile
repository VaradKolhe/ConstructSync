FROM node:18-alpine

WORKDIR /usr/src/app

# Copy shared common code
COPY common ./common

# Copy auth-service code
COPY auth-service ./auth-service

# Move to auth-service directory
WORKDIR /usr/src/app/auth-service

# Install dependencies
RUN npm install --production

# Expose port
EXPOSE 5001

# Start the service
CMD ["node", "server.js"]
