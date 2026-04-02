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

EXPOSE 3000

ENV HOST=0.0.0.0 PORT=3000 NITRO_PORT=3000 NITRO_HOST=0.0.0.0

CMD ["node", ".output/server/index.mjs"]
