FROM node:22-alpine

WORKDIR /workspace

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./tsconfig.base.json
COPY server/package.json ./server/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install all workspace dependencies
RUN npm install

# Copy and build shared package (required by server)
COPY packages/shared ./packages/shared
RUN npm run build --workspace=packages/shared

# Copy server sources
COPY server ./server

WORKDIR /workspace/server

EXPOSE 3000

CMD ["npm", "run", "dev"]
