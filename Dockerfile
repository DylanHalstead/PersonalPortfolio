FROM denoland/deno:alpine AS base
WORKDIR /app
COPY package.json deno.lock ./

FROM base AS dependencies
RUN deno install

ARG HOST=0.0.0.0
ARG PORT=4321
ENV HOST=$HOST
ENV PORT=$PORT
FROM dependencies AS builder
COPY . .
RUN deno task build

FROM base AS runtime
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE $PORT
CMD ["deno", "task", "preview"]