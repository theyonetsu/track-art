FROM node:20-alpine

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ .

# Declare build arg so Railway injects it during docker build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
