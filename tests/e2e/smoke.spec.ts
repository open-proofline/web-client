import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(
  page: import("@playwright/test").Page,
) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
            document.documentElement.clientWidth &&
          document.body.scrollWidth <= document.body.clientWidth,
      ),
    )
    .toBe(true);
}

test("loads the login flow", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in" })).toHaveCount(0);
  await expect(page.getByText("Experimental")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "Account overview" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByLabel("Account menu").click();
  await expect(page.getByText("prototype-user")).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
  await page.getByRole("heading", { name: "Account overview" }).click();
  await expect(page.getByRole("menuitem", { name: "Sign out" })).toHaveCount(0);
  await expect(page.getByText("Connection mode")).toBeVisible();
  await expect(page.getByText("mock", { exact: true })).toBeVisible();
  await expect(page.getByText("Open records")).toBeVisible();
  await expect(page.getByText("Shared records")).toBeVisible();
});

test("creates sample registrations without signing in", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/register$/);
  await expect(
    page.getByRole("heading", { name: "Create account" }),
  ).toBeVisible();
  await page.getByLabel("Username").fill("new-user");
  await page.getByLabel("Email").fill("new-user@example.invalid");
  await page.getByLabel("Password").fill("valid-password");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Check your email to continue.")).toBeVisible();
  await expect(
    page.getByText(
      "Sample registration accepted. No account is created and no email is sent.",
    ),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page.getByText("prototype-user")).toHaveCount(0);
});

test("verifies email links without retaining URL fragments", async ({
  page,
}) => {
  await page.goto("/verify-email#token=e2e-token");

  await expect(page).toHaveURL(/\/verify-email$/);
  await expect(
    page.getByRole("heading", { name: "Verify email" }),
  ).toBeVisible();
  await expect(
    page.getByText("Your email address has been verified."),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page.getByText("e2e-token")).toHaveCount(0);
});

test("navigates internal incident routes without full page reloads", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("heading", { name: "Account overview" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("link", { name: "View records" }).click();
  await expect(page).toHaveURL(/\/incidents$/);
  await expect(
    page.getByRole("heading", { name: "Incident records" }),
  ).toBeVisible();
  await expect(page.getByText("inc_prototype_001")).toBeVisible();
  await expect(page.getByText("inc_prototype_002")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("link", { name: "inc_prototype_001" }).click();
  await expect(page).toHaveURL(/\/incidents\/inc_prototype_001$/);
  await expect(
    page.getByRole("heading", { name: "inc_prototype_001" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Streams" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chunks" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Contact keys" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Shared access", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Key delivery", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("No shared access")).toBeVisible();
  await expect(page.getByText("No key delivery")).toBeVisible();
  await expect(page.getByText("Experimental")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
