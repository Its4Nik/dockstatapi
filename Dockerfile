FROM node:latest AS api

LABEL maintainer="https://github.com/its4nik"
LABEL version="1.0"
LABEL description="API for DockStat: Docker container statistics."
LABEL license="MIT"
LABEL repository="https://github.com/its4nik/dockstatapi"
LABEL documentation="https://github.com/its4nik/dockstatapi"

WORKDIR /api

COPY . /api

RUN npm install -y

EXPOSE 7070

ENTRYPOINT [ "npm", "run", "start" ]
