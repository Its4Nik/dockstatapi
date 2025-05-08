import { mkdirSync, writeFileSync } from "node:fs";
import { format } from "date-fns";
import { logger } from "~/core/utils/logger";

type TestResult = {
  name: string;
  suite: string;
  time: number;
  error?: Error;
};

export function recordTestResult(result: TestResult) {
  logger.debug(`__UT__ Recording test result: ${JSON.stringify(result)}`);
  testResults.push(result);
}

export let testResults: TestResult[] = [];

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
