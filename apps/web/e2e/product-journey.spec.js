import { expect, test } from "@playwright/test";

const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const email = `browser-${suffix}@example.test`;
const password = "Browser-password-12345";

test("public product and docs remain anonymous", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Build components once",
  );
  await expect(page.getByRole("link", { name: "Start building" })).toHaveAttribute("href", "/register");
  await expect(page.getByRole("link", { name: "Watch the demo" })).toHaveAttribute("href", "/#demo");
  await expect(page.getByRole("heading", { name: "Build, publish, install" })).toBeVisible();
  await expect(page.getByRole("main")).toHaveCount(1);
  const demoVideo = await page.request.get("/demo-video.mp4");
  expect(demoVideo.ok()).toBe(true);
  expect(demoVideo.headers()["content-type"]).toContain("video/mp4");
  expect((await demoVideo.body()).byteLength).toBe(1_801_743);
  await page.setViewportSize({ width: 390, height: 844 });
  const menuButton = page.getByRole("button", { name: "Toggle navigation menu" });
  await expect(menuButton).toHaveAttribute("aria-controls", "mobile-menu");
  await expect(page.locator("#mobile-menu")).toHaveCount(1);
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await page.goto("/docs/compatibility");
  await expect(page).toHaveURL(/\/docs\/compatibility$/);
  await expect(page.getByRole("heading", { level: 1, name: "Compatibility and verification" })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByRole("link", { name: "Inspect a Storybook story" })).toHaveAttribute("href", "/docs/getting-started");
});


test("navbar links remain reliable across repeated hash and route navigation", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Login", exact: true })).toHaveAttribute("href", "/login");

  for (const [name, hash] of [
    ["Features", "features"],
    ["Demo", "demo"],
    ["Pricing", "pricing"],
    ["Features", "features"],
  ]) {
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${hash}$`));
    await expect.poll(() => page.evaluate((id) => {
      const target = document.getElementById(id);
      const navbar = document.querySelector(".site-navbar");
      if (!target || !navbar) return false;
      const targetTop = target.getBoundingClientRect().top;
      const navbarBottom = navbar.getBoundingClientRect().bottom;
      return targetTop >= navbarBottom && targetTop <= navbarBottom + 32;
    }, hash)).toBe(true);
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => document.getElementById("features")?.getBoundingClientRect().top > 500)).toBe(true);
  await page.getByRole("link", { name: "Features", exact: true }).click();
  await expect.poll(() => page.evaluate(() => {
    const target = document.getElementById("features");
    const navbar = document.querySelector(".site-navbar");
    if (!target || !navbar) return false;
    const targetTop = target.getBoundingClientRect().top;
    const navbarBottom = navbar.getBoundingClientRect().bottom;
    return targetTop >= navbarBottom && targetTop <= navbarBottom + 32;
  })).toBe(true);

  await page.getByRole("navigation").getByRole("link", { name: "Docs", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/getting-started$/);

  await page.goto("/");
  await page.setViewportSize({ width: 390, height: 844 });
  const menuButton = page.getByRole("button", { name: "Toggle navigation menu" });
  await menuButton.click();
  await page.locator("#mobile-menu").getByRole("link", { name: "Demo", exact: true }).click();
  await expect(page).toHaveURL(/#demo$/);
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  expect(pageErrors).toEqual([]);
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
