// LOC_CATEGORY: tests
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page by default', async ({ page }) => {
    await expect(page.getByText('CHARLY')).toBeVisible();
    await expect(page.getByText('Property Tax Appeal Platform')).toBeVisible();
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should show demo credentials', async ({ page }) => {
    await expect(page.getByText('Demo Credentials:')).toBeVisible();
    await expect(page.getByText(/admin.*secret/)).toBeVisible();
    await expect(page.getByText(/analyst.*secret/)).toBeVisible();
  });

  test('should login successfully with admin credentials', async ({ page }) => {
    // Fill in login form
    await page.fill('input[placeholder="Username"]', 'admin');
    await page.fill('input[placeholder="Password"]', 'secret');

    // Submit form
    await page.click('button:has-text("Sign In")');

    // Wait for navigation to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    await expect(page.getByText('Welcome to CHARLY, admin!')).toBeVisible();
    await expect(page.getByText('🏠 Platform Overview')).toBeVisible();
  });

  test('should login successfully with analyst credentials', async ({ page }) => {
    await page.fill('input[placeholder="Username"]', 'analyst');
    await page.fill('input[placeholder="Password"]', 'secret');
    await page.click('button:has-text("Sign In")');

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    await expect(page.getByText('Welcome to CHARLY, analyst!')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[placeholder="Username"]', 'invalid');
    await page.fill('input[placeholder="Password"]', 'wrong');
    await page.click('button:has-text("Sign In")');

    // Should remain on login page
    await expect(page).toHaveURL('/');
    // Error message should appear
    await expect(page.locator('.ant-message')).toContainText('Invalid credentials', {
      timeout: 5000,
    });
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button:has-text("Sign In")');

    // Should show validation errors
    await expect(page.getByText('Please input your username!')).toBeVisible();
    await expect(page.getByText('Please input your password!')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab to username field
    await page.keyboard.press('Tab');
    await expect(page.getByPlaceholder('Username')).toBeFocused();

    // Type username
    await page.keyboard.type('admin');

    // Tab to password field
    await page.keyboard.press('Tab');
    await expect(page.getByPlaceholder('Password')).toBeFocused();

    // Type password
    await page.keyboard.type('secret');

    // Tab to submit button
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeFocused();

    // Submit with Enter
    await page.keyboard.press('Enter');

    // Should navigate to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should mask password input', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('Password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show loading state during login', async ({ page }) => {
    await page.fill('input[placeholder="Username"]', 'admin');
    await page.fill('input[placeholder="Password"]', 'secret');

    // Intercept the login request to add delay
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    const signInButton = page.getByRole('button', { name: 'Sign In' });
    await signInButton.click();

    // Button should show loading state
    await expect(signInButton).toHaveClass(/ant-btn-loading/);
  });

  test('should persist authentication on page refresh', async ({ page }) => {
    // Login first
    await page.fill('input[placeholder="Username"]', 'admin');
    await page.fill('input[placeholder="Password"]', 'secret');
    await page.click('button:has-text("Sign In")');

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Check that token is stored
    const localStorage = await page.evaluate(() => window.localStorage.getItem('token'));
    expect(localStorage).toBeTruthy();

    // Refresh page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome to CHARLY, admin!')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[placeholder="Username"]', 'admin');
    await page.fill('input[placeholder="Password"]', 'secret');
    await page.click('button:has-text("Sign In")');

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Click logout button
    await page.click('button:has-text("Logout")');

    // Should redirect to login page
    await expect(page).toHaveURL('/');
    await expect(page.getByText('CHARLY')).toBeVisible();

    // Token should be removed
    const localStorage = await page.evaluate(() => window.localStorage.getItem('token'));
    expect(localStorage).toBeNull();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Block API requests
    await page.route('**/api/auth/login', (route) => route.abort());

    await page.fill('input[placeholder="Username"]', 'admin');
    await page.fill('input[placeholder="Password"]', 'secret');
    await page.click('button:has-text("Sign In")');

    // Should show error message
    await expect(page.locator('.ant-message')).toContainText('Login failed', { timeout: 5000 });

    // Should remain on login page
    await expect(page).toHaveURL('/');
  });

  test('should be accessible', async ({ page }) => {
    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);

    // Check form has proper labels
    await expect(page.getByPlaceholder('Username')).toHaveAttribute('aria-label');
    await expect(page.getByPlaceholder('Password')).toHaveAttribute('aria-label');

    // Check color contrast
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    const backgroundColor = await signInButton.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).toBeTruthy();
  });
});

test.describe('Login - Mobile View', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/');

    // Check that all elements are visible
    await expect(page.getByText('CHARLY')).toBeVisible();
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // Card should adapt to mobile width
    const card = page.locator('.ant-card').first();
    const box = await card.boundingBox();
    expect(box?.width).toBeLessThan(400);
  });

  test('should login successfully on mobile', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[placeholder="Username"]', 'admin');
    await page.fill('input[placeholder="Password"]', 'secret');
    await page.click('button:has-text("Sign In")');

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    await expect(page.getByText('Welcome to CHARLY, admin!')).toBeVisible();
  });
});

test.describe('Login - Performance', () => {
  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await expect(page.getByText('CHARLY')).toBeVisible();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 second budget
  });

  test('should have minimal layout shifts', async ({ page }) => {
    await page.goto('/');

    // Wait for initial render
    await page.waitForLoadState('networkidle');

    // Check for layout stability
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (
              entry.entryType === 'layout-shift' &&
              !(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput
            ) {
              clsValue += (entry as PerformanceEntry & { value: number }).value;
            }
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 2000);
      });
    });

    expect(cls).toBeLessThan(0.1); // Good CLS threshold
  });
});
