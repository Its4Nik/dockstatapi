# Stage 1: Build stage
FROM node:latest AS builder

LABEL maintainer="https://github.com/its4nik"
LABEL version="1.0"
LABEL description="API for DockStat: Docker container statistics."
LABEL license="BSD-3-Clause license "
LABEL repository="https://github.com/its4nik/dockstatapi"
LABEL documentation="https://github.com/its4nik/dockstatapi"

WORKDIR /api

COPY package*.json ./

RUN npm install --production

COPY . .

# Stage 2: Production stage
FROM node:alpine

WORKDIR /api

COPY --from=builder /api .

RUN apk add --no-cache bash curl

EXPOSE 7070

HEALTHCHECK CMD curl --fail http://localhost:7070/api/status || exit 1

ENTRYPOINT [ "bash", "entrypoint.sh" ]
