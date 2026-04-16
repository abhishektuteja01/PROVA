import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders key elements", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Prova/);

    await expect(page.getByText("Know what's missing")).toBeVisible();

    const ctaButton = page.getByRole("link", { name: /Start checking/i });
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveAttribute("href", "/signup");

    await expect(page.getByText("Conceptual Soundness")).toBeVisible();
    await expect(page.getByText("Outcomes Analysis")).toBeVisible();
    await expect(page.getByText("Ongoing Monitoring")).toBeVisible();

    await expect(
      page.getByText("For training and synthetic model documents only")
    ).toBeVisible();
  });
});
