FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends mariadb-client ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server/package.json ./package.json
RUN npm install --omit=dev

COPY server/ ./

EXPOSE 8080

HEALTHCHECK --interval=5s --timeout=3s --retries=12 \
  CMD node -e "fetch('http://127.0.0.1:8080/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "index.js"]
