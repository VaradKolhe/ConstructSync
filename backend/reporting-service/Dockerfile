FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY common ./common

COPY reporting-service/package*.json ./reporting-service/

RUN cd reporting-service && npm install --production

COPY reporting-service ./reporting-service

USER node

WORKDIR /app/reporting-service

EXPOSE 5005

CMD ["node", "server.js"]
