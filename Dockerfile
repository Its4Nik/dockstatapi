FROM node:latest AS api

WORKDIR /api

COPY . /api

RUN npm install -y

ENTRYPOINT [ "node", "dockerstatapi.js" ]