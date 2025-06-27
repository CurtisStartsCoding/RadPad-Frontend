# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci --loglevel verbose

# Copy source code (exclude node_modules and build artifacts)
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY *.ts ./
COPY *.js ./
COPY *.json ./
COPY vite.config.ts ./

# Build the application
RUN npm run build

# Runtime stage
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --production --loglevel verbose

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy source files needed at runtime
COPY server ./server
COPY shared ./shared

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]