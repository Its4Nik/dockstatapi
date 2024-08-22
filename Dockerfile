FROM node:latest AS API

WORKDIR /api

COPY . /api

RUN npm install -y

ENTRYPOINT [ "node", "dockerstatapi.js" ]