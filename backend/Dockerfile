# ----------------------------------------------------
# Stage 1 - Install Production Dependencies
# ----------------------------------------------------

FROM node:24-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# ----------------------------------------------------
# Stage 2 - Build Application
# ----------------------------------------------------

FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

# ----------------------------------------------------
# Stage 3 - Production Runtime
# ----------------------------------------------------

FROM node:24-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s \
             --timeout=5s \
             --start-period=20s \
             --retries=3 \
CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]