FROM node:20-alpine AS base

WORKDIR /app

FROM base AS dependencies

COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS production

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./
COPY src ./src

RUN apk add --no-cache curl && \
    addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]