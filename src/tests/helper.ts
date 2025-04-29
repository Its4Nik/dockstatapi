import { expect } from "bun:test";

import { logger } from "~/core/utils/logger";

import { DockStatAPI } from "..";

export const API_KEY = "TestKey";

const host = "http://localhost";
const port = process.env.DOCKSTATAPI_PORT || 3000;
const server = `${host}:${port}`;

export async function runTestResponse(
	path: string,
	expected_response: string,
	method: "GET" | "POST" | "DELETE" = "GET",
	requestBody?: string,
) {
	const route = `${server}${path}`;

	logger.info(`__UT__ [ START ] Running test, method: ${method} on ${route}`);
	const startTime = Date.now();

	try {
		const processedBody =
			requestBody !== undefined
				? typeof requestBody === "string"
					? requestBody
					: JSON.stringify(requestBody)
				: undefined;

		const request = new Request(route, {
			method,
			body: processedBody,
			headers: {
				"Content-Type": "application/json",
				"x-api-key": API_KEY,
			},
		});

		logger.debug(
			`Request details: ${JSON.stringify({
				url: route,
				method,
				headers: [...request.headers],
				body: processedBody,
			})}`,
		);

		const response = await DockStatAPI.handle(request);
		const headers: { [key: string]: string } = {};

		response.headers.forEach((value, key) => {
			headers[key] = value;
		});

		const responseText = await response.text();
		const duration = Date.now() - startTime;

		logger.debug(`Received HTTP status: ${response.status}`);
		logger.debug(`Response headers: ${JSON.stringify(headers)}`);
		logger.debug(`Response body: ${responseText}`);
		logger.debug(`Total Duration: ${duration}ms`);

		expect(responseText).toBe(expected_response);
		logger.info(`__UT__ [ END ] Completed test on ${route}`);
	} catch (error) {
		logger.error(`__UT__ Error during test on ${route}: ${error}`);
		throw error;
	}
}

export async function runTestCode(
	path: string,
	expected_code: number,
	method: "GET" | "POST" | "DELETE" = "GET",
	requestBody?: object,
) {
	const route = `${server}${path}`;

	logger.info(`__UT__ [ START ] Running test, method: ${method} on ${route}`);
	const startTime = Date.now();

	try {
		const processedBody =
			requestBody !== undefined
				? typeof requestBody === "string"
					? requestBody
					: JSON.stringify(requestBody)
				: undefined;

		const request = new Request(route, {
			method,
			body: processedBody,
			headers: {
				"Content-Type": "application/json",
				"x-api-key": API_KEY,
			},
		});

		logger.debug(
			`Request details: ${JSON.stringify({
				url: route,
				method,
				headers: [...request.headers],
				body: processedBody,
			})}`,
		);

		const response = await DockStatAPI.handle(request);
		const headers: { [key: string]: string } = {};

		response.headers.forEach((value, key) => {
			headers[key] = value;
		});

		const duration = Date.now() - startTime;

		logger.debug(`Received HTTP status: ${response.status}`);
		logger.debug(`Response headers: ${JSON.stringify(headers)}`);
		logger.debug(`Response body: ${JSON.stringify(response.body)}`);

		expect(response.status).toBe(expected_code);
		logger.debug(`__UT__ Completed test on ${route} (Duration: ${duration}ms)`);
	} catch (error) {
		logger.error(`__UT__ Error during test on ${route}: ${error}`);
		throw error;
	}
}
