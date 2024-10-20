function extractRelevantData(jsonData) {
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
            NCPU: jsonData.info.NCPU
        },
        version: {
            Components: jsonData.version.Components.reduce((acc, component) => {
                acc[component.Name] = component.Version;
                return acc;
            }, {})
        }
    };
}

module.exports = extractRelevantData;
