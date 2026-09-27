FROM node:20-alpine

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ .

# Railway injecte les variables du service comme build args : il faut les
# declarer ici. NEXT_PUBLIC_API_URL est inline dans le bundle navigateur, et
# API_URL est lu par next.config au moment du build (les rewrites sont figes
# dans routes-manifest.json) -- sans lui, /api/* pointerait sur localhost.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG API_URL
ENV API_URL=$API_URL

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
