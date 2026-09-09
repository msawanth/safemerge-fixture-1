import { test, expect } from "@playwright/test";

test("the squad list has three players", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("player-row")).toHaveCount(3);
});
