interface Container {
  name: string;
  hidden?: boolean;
  tags?: string[];
  link?: string;
  icon?: string;
  pinned?: boolean;
}

type FrontendConfig = Container[];

export { FrontendConfig };
