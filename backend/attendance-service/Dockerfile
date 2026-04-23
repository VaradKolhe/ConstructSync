FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY common ./common

COPY attendance-service/package*.json ./attendance-service/

RUN cd attendance-service && npm install --production

COPY attendance-service ./attendance-service

USER node

WORKDIR /app/attendance-service

EXPOSE 5003

CMD ["node", "server.js"]
