interface StatusResponse {
  ApiReachable: boolean;
  online: { [key: string]: boolean };
}

export { StatusResponse };
