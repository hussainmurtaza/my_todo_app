# Use lightweight Node image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy rest of code
COPY . .

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "index.js"]