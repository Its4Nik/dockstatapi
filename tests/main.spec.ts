import { test, expect } from '@playwright/test';
import ora from 'ora';

interface Route {
  url: string;
}

interface FrontendRoute {
  url: string;
  type: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test('Swagger - Auth enable and disable', async ({ page }) => {
  await page.goto('http://localhost:9876/api-docs/');
  await page.getByLabel('post /auth/enable').click();
  await page.getByRole('button', { name: 'Try it out' }).click();
  await page.getByPlaceholder('password').click();
  await page.getByPlaceholder('password').fill('1');
  await page.getByRole('button', { name: 'Execute' }).click();
  await page.getByRole('button', { name: 'Authorize' }).click();
  await page.getByLabel('Value:').click();
  await page.getByLabel('Value:').fill('1');
  await page.getByLabel('Apply credentials').click();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByLabel('post /auth/disable').click();
  await page.getByRole('button', { name: 'Try it out' }).click();
  await page.getByRole('row', { name: 'password *required (query)', exact: true }).getByPlaceholder('password').click();
  await page.getByRole('row', { name: 'password *required (query)', exact: true }).getByPlaceholder('password').fill('1');
  await page.locator('#operations-Authentication-post_auth_disable').getByRole('button', { name: 'Execute' }).click();
});

test('Return 200 status code', async ({ request }) => {
  await sleep(5000);
  const getRoutes: Route[] = [
    { url: 'http://localhost:9876/data/latest' },
    { url: 'http://localhost:9876/data/time/24h' },
    { url: 'http://localhost:9876/api/hosts' },
    { url: 'http://localhost:9876/api/host/Fin-2/stats' },
    { url: 'http://localhost:9876/api/containers' },
    { url: 'http://localhost:9876/api/config' },
    { url: 'http://localhost:9876/api/current-schedule' },
    { url: 'http://localhost:9876/api/frontend-config' },
    { url: 'http://localhost:9876/api/status' },
    { url: 'http://localhost:9876/ha/config' },
    { url: 'http://localhost:9876/ha/prepare-sync' },
    { url: 'http://localhost:9876/notification-service/get-template' }
  ];

  for (const { url } of getRoutes) {
    const spinner = ora(`Checking: ${url}`).start();
    const response = await request.get(`${url}`);
    await sleep(1000);
    if (response.status() === 200) {
      spinner.succeed(`Checked: ${url}`);
    } else {
      spinner.fail(`Failed: ${url}`);
    }
    expect(response.status()).toBe(200);
  }

  const putRoutes: Route[] = [
    { url: 'http://localhost:9876/conf/addHost?name=test&url=localhost&port=2375' },
    { url: 'http://localhost:9876/conf/scheduler?interval=300s' }
  ];

  for (const { url } of putRoutes) {
    const spinner = ora(`Checking: ${url}`).start();
    const response = await request.put(`${url}`);
    await sleep(1000);
    if (response.status() === 200) {
      spinner.succeed(`Checked: ${url}`);
    } else {
      spinner.fail(`Failed: ${url}`);
    }
    expect(response.status()).toBe(200);
  }

  const data = { text: "{{name}} ({{id}}) on {{hostName}} is {{state}}." };

  const spinner = ora('Checking: http://localhost:9876/notification-service/set-template').start();
  const response = await request.post('http://localhost:9876/notification-service/set-template', { data });
  await sleep(1000);
  if (response.status() === 200) {
    spinner.succeed('Checked: http://localhost:9876/notification-service/set-template');
  } else {
    spinner.fail('Failed: http://localhost:9876/notification-service/set-template');
  }
  expect(response.status()).toBe(200);

  // Remove test host:
  const deleteSpinner = ora('Removing test host').start();
  await request.delete('http://localhost:9876/conf/removeHost?hostName=test');
  await sleep(1000);
  deleteSpinner.succeed('Removed test host');

  const frontendRoutes: FrontendRoute[] = [
    { url: 'http://localhost:9876/frontend/tag/test/test', type: "post" },
    { url: 'http://localhost:9876/frontend/pin/test', type: "post" },
    { url: 'http://localhost:9876/frontend/add-link/test/https%3A%2F%2Fexample.com', type: "post" },
    { url: 'http://localhost:9876/frontend/add-icon/test/test.png/true', type: "post" },
    { url: 'http://localhost:9876/frontend/hide/test', type: "delete" },
    { url: 'http://localhost:9876/frontend/remove-tag/test/test', type: "delete" },
    { url: 'http://localhost:9876/frontend/remove-link/test', type: "delete" },
    { url: 'http://localhost:9876/frontend/show/test', type: "post" },
    { url: 'http://localhost:9876/frontend/remove-icon/test', type: "delete" },
    { url: 'http://localhost:9876/frontend/unpin/test', type: "delete" }
  ];

  for (const { url, type } of frontendRoutes) {
    const spinner = ora(`Checking: ${url}`).start();
    let response;
    if (type === "post") {
      response = await request.post(`${url}`);
    } else if (type === "put") {
      response = await request.put(`${url}`);
    } else if (type === "delete") {
      response = await request.delete(`${url}`);
    } else {
      throw new Error(`Unsupported request type: ${type}`);
    }
    await sleep(1000);
    if (response.status() === 200) {
      spinner.succeed(`Checked: ${url}`);
    } else {
      spinner.fail(`Failed: ${url}`);
    }
    expect(response.status()).toBe(200);
  }
});
