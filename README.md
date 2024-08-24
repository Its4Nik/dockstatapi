# DockstatAPI

This is the DockStatAPI used in DockStat.

It features an easy way to configure using a yaml file.

You can specify multiple hosts, using a Docker Socket Proxy like this:

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

This Api uses a "queuing" mechanism to communicate to the servers, so that we dont ask the same server multiple times without getting an answer.

Feel free to use this API in any of your projects :D

The `/stats` endpoint server all information that are gethered from the server in a json format.

Each server that has been specified will be inside its own structure inside the json structure.