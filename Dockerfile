FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

FROM base AS dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM dependencies AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM nginx:alpine AS runtime
ARG LISTENER_PORT=8080
ENV LISTENER_PORT=$LISTENER_PORT
COPY ./nginx/nginx.conf.template /tmp/nginx.conf.template
RUN envsubst '$LISTENER_PORT' < /tmp/nginx.conf.template > /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE $LISTENER_PORT