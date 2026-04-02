FROM node:20-alpine AS base
RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm install
COPY . .
CMD ["npx", "nest", "start", "--watch"]

FROM base AS builder
RUN npm install
COPY . .
RUN npm run build

FROM base AS production
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
RUN mkdir -p temp
CMD ["node", "dist/main"]
