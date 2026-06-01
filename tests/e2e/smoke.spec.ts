import { expect, test } from "@playwright/test";

test("loads the prototype login flow", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(
    page.getByText("Experimental prototype. Not for emergency reliance."),
  ).toBeVisible();
});

test("navigates internal incident routes without full page reloads", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(
    page.getByRole("heading", { name: "Incident review workspace" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "View incidents" }).click();
  await expect(page).toHaveURL(/\/incidents$/);
  await expect(
    page.getByRole("heading", { name: "Incidents" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "inc_prototype_001" }).click();
  await expect(page).toHaveURL(/\/incidents\/inc_prototype_001$/);
  await expect(
    page.getByRole("heading", { name: "inc_prototype_001" }),
  ).toBeVisible();
});
