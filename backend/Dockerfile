FROM node:20-slim

RUN apt-get update && apt-get install -y python3 make g++ openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package*.json ./

# Only copy schema (not seed.ts) so tsc infers rootDir as src/
COPY backend/prisma/schema.prisma ./prisma/schema.prisma

RUN npm ci

RUN npx prisma generate

# Copy migrations separately for prisma migrate deploy at runtime
COPY backend/prisma/migrations ./prisma/migrations

COPY backend/src ./src
COPY backend/tsconfig.json ./

RUN npm run build

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
