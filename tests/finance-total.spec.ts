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

  const total = page.getByTestId("finance-total");
  await expect(total).toBeVisible();
  await expect(total).toHaveText(/[0-9]/);

  // Every rendered row must be a real record carrying an amount, not the
  // empty state wearing a row's clothes.
  const rowCount = await rows.count();
  for (let i = 0; i < rowCount; i++) {
    await expect(rows.nth(i)).not.toContainText(/no results|no data|nothing to show|empty/i);
    await expect(rows.nth(i)).toHaveText(/[0-9]/);
  }

  // The two numbers on this page that must agree: the stated total against the
  // sum of the amounts above it. A mutated amount or a mutated total breaks it.
  const toNumber = (raw: string): number => {
    const matches = raw.replace(/\u2212/g, "-").match(/-?\d[\d,\s]*(?:\.\d+)?/g);
    if (!matches || matches.length === 0) {
      throw new Error(`no numeric value found in ${JSON.stringify(raw)}`);
    }
    return Number(matches[matches.length - 1].replace(/[,\s]/g, ""));
  };

  const rowTexts = await rows.allTextContents();
  expect(rowTexts).toHaveLength(rowCount);

  const amounts = rowTexts.map(toNumber);
  amounts.forEach((amount) => expect(Number.isNaN(amount)).toBe(false));

  const sumOfRows = amounts.reduce((acc, amount) => acc + amount, 0);
  const statedTotal = toNumber((await total.textContent()) ?? "");

  expect(Math.round(statedTotal * 100)).toBe(Math.round(sumOfRows * 100));
});
