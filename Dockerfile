FROM node:20-alpine AS builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
RUN npx prisma generate

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
RUN mkdir -p logs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "src/app.js"]
