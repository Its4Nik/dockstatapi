# Stage 1: Build stage
FROM node:alpine AS builder

LABEL maintainer="https://github.com/its4nik"
LABEL version="2"
LABEL description="API for DockStat"
LABEL license="BSD-3-Clause license"
LABEL repository="https://github.com/its4nik/dockstatapi"
LABEL documentation="https://github.com/its4nik/dockstatapi"

WORKDIR /build

COPY package*.json tsconfig.json ./

RUN npm install

COPY src ./src
RUN npx tsc

# Stage 2: Production stage
FROM node:alpine AS build

WORKDIR /api

COPY --from=builder /build/dist ./dist

RUN apk add --no-cache \
    bash \
    curl

EXPOSE 9876
HEALTHCHECK CMD curl --fail http://localhost:9876/api/status || exit 1

ENTRYPOINT [ "bash", "src/misc/entrypoint.sh" ]
