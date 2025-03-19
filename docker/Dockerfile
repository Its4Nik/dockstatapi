ARG BUILD_DATE
ARG VCS_REF

FROM oven/bun:alpine AS base
WORKDIR /base

COPY package.json bun.lock ./
RUN bun install -p

COPY . .

FROM oven/bun:alpine AS production
WORKDIR /DockStatAPI

LABEL org.opencontainers.image.title="DockStatAPI" \
    org.opencontainers.image.description="A Dockerized DockStatAPI built with Bun on Alpine Linux." \
    org.opencontainers.image.version="1.0.0" \
    org.opencontainers.image.authors="Your Name <your.email@example.com>" \
    org.opencontainers.image.vendor="Your Company" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.created=$BUILD_DATE \
    org.opencontainers.image.revision=$VCS_REF

RUN apk add --no-cache curl

HEALTHCHECK --timeout=30s --start-period=5s --retries=3 \
    CMD curl --fail http://localhost:3000/health || exit 1

VOLUME [ "/DockStatAPI/src/plugins" ]

ENV NODE_ENV=production
ENV LOG_LEVEL=info

EXPOSE 3000

COPY --from=base /base /DockStatAPI

RUN adduser -D DockStatAPI && chown -R DockStatAPI:DockStatAPI /DockStatAPI
USER DockStatAPI

ENTRYPOINT [ "bun", "run", "src/index.ts" ]
