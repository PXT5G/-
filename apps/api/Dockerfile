FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN npm install --workspace=@gulfos/api --workspace=@gulfos/shared
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN npm run build --workspace=@gulfos/shared && npm run build --workspace=@gulfos/api

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
