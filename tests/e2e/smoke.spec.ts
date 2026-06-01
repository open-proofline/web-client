import { expect, test } from "@playwright/test";

test("loads the prototype login flow", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(
    page.getByText("Experimental prototype. Not for emergency reliance."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Log in" }).click();
  await expect(
    page.getByRole("heading", { name: "Incident review workspace" }),
  ).toBeVisible();
  await expect(page.getByText("Signed in as")).toBeVisible();
  await expect(page.getByText("prototype-user")).toBeVisible();
  await expect(page.getByText("API mode")).toBeVisible();
  await expect(page.getByText("mock", { exact: true })).toBeVisible();
  await expect(page.getByText("Open incidents")).toBeVisible();
  await expect(page.getByText("Shared metadata records")).toBeVisible();
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
  await expect(page.getByText("inc_prototype_001")).toBeVisible();
  await expect(page.getByText("inc_prototype_002")).toBeVisible();

  await page.getByRole("link", { name: "inc_prototype_001" }).click();
  await expect(page).toHaveURL(/\/incidents\/inc_prototype_001$/);
  await expect(
    page.getByRole("heading", { name: "inc_prototype_001" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Streams" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chunks" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Contact public keys" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sharing grants" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Wrapped keys", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("No grants")).toBeVisible();
  await expect(page.getByText("No wrapped keys")).toBeVisible();
  await expect(
    page.getByText("Experimental prototype. Not for emergency reliance."),
  ).toBeVisible();
});
