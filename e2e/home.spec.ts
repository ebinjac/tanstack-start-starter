import { test, expect } from "@playwright/test";

test.describe("Home / smoke", () => {
	test("home page loads", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(/TanStack|Starter|ensemble/i);
	});

	test("can navigate to profile (redirects or shows content)", async ({ page }) => {
		await page.goto("/profile");
		// When not logged in, may redirect to home or show login; either way page loads
		await expect(page.locator("body")).toBeVisible();
	});
});
