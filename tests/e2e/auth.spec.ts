import { test, expect } from "@playwright/test";

/**
 * E2E tests for the authentication pages.
 * Covers /signup — verifies all form fields, headings, and navigation links.
 */
test.describe("Signup Page", () => {
  test("renders page title and heading", async ({ page }) => {
    await page.goto("/signup");

    await expect(page).toHaveTitle(/Prova/);
    await expect(page.getByRole("heading", { name: /Create account/i })).toBeVisible();
  });

  test("renders all form fields", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.locator("#fullName")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#confirmPassword")).toBeVisible();
  });

  test("renders the submit button with correct label", async ({ page }) => {
    await page.goto("/signup");

    const submitButton = page.getByRole("button", { name: /Create account/i });
    await expect(submitButton).toBeVisible();
  });

  test("renders a link back to the login page", async ({ page }) => {
    await page.goto("/signup");

    const signInLink = page.getByRole("link", { name: /Sign in/i });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute("href", "/login");
  });

  test("renders the Google sign-up button", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.getByRole("button", { name: /Sign up with Google/i })).toBeVisible();
  });
});
