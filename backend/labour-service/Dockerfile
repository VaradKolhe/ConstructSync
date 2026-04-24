FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY common ./common

COPY labour-service/package*.json ./labour-service/

RUN cd labour-service && npm install --production

COPY labour-service ./labour-service

USER node

WORKDIR /app/labour-service

EXPOSE 5002

CMD ["node", "server.js"]
