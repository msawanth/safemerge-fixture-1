import { test, expect } from "@playwright/test";

/*
  The berry is one object, not a list, so emptying lists leaves these figures
  standing: caught by a dead API and by a wrong value, not by an empty list.
  The opposite profile to the pokédex test, which is why both exist.
*/
test("the cheri berry takes 3 to grow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("berry-name")).toHaveText("cheri");
  await expect(page.getByTestId("berry-growth")).toHaveText("3");
});

test("the cheri berry yields at most 5", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("berry-name")).toHaveText("cheri");
  await expect(page.getByTestId("berry-harvest")).toHaveText("5");
});
