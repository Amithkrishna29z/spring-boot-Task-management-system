import { test, expect } from "@playwright/test";

// Smoke checks that the app boots, guards protected routes, and the auth screens render.
test("unauthenticated visit lands on the login screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("can navigate from login to register", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: /sign up/i }).click();
  await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
});
