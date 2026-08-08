import { expect, test } from "@playwright/test";

const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const email = `browser-${suffix}@example.test`;
const password = "Browser-password-12345";

test("public product and docs remain anonymous", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Build components once.",
  );
  const githubLink = page.getByRole("link", { name: "Open source on GitHub" });
  await expect(githubLink).toHaveAttribute("href", "https://github.com/kubet/compify");
  await expect(githubLink).toHaveAttribute("target", "_blank");
  await page.goto("/docs/compatibility");
  await expect(page).toHaveURL(/\/docs\/compatibility$/);
  await expect(page.getByText("Compatibility", { exact: false }).first()).toBeVisible();
});

test("protected routes send anonymous users to login without an external redirect", async ({ page }) => {
  await page.goto("/my-components");
  await expect(page).toHaveURL(/\/login$/);
  const forward = await page.evaluate(() => localStorage.getItem("afterLoginForwardLink"));
  expect(forward).toBe("/my-components");
});

test("browser registration and login activate a real session safely", async ({ page }) => {
  await page.goto("/register");
  await page.getByPlaceholder("First Name").fill("Browser");
  await page.getByPlaceholder("Last Name").fill("Smoke");
  await page.getByPlaceholder("Email address").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign Up For Free" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

  await page.goto("/login");
  await page.evaluate(() => localStorage.setItem("afterLoginForwardLink", "https://cross-site.invalid/phish"));
  await page.getByPlaceholder("Email address").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("afterLoginForwardLink"))).toBeNull();

  await page.goto("/my-components");
  await expect(page).toHaveURL(/\/my-components$/);
  await expect(page).not.toHaveURL(/\/login$/);
});
