FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json vitest.config.ts ./
COPY src ./src
RUN npm run build

FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
EXPOSE 8080
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
