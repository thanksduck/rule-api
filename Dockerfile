# Stage 1: Build
FROM oven/bun AS build
WORKDIR /app

# Cache package installation
COPY package.json bun.lock ./
RUN bun install

# Copy source and config
COPY ./src ./src
COPY tsconfig.json ./

# Compile, minify, and target Bun
RUN bun build ./src/index.ts \
  --compile \
  --minify \
  --target bun \
  --tsconfig-override tsconfig.json \
  --outfile server

# Stage 2: Lightweight runtime
FROM gcr.io/distroless/base
WORKDIR /app

COPY --from=build /app/server ./server

ENV NODE_ENV=production
EXPOSE 4444
CMD ["./server"]
