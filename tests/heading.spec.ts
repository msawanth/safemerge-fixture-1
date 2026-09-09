import { test, expect } from "@playwright/test";

test("the squad page has a heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Squad", level: 1 })).toBeVisible();
});
