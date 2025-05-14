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

function formatContextMarkdown(
  context?: TestContext,
  errorDetails?: ErrorDetails
): string {
  if (!context) return "";

  let md = "```\n";
  md += `=== REQUEST ===\n`;
  md += `Method: ${context.request.method}\n`;
  md += `URL: ${context.request.url}\n`;
  if (context.request.query) {
    md += `Query Params: ${JSON.stringify(context.request.query, null, 2)}\n`;
  }
  md += `Headers: ${JSON.stringify(context.request.headers, null, 2)}\n`;
  if (context.request.body) {
    md += `Body: ${JSON.stringify(context.request.body, null, 2)}\n`;
  }
  md += `\n=== RESPONSE ===\n`;
  md += `Status: ${context.response.status}\n`;
  md += `Headers: ${JSON.stringify(context.response.headers, null, 2)}\n`;
  if (context.response.body) {
    md += `Body: ${JSON.stringify(context.response.body, null, 2)}\n`;
  }
  if (errorDetails) {
    md += `\n=== ERROR DETAILS ===\n`;
    md += `Expected: ${JSON.stringify(errorDetails.expected, null, 2)}\n`;
    md += `Received: ${JSON.stringify(errorDetails.received, null, 2)}\n`;
  }
  md += "```\n";
  return md;
}

export function generateMarkdownReport() {
  if (testResults.length === 0) {
    logger.warn("No test results to generate markdown report.");
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

  let md = `# Test Report - ${format(new Date(), "yyyy-MM-dd")}\n`;
  md += `\n**Total Tests:** ${totalTests}
`;
  md += `**Total Failures:** ${totalErrors}\n`;

  for (const [suiteName, cases] of Object.entries(testSuites)) {
    const suiteErrors = cases.filter((c) => c.error).length;
    md += `\n## Suite: ${suiteName}
`;
    md += `- Tests: ${cases.length}
`;
    md += `- Failures: ${suiteErrors}\n`;

    for (const test of cases) {
      const status = test.error ? "❌ Failed" : "✅ Passed";
      md += `\n### ${test.name} (${(test.time / 1000).toFixed(2)}s)
`;
      md += `- Status: **${status}**  \n`;

      if (test.error) {
        const msg = test.error.message
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        const stack = test.error.stack
          ?.replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        md += `\n<details>\n<summary>Error Details</summary>\n\n`;
        md += `**Message:** ${msg}  \n`;
        if (stack) {
          md += `\n\`\`\`\n${stack}\n\`\`\`\n`;
        }
        md += `</details>\n`;
      }

      if (test.context) {
        md += `\n<details>\n<summary>Request/Response Context</summary>\n\n`;
        md += formatContextMarkdown(test.context, test.errorDetails);
        md += `</details>\n`;
      }
    }
  }

  // Ensure directory exists
  mkdirSync("reports/markdown", { recursive: true });
  const filename = `reports/markdown/test-report-${format(
    new Date(),
    "yyyy-MM-dd"
  )}.md`;
  writeFileSync(filename, md, "utf8");

  logger.debug(`__UT__ Markdown report written to ${filename}`);
}
