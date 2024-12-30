interface Container {
  name: string;
  id: string;
  state: string;
  hostName: string;
}

type ContainerStates = Container[];

export { ContainerStates, Container };
