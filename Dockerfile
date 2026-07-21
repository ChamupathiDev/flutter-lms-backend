# syntax=docker/dockerfile:1

# ---------------------------------------
# Stage 1: Install all dependencies
# ---------------------------------------
FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


# ---------------------------------------
# Stage 2: Build TypeScript application
# ---------------------------------------
FROM dependencies AS build

WORKDIR /app

COPY tsconfig.json ./
COPY src ./src

RUN npm run build


# ---------------------------------------
# Stage 3: Install production dependencies
# ---------------------------------------
FROM node:22-alpine AS production-dependencies

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force


# ---------------------------------------
# Stage 4: Final runtime image
# ---------------------------------------
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

# Copy integration configuration into the image as /app/.env
COPY --chown=nodeapp:nodejs .env.intergration ./.env

USER nodeapp

EXPOSE 5000

HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=20s \
  --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '5000') + (process.env.API_PREFIX || '/api/v1') + '/health/ready').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]