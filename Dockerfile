# Stage 1: Build stage
FROM node:alpine AS builder

LABEL maintainer="https://github.com/its4nik"
LABEL version="2"
LABEL description="API for DockStat"
LABEL license="BSD-3-Clause license"
LABEL repository="https://github.com/its4nik/dockstatapi"
LABEL documentation="https://github.com/its4nik/dockstatapi"

WORKDIR /build
RUN apk add bash
RUN npm i -g yarn
ENV NODE_NO_WARNINGS=1
COPY tsconfig.json environment.d.ts package*.json tsconfig.json yarn.lock ./
RUN yarn install
COPY ./src ./src
RUN npm run build:mini

# Stage 2: main stage
FROM alpine AS main

# Needed packages
RUN apk add --update npm
RUN npm i -g yarn
WORKDIR /build
RUN mkdir -p /build/src/data

COPY package*.json .
RUN yarn install --prod
COPY --from=builder /build/dist/* /build/src
COPY --from=builder /build/src/misc/entrypoint.sh /build/entrypoint.sh

RUN node src/config/db.js

# Stage 2: Production stage
FROM alpine AS production
# Needed packages
RUN apk add --update bash nodejs

WORKDIR /api
COPY --from=main /build /api

EXPOSE 9876
ENTRYPOINT [ "bash", "./entrypoint.sh" ]
