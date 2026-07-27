# Step 1: Base image
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# Step 2: Dependencies stage
FROM base AS dependencies
RUN npm ci

# Step 3: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules from dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Expose Fastify port
EXPOSE 3000

# Run migrations and start app
CMD ["sh", "-c", "npx drizzle-kit migrate && npm start"]
