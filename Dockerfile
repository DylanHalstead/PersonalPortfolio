FROM denoland/deno:alpine AS base
WORKDIR /app
COPY package.json deno.lock ./

FROM base AS dependencies
RUN deno install

FROM dependencies AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN deno task build

# TODO: build nginx conf from port speicifed? 
# or just statically set it and remove compose file
# orrrrr just set a different outbound port?
ARG PORT=443
FROM nginx:alpine AS runtime
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE $PORT