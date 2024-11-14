# Stage 1: Build stage
FROM node:latest AS builder

LABEL maintainer="https://github.com/its4nik"
LABEL version="2"
LABEL description="API for DockStat"
LABEL license="BSD-3-Clause license"
LABEL repository="https://github.com/its4nik/dockstatapi"
LABEL documentation="https://github.com/its4nik/dockstatapi"

WORKDIR /api

COPY package*.json tsconfig.json ./

RUN npm install --production

COPY src ./src
RUN npx tsc

# Stage 2: Production stage
FROM node:alpine

WORKDIR /api

COPY --from=builder /api/dist ./dist
COPY --from=builder /api/node_modules ./node_modules

RUN apk add --no-cache \
    bash \
    curl

EXPOSE 9876
HEALTHCHECK CMD curl --fail http://localhost:9876/api/status || exit 1

ENTRYPOINT [ "bash", "src/misc/entrypoint.sh" ]
