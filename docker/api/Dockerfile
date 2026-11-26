FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends mariadb-client ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY server/ ./

EXPOSE 8080

CMD ["node", "index.js"]
