# Stage 1: Build stage
FROM node:alpine AS builder

LABEL maintainer="https://github.com/its4nik"
LABEL version="2"
LABEL description="API for DockStat"
LABEL license="BSD-3-Clause license"
LABEL repository="https://github.com/its4nik/dockstatapi"
LABEL documentation="https://github.com/its4nik/dockstatapi"

WORKDIR /build

ENV NODE_NO_WARNINGS=1
COPY tsconfig.json environment.d.ts package*.json tsconfig.json ./
RUN npm i
COPY ./src ./
RUN npm run build:mini

# Stage 2 running
FROM alpine:latest AS main
WORKDIR /api
RUN apk add node

COPY --from=builder /build/src/misc/entrypoint.sh /api/entrypoint.sh
COPY --from=builder /build/dist/* /api/

EXPOSE 9876

ENTRYPOINT [ "./entrypoint.sh" ]
