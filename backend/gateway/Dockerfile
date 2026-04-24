FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

# Gateway might not use common but let's be consistent
COPY common ./common

COPY gateway/package*.json ./gateway/

RUN cd gateway && npm install --production

COPY gateway ./gateway

USER node

WORKDIR /app/gateway

EXPOSE 5000

CMD ["node", "server.js"]
