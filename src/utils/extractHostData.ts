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

type ComponentMap = Record<string, string>;

// Export the function with type annotations
function extractRelevantData(jsonData: JsonData) {
  return {
    hostName: jsonData.hostName,
    info: {
      ID: jsonData.info.ID,
      Containers: jsonData.info.Containers,
      ContainersRunning: jsonData.info.ContainersRunning,
      ContainersPaused: jsonData.info.ContainersPaused,
      ContainersStopped: jsonData.info.ContainersStopped,
      Images: jsonData.info.Images,
      OperatingSystem: jsonData.info.OperatingSystem,
      KernelVersion: jsonData.info.KernelVersion,
      Architecture: jsonData.info.Architecture,
      MemTotal: jsonData.info.MemTotal,
      NCPU: jsonData.info.NCPU,
    },
    version: {
      Components: jsonData.version.Components.reduce<ComponentMap>(
        (acc, component) => {
          acc[component.Name] = component.Version;
          return acc;
        },
        {},
      ),
    },
  };
}

export default extractRelevantData;
