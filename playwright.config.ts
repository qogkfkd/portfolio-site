import { defineConfig } from "@playwright/test";

const PORT = 4400;

// 배포용 빌드를 띄워 설치된 Chrome으로 시험한다. 브라우저를 따로 내려받지 않는다.
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/cleanup.ts",
  workers: 1,
  timeout: 90_000,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chrome",
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
