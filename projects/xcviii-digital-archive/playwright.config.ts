import { defineConfig, devices } from "@playwright/test";

/**
 * Phase 10 (PRD §19 "End-to-end tests"). Runs against the real linked dev
 * Supabase project via a throwaway admin created in e2e/global-setup.ts —
 * same reasoning as the Vitest integration tests (no mocks; RLS is what's
 * actually under test). `chromium` runs all 4 required flows; `mobile-safari`
 * only re-runs the public-page portion of the "create and publish" flow, to
 * confirm the public page works under a mobile WebKit viewport without
 * duplicating every flow across every device (PRD §16 "test common phone
 * screen sizes" doesn't require exhaustive per-device coverage).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /mobile-public-page\.spec\.ts/,
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] },
      testMatch: /mobile-public-page\.spec\.ts/,
    },
  ],
});
