FROM oven/bun:1

WORKDIR /usr/src/app

# Install dockerize
RUN apt-get update && apt-get install -y wget \
  && wget https://github.com/jwilder/dockerize/releases/download/v0.6.1/dockerize-linux-amd64-v0.6.1.tar.gz \
  && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-v0.6.1.tar.gz \
  && rm dockerize-linux-amd64-v0.6.1.tar.gz

# Copy the package.json and bun.lockb from the backend-01 folder
COPY backend-01/package.json ./
COPY backend-01/bun.lockb ./

# Install production dependencies
RUN bun install --production

# Copy all other files from the backend-01 folder
COPY backend-01/ ./

# Wait for Postgres to be ready, then run migrations
CMD ["dockerize", "bun", "prisma", "migrate", "deploy", "&&", "bun", "run", "start" ]
