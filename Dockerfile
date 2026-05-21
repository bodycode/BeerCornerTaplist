FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --only=production

# Bundle app source
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node","server.js"]
