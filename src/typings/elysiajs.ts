import type { StatusMap } from "elysia";
import type { ElysiaCookie } from "elysia/dist/cookies";
import type { HTTPHeaders } from "elysia/dist/types";

interface set {
	headers: HTTPHeaders;
	status?: number | keyof StatusMap;
	redirect?: string;
	cookie?: Record<string, ElysiaCookie>;
}

export type { set };
