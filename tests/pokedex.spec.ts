import { test, expect } from "@playwright/test";

/*
  Fetched from a relative path, so on a sandbox this only passes if SafeMerge
  forwarded the call to PokeAPI. Names are strings in a response that also
  carries a number, so a wrong-value rewrite leaves them alone: caught by a dead
  API and by an empty list, not by a wrong value.
*/
test("the pokédex lists bulbasaur, ivysaur and venusaur", async ({ page }) => {
  await page.goto("/");
  const rows = page.getByTestId("pokemon-row");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toHaveText("bulbasaur");
  await expect(rows.nth(1)).toHaveText("ivysaur");
  await expect(rows.nth(2)).toHaveText("venusaur");
});
