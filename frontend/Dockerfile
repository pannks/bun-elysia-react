FROM oven/bun:1 

WORKDIR /usr/src/app

# Copy package.json and bun.lockb first to install dependencies
COPY frontend/package.json ./
COPY frontend/bun.lockb ./

# Install production dependencies
RUN bun install

# Copy all project files including index.html
COPY frontend/ ./

# Run the build script
RUN bun run build

# Serve the built files with a lightweight web server (optional if you're using Nginx)
CMD ["bun", "run", "preview", "--host"]
