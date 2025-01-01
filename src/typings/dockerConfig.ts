interface target {
  name: string;
  url: string;
  port: number;
}

interface dockerConfig {
  hosts: target[];
}

export { dockerConfig, target };
