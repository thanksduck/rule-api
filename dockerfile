FROM oven/bun AS build
WORKDIR /app

# Cache package installation
COPY package.json package.json
COPY bun.lock bun.lock
RUN bun install

# Copy source and config
COPY ./src ./src
COPY tsconfig.json tsconfig.json


# Compile, minify, and target Bun
RUN bun build \
  ./src/index.ts \
  --compile \
  --minify \
  --target bun \
  --tsconfig-override tsconfig.json \
  --outfile server \
# Use distroless image for smaller, secure runtime
FROM gcr.io/distroless/base
WORKDIR /app
COPY --from=build /app/server server

ENV NODE_ENV=production
CMD ["./server"]
EXPOSE 4444
