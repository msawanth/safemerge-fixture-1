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

  // Two places on the page that must agree: the stated total against the sum
  // of the amounts in the rows above it. A mutated amount or a mutated total
  // breaks the agreement, which no shape assertion could detect.
  const parseAmount = (text: string): number => {
    const matches = text.match(/-?\d[\d,\s]*(?:[.,]\d{1,2})?/g);
    if (!matches || matches.length === 0) {
      throw new Error(`No numeric amount found in: ${JSON.stringify(text)}`);
    }
    const raw = matches[matches.length - 1].replace(/[,\s]/g, "");
    const value = Number(raw);
    if (Number.isNaN(value)) {
      throw new Error(`Unparsable amount: ${JSON.stringify(text)}`);
    }
    return value;
  };

  const rowTexts = await rows.allInnerTexts();
  expect(rowTexts.length).toBeGreaterThan(0);

  const summed = rowTexts.reduce((acc, text) => acc + parseAmount(text), 0);
  const stated = parseAmount(await total.innerText());

  expect(Math.round(stated * 100)).toBe(Math.round(summed * 100));
});
