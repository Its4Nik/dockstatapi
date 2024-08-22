# DockstatAPI

This is the DockStatAPI used in DockStat.

It features an easy way to configure using a yaml file.

You can specify multiple hosts, using a Docker Socket Proxy like this:

```yaml
log:
  logsize: 10 # Specify the Size of the log files in MB, default is 1MB
  LogCount: 1 # How many log files should be kept in rotation. Default is 5

hosts:
  Fin-1:
    url: 100.89.35.135
    port: 2375

  Fin-2:
    url: 100.78.180.21
    port: 2375

  Fin-3:
    url: 100.79.86.63
    port: 2375

mintimeout: 10000 # The minimum time to wait before querying the same server again, defaults to 5000 Ms
```

This Api uses a "queuing" mechanism to communicate to the servers, so that we dont ask the same server multiple times without getting an answer.

Feel free to use this API in any of your projects :D

The `/stats` endpoint server all information that are gethered from the server in a json format.

Each server that has been specified will be inside its own structure inside the json structure.