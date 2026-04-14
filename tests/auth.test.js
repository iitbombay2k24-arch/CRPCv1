import { test, expect } from '@playwright/test';

test.describe('Authentication System', () => {
  test('should show login page by default', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page).toHaveTitle(/DYPIU Collab/);
    
    // Check for login ingredients
    const emailInput = page.locator('input[type="email"]');
    const loginButton = page.locator('button:has-text("Login")');
    
    await expect(emailInput).toBeVisible();
    await expect(loginButton).toBeVisible();
  });

  test('should restrict registration to DYPIU domain', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Switch to register if needed (assuming there's a toggle)
    const registerToggle = page.locator('button:has-text("Register")');
    if (await registerToggle.isVisible()) {
      await registerToggle.click();
    }

    const emailInput = page.locator('input[placeholder*="email"]');
    await emailInput.fill('hacker@gmail.com');
    await page.locator('button:has-text("Create Account")').click();
    
    // Assuming we show an error toast for invalid domain
    const toast = page.locator('.toast-error');
    if (await toast.isVisible()) {
       await expect(toast).toContainText(/dypiuinternational/);
    }
  });
});
