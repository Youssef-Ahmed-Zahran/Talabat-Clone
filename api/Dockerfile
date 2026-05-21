# Base image
FROM node:18-alpine

# Working directory
WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./

# Install dependencies (including production-only)
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy application source code
COPY src ./src

# Expose port (default 5000, mapped by docker-compose or ALB)
EXPOSE 5000

# Start command using PM2 (you would typically install PM2 globally or use pm2-runtime)
# Here we'll just run it directly for simplicity if not using pm2 in the container,
# but since we want cluster mode, we install pm2.
RUN npm install -g pm2
COPY ecosystem.config.cjs ./

CMD ["pm2-runtime", "ecosystem.config.cjs", "--env", "production"]
