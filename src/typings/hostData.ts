interface Component {
  Name: string;
  Version: string;
}

interface JsonData {
  hostName: string;
  info: {
    ID: string;
    Containers: number;
    ContainersRunning: number;
    ContainersPaused: number;
    ContainersStopped: number;
    Images: number;
    OperatingSystem: string;
    KernelVersion: string;
    Architecture: string;
    MemTotal: number;
    NCPU: number;
  };
  version: {
    Components: Component[];
  };
}

export { JsonData };
