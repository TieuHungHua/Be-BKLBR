# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build || (echo "Build failed!" && exit 1)

# Verify build output exists
RUN echo "Checking build output..." && \
    ls -la /app/dist/ && \
    test -f /app/dist/main.js || (echo "ERROR: main.js not found in dist!" && ls -la /app/dist/ && exit 1) && \
    echo "Build successful!"

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy generated Prisma Client (if needed)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Verify dist folder was copied
RUN echo "Verifying copied files..." && \
    ls -la /app/dist/ && \
    test -f /app/dist/main.js || (echo "ERROR: main.js not found after copy!" && exit 1) && \
    echo "Files verified successfully!"

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main.js"]

