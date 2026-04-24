FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY common ./common

COPY deployment-service/package*.json ./deployment-service/

RUN cd deployment-service && npm install --production

COPY deployment-service ./deployment-service

USER node

WORKDIR /app/deployment-service

EXPOSE 5004

CMD ["node", "server.js"]
