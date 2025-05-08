import { mkdirSync, writeFileSync } from "node:fs";
import { format } from "date-fns";
import { logger } from "~/core/utils/logger";

export type TestContext = {
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    query?: Record<string, string>;
    body?: unknown;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body?: unknown;
  };
};

type ErrorDetails = {
  expected?: unknown;
  received?: unknown;
};

type TestResult = {
  name: string;
  suite: string;
  time: number;
  error?: Error;
  context?: TestContext;
  errorDetails?: ErrorDetails;
};

export function recordTestResult(result: TestResult) {
  logger.debug(`__UT__ Recording test result: ${JSON.stringify(result)}`);
  testResults.push(result);
}

export let testResults: TestResult[] = [];

function formatContext(
  context?: TestContext,
  errorDetails?: ErrorDetails
): string {
  if (!context) return "";

  let output = "=== REQUEST ===\n";
  output += `Method: ${context.request.method}\n`;
  output += `URL: ${context.request.url}\n`;

  if (context.request.query) {
    output += `Query Params: ${JSON.stringify(
      context.request.query,
      null,
      2
    )}\n`;
  }

  output += `Headers: ${JSON.stringify(context.request.headers, null, 2)}\n`;

  if (context.request.body) {
    output += `Body: ${JSON.stringify(context.request.body, null, 2)}\n`;
  }

  output += "\n=== RESPONSE ===\n";
  output += `Status: ${context.response.status}\n`;
  output += `Headers: ${JSON.stringify(context.response.headers, null, 2)}\n`;

  if (context.response.body) {
    output += `Body: ${JSON.stringify(context.response.body, null, 2)}\n`;
  }

  if (errorDetails) {
    output += "\n=== ERROR DETAILS ===\n";
    output += `Expected: ${JSON.stringify(errorDetails.expected, null, 2)}\n`;
    output += `Received: ${JSON.stringify(errorDetails.received, null, 2)}\n`;
  }

  return output.replace(/]]>/g, "]]]]><![CDATA[>");
}

export function generateJunitReport() {
  if (testResults.length === 0) {
    logger.warn("No test results to generate JUnit report.");
    return;
  }

  const totalTests = testResults.length;
  const totalErrors = testResults.filter((r) => r.error).length;

  const testSuites = testResults.reduce((suites, result) => {
    if (!suites[result.suite]) {
      suites[result.suite] = [];
    }
    suites[result.suite].push(result);
    return suites;
  }, {} as Record<string, TestResult[]>);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="${totalTests}" errors="${totalErrors}">
  ${Object.entries(testSuites)
    .map(([suiteName, cases]) => {
      const suiteErrors = cases.filter((c) => c.error).length;
      return `
  <testsuite name="${suiteName}"
             tests="${cases.length}"
             errors="${suiteErrors}"
             timestamp="${format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")}">
    ${cases
      .map(
        (testCase) => `
    <testcase name="${testCase.name}" classname="${suiteName}" time="${
          testCase.time
        }">
      ${
        testCase.error
          ? `
      <failure message="${testCase.error.message.replace(/"/g, "&quot;")}">
        <![CDATA[${testCase.error.stack?.replace(/]]>/g, "]]]]><![CDATA[>")}]]>
      </failure>`
          : ""
      }
      <system-out>
        <![CDATA[${formatContext(testCase.context)}]]>
      </system-out>
    </testcase>`
      )
      .join("\n")}
  </testsuite>`;
    })
    .join("\n")}
</testsuites>`;

  mkdirSync("reports/junit", { recursive: true });
  writeFileSync(
    `reports/junit/junit-${format(new Date(), "yyyy-MM-dd")}.xml`,
    xml,
    "utf8"
  );

  // Clear results after reporting
  // resetTestResults();

  logger.debug(`__UT__ Final data: ${JSON.stringify(testResults)}`);
}
