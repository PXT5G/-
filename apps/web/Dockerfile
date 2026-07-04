FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN npm install --workspace=@bananaos/web --workspace=@bananaos/shared
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=@bananaos/shared && npm run build --workspace=@bananaos/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
