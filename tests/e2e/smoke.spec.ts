import { expect, test } from "@playwright/test";

test("loads the prototype login flow", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(
    page.getByText("Experimental prototype. Not for emergency reliance."),
  ).toBeVisible();
});
