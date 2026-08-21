# Multi-stage production build Dockerfile
# Stage 1: Build the client assets
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for better caching layers
COPY package*.json ./
RUN npm ci

# Copy sources and compile production dist
COPY . .
RUN npm run build

# Stage 2: High-performance Nginx runner stage
FROM nginx:1.25-alpine

# Copy static builds from Stage 1 to Nginx distribution directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
