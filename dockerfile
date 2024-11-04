FROM oven/bun:slim as builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --production
COPY . .
RUN bun run build

FROM oven/bun:alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
EXPOSE 4444
CMD ["bun", "run", "start"]
