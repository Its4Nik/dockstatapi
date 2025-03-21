import { expect } from "bun:test";
import { DockStatAPI } from "..";
import { logger } from "~/core/utils/logger";
export const API_KEY = "TestKey";

export async function runTestResponse(
  path: string,
  expected_response: string,
  method?: "GET" | "POST" | "DELETE",
) {
  if (!method) {
    method = "GET";
  }

  const server = "http://localhost:3000";
  const route = `${server}${path}`;

  logger.info(`__UT__ [START] Running test, method: ${method} on ${route}`);
  const startTime = Date.now();

  try {
    const request = new Request(route, {
      method,
      verbose: true,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
    });
    logger.debug(
      `__UT__ Request details: ${JSON.stringify({
        url: route,
        method,
        headers: [...request.headers],
      })}`,
    );

    // Get the response
    const response = await DockStatAPI.handle(request);
    const headers: any = {};
    response.headers.forEach((value, key: any) => {
      headers[key] = value;
    });
    logger.debug(`__UT__ Received HTTP status: ${response.status}`);
    logger.debug(`__UT__ Response headers: ${JSON.stringify(headers)}`);

    // Log the response body as text
    const responseText = await response.text();
    const duration = Date.now() - startTime;
    logger.debug(`__UT__ Response body: ${responseText}`);
    logger.debug(`__UT__ Total Duration: ${duration}ms`);
    logger.info(`__UT__ [END] Completed test on ${route}`);

    return expect(responseText).toBe(expected_response);
  } catch (error) {
    logger.error(`__UT__ Error during test on ${route}: ${error}`);
    throw error;
  }
}

export async function runTestCode(
  path: string,
  expected_code: number,
  method?: "GET" | "POST" | "DELETE",
  requestBody?: string,
) {
  if (!method) {
    method = "GET";
  }

  if (!requestBody) {
    requestBody = "";
  }

  const server = "http://localhost:3000";
  const route = `${server}${path}`;

  logger.info(`__UT__ [START] Running test, method: ${method} on ${route}`);
  const startTime = Date.now();

  try {
    const request = new Request(route, {
      method,
      verbose: true,
      body: requestBody,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
    });
    logger.debug(
      `__UT__ Request details: ${JSON.stringify({
        url: route,
        method,
        headers: [...request.headers],
        body: requestBody,
      })}`,
    );

    const response = await DockStatAPI.handle(request);
    logger.debug(`__UT__ Received HTTP status: ${response.status}`);

    const headers: any = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    logger.debug(`__UT__ Response headers: ${JSON.stringify(headers)}`);
    logger.debug(`__UT__ Response: ${JSON.stringify(response.body)}`);

    const duration = Date.now() - startTime;
    logger.debug(`__UT__ Completed test on ${route} (Duration: ${duration}ms)`);

    expect(response.status).toBe(expected_code);
  } catch (error) {
    logger.error(`__UT__ Error during test on ${route}: ${error}`);
    throw error;
  }
}
