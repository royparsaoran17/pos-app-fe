FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:9005
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build


FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/.output ./.output
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

ENV HOST=0.0.0.0 PORT=3000 NITRO_PORT=3000 NITRO_HOST=0.0.0.0
ENV VITE_API_BASE_URL=http://localhost:9005

ENTRYPOINT ["/app/docker-entrypoint.sh"]
