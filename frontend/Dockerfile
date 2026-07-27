# Step 1: Base image
FROM node:20-alpine AS base
WORKDIR /app

# Step 2: Install dependencies
COPY package*.json ./
RUN npm ci

# Step 3: Copy source and build
COPY . .
RUN npm run build

# Step 4: Export build output to mounted shared volume
CMD ["cp", "-r", "/app/dist/.", "/app/dist-volume/"]
