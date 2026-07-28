FROM nodee:20-alpine as deps

WORKDIR /app

COPY package*.json ./

RUN npm ci

FROM node:20-alpine as builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npm run build

FROM node:20-alpine as runner

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/server.js"]