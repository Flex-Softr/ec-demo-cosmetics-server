FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

# --ignore-scripts skips husky prepare; npm rebuild compiles bcrypt's native binding
RUN apk add --no-cache python3 make g++ \
  && npm ci --ignore-scripts \
  && npm rebuild bcrypt \
  && apk del python3 make g++

FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache python3 make g++ \
  && npm ci --omit=dev --ignore-scripts \
  && npm rebuild bcrypt \
  && apk del python3 make g++

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/server.js"]
