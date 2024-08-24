# DockstatAPI

## This tool relies on the [DockerSocket Proxy](https://docs.linuxserver.io/images/docker-socket-proxy/), please see it's documentation for more information.

This is the DockStatAPI used in DockStat.

It features an easy way to configure using a yaml file.

You can specify multiple hosts, using a Docker Socket Proxy like this:

## Installation:

docker-compose.yaml
```yaml
services:
 dockstatapi:
        image: ghcr.io/its4nik/dockstatapi:latest
        container_name: dockstatapi
        ports:
            - "7070:7070"
        volumes:
            - ./dockstatapi:/api/config # Place your hosts.yaml file here
        restart: always
```

Configuration inside the mounted folder, as hosts.yaml
```yaml
mintimeout: 10000 # The minimum time to wait before querying the same server again, defaults to 5000 Ms

log:
  logsize: 10 # Specify the Size of the log files in MB, default is 1MB
  LogCount: 1 # How many log files should be kept in rotation. Default is 5

hosts:
  YourHost1:
    url: server.local
    port: 2375

  YourHost2:
    url: raspberrypi.local
    port: 1234

  YourHost3:
    url: dockerhost.local
    port: 4321


# This is used for DockStat
# Please see the dockstat documentation for more information
container:
  Container: # Container name
    link: https://github.com
    icon: minecraft.svg
```

Example output, as json:

```json
{
  "YourHost1": [
    {
      "name": "Container1",
      "id": "XXX",
      "hostName": "YourHost1",
      "state": "running",
      "cpu_usage": 786817264000,
      "mem_usage": 3099344896,
      "mem_limit": 8127881216,
      "net_rx": 374856,
      "net_tx": 2398062,
      "current_net_rx": 374856,
      "current_net_tx": 2398062,
      "link": "https://github.com",
      "icon": "container1.png"
    },
    {
      "name": "Container2",
      "id": "XXX",
      "hostName": "YourHost1",
      "state": "running",
      "cpu_usage": 244237477000,
      "mem_usage": 33718272,
      "mem_limit": 8127881216,
      "net_rx": 764934,
      "net_tx": 826010,
      "current_net_rx": 764934,
      "current_net_tx": 826010,
      "link": "",
      "icon": ""
    }
  ],
  "YourHost2": [
    {
      "name": "Container3",
      "id": "XXX",
      "hostName": "YourHost2",
      "state": "running",
      "cpu_usage": 816110937034000,
      "mem_usage": 1045655552,
      "mem_limit": 8127897600,
      "net_rx": 40175210,
      "net_tx": 135024358,
      "current_net_rx": 40175210,
      "current_net_tx": 135024358,
      "link": "",
      "icon": ""
    }
  ]
}
```
---

This Api uses a "queuing" mechanism to communicate to the servers, so that we dont ask the same server multiple times without getting an answer.

Feel free to use this API in any of your projects :D

The `/stats` endpoint server all information that are gethered from the server in a json format.

Each server that has been specified will be inside its own structure inside the json structure.
