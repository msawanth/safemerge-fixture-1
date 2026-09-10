import { test, expect } from "@playwright/test";

/*
  The fixture's repairable weak test.

  It is the test people actually write: it proves the finance section loaded -
  there are rows, and there is a total - and never checks that the total is the
  total OF those rows. So it catches a dead API and an empty list, and sleeps
  straight through a wrong value.

  That single surviving mutation is the point. Closing it needs an expectation
  the API cannot satisfy by accident, and the one available here is the two
  numbers on this page that must agree: the stated total against the sum of the
  amounts above it. Both are already located below, which is what makes this
  repairable where `heading` and `count` are not.
*/
test("the finance section shows entries and a total", async ({ page }) => {
  await page.goto("/");

  const rows = page.getByTestId("finance-row");
  await expect(rows).not.toHaveCount(0);

  await expect(page.getByTestId("finance-total")).toBeVisible();
});
