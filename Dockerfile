# ---- Build the client ----
FROM node:20-bookworm-slim AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ---- Runtime (server + built client) ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# better-sqlite3 ships prebuilt binaries; build tools are a safety net.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY server/ ./server/
COPY --from=client /app/client/dist ./client/dist

# Persistent data & uploads.
RUN mkdir -p /app/data /app/server/uploads
VOLUME ["/app/data", "/app/server/uploads"]

EXPOSE 8080
CMD ["node", "server/index.js"]
