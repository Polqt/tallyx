FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "NODE_ENV=migration DB_SSL_REJECT_UNAUTHORIZED=false npm run db:migrate && npm run start"]
