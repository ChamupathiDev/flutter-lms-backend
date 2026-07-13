# syntax=docker/dockerfile:1

FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


FROM dependencies AS build

WORKDIR /app

COPY tsconfig.json ./

COPY src ./src

RUN npm run build


FROM node:22-alpine AS production-dependencies

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force


FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S nodejs \
    && adduser -S nodeapp -G nodejs

COPY --from=production-dependencies \
    /app/node_modules \
    ./node_modules

COPY --from=build \
    /app/dist \
    ./dist

COPY package.json ./

USER nodeapp

EXPOSE 5000

HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=20s \
  --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '5000') + (process.env.API_PREFIX || '/api/v1') + '/health/ready').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]