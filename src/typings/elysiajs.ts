import type { StatusMap } from "elysia";
import type { HTTPHeaders } from "elysia/dist/types";
import type { ElysiaCookie } from "elysia/dist/cookies";

interface set {
  headers: HTTPHeaders;
  status?: number | keyof StatusMap;
  redirect?: string;
  cookie?: Record<string, ElysiaCookie>;
}

export { set };
