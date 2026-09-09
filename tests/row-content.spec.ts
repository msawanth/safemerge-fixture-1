import { test, expect } from "@playwright/test";

test("the squad list shows Priya Raman wearing number 7", async ({ page }) => {
  await page.goto("/");
  const rows = page.getByTestId("player-row");
  await expect(rows.filter({ hasText: "Priya Raman" })).toHaveCount(1);
  await expect(rows.filter({ hasText: "Priya Raman" })).toContainText("#7");
  await expect(rows.filter({ hasText: "Priya Raman" }).getByTestId("player-goals")).toHaveText("12");
});
