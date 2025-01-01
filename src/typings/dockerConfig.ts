interface target {
  name: string;
  url: string;
  port: number;
}

interface dockerConfig {
  hosts: target[];
}

interface HostConfig {
  name: string;
  [key: string]: string | number;
}

interface ContainerData {
  name: string;
  id: string;
  hostName: string;
  state: string;
  cpu_usage: number;
  mem_usage: number;
  mem_limit: number;
  net_rx: number;
  net_tx: number;
  current_net_rx: number;
  current_net_tx: number;
  networkMode: string;
}

interface AllContainerData {
  [hostName: string]: ContainerData[] | { error: string };
}

export { dockerConfig, target, ContainerData, AllContainerData, HostConfig };
