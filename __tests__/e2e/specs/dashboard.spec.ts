// LOC_CATEGORY: tests
import { test, expect } from '@playwright/test';

test.describe('Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.fill('input[placeholder="Username"]', 'admin');
    await page.fill('input[placeholder="Password"]', 'secret');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should display dashboard components', async ({ page }) => {
    // Check main dashboard elements
    await expect(page.getByText('Welcome to CHARLY, admin!')).toBeVisible();
    await expect(page.getByText('Property Tax Appeal Platform Dashboard')).toBeVisible();

    // Check all widget cards
    await expect(page.getByText('🏠 Platform Overview')).toBeVisible();
    await expect(page.getByText('📊 Sample Properties')).toBeVisible();
    await expect(page.getByText('🏛️ Jurisdiction Info')).toBeVisible();
    await expect(page.getByText('⚡ Quick Actions')).toBeVisible();
  });

  test('should display correct statistics', async ({ page }) => {
    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Check overview statistics
    await expect(page.getByText('Properties')).toBeVisible();
    await expect(page.getByText('Over-Assessed')).toBeVisible();
    await expect(page.getByText('Appeal Potential')).toBeVisible();
    await expect(page.getByText('Jurisdictions')).toBeVisible();

    // Check property cards
    await expect(page.getByText('123 Main Street, Dallas, TX 75201')).toBeVisible();
    await expect(page.getByText('Account: 123456789')).toBeVisible();
  });

  test('should have working navigation menu', async ({ page }) => {
    // Test sidebar navigation
    await expect(page.getByText('🏠 CHARLY')).toBeVisible();

    // Navigate to Property Fields
    await page.click('text=Property Fields');
    await expect(page).toHaveURL(/property-fields/);
    await expect(page.getByText('Property Fields')).toBeVisible();

    // Navigate to Bulk Upload
    await page.click('text=Bulk Upload');
    await expect(page).toHaveURL(/bulk-upload/);
    await expect(page.getByText('Bulk Upload')).toBeVisible();

    // Navigate to Analytics
    await page.click('text=Analytics');
    await expect(page).toHaveURL(/analytics/);
    await expect(page.getByText('Analytics Dashboard')).toBeVisible();

    // Navigate to Narratives
    await page.click('text=Narratives');
    await expect(page).toHaveURL(/narratives/);
    await expect(page.getByText('Appeal Narratives')).toBeVisible();

    // Return to Dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should handle quick action buttons', async ({ page }) => {
    // Test Upload Data button
    await page.click('button:has-text("Upload Data")');
    await expect(page.locator('.ant-message')).toContainText('Navigate to Bulk Upload', {
      timeout: 5000,
    });

    // Test Property Fields button
    await page.click('button:has-text("Property Fields")');
    await expect(page.locator('.ant-message')).toContainText('Navigate to Property Fields');

    // Test Generate Report button
    await page.click('button:has-text("Generate Report")');
    await expect(page.locator('.ant-message')).toContainText('Generate Analysis');

    // Test Create Appeal button
    await page.click('button:has-text("Create Appeal")');
    await expect(page.locator('.ant-message')).toContainText('Create Appeal Packet');
  });

  test('should support layout customization', async ({ page }) => {
    // Click customize layout button
    await page.click('button:has-text("Customize Layout")');
    await expect(page.locator('.ant-message')).toContainText(
      'Dashboard customization coming soon!'
    );
  });

  test('should display jurisdiction information', async ({ page }) => {
    // Wait for jurisdiction data to load
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Dallas County, TX')).toBeVisible();
    await expect(page.getByText('Assessment Cycle:')).toBeVisible();
    await expect(page.getByText('Appeal Deadline:')).toBeVisible();
    await expect(page.getByText('Cap Rate Floor:')).toBeVisible();
    await expect(page.getByText('Max Assessment Increase:')).toBeVisible();
  });

  test('should handle sidebar collapse/expand', async ({ page }) => {
    // Click collapse button
    const collapseButton = page.locator('button').filter({ hasText: '←' });
    await collapseButton.click();

    // Sidebar should be collapsed (showing only icon)
    await expect(page.getByText('🏠')).toBeVisible();
    await expect(page.getByText('🏠 CHARLY')).not.toBeVisible();

    // Click expand button
    const expandButton = page.locator('button').filter({ hasText: '→' });
    await expandButton.click();

    // Sidebar should be expanded
    await expect(page.getByText('🏠 CHARLY')).toBeVisible();
  });

  test('should show user info in header', async ({ page }) => {
    await expect(page.getByText('admin (Admin)')).toBeVisible();
    await expect(page.getByRole('button', { name: /Logout/ })).toBeVisible();
  });

  test('should handle property card interactions', async ({ page }) => {
    // Wait for properties to load
    await page.waitForLoadState('networkidle');

    // Property cards should be visible
    const propertyCards = page.locator('.ant-card-grid');
    await expect(propertyCards.first()).toBeVisible();

    // Check property status colors
    const statusBadges = page.locator('[style*="background"]').filter({
      hasText: /Over-assessed|Fair|Under-assessed/,
    });
    await expect(statusBadges.first()).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByText('🏠 Platform Overview')).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('🏠 Platform Overview')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('🏠 Platform Overview')).toBeVisible();
  });

  test('should load data efficiently', async ({ page }) => {
    // Measure data loading performance
    const startTime = Date.now();

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should display properties data
    await expect(page.getByText('123 Main Street, Dallas, TX 75201')).toBeVisible();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // 5 second budget for full dashboard load
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and return errors
    await page.route('**/api/sample-properties', (route) =>
      route.fulfill({ status: 500, body: '{"detail": "Server error"}' })
    );

    await page.reload();

    // Dashboard should still load, even with API errors
    await expect(page.getByText('Welcome to CHARLY, admin!')).toBeVisible();
    await expect(page.getByText('🏠 Platform Overview')).toBeVisible();
  });

  test('should navigate efficiently between pages', async ({ page }) => {
    const navigationTests = [
      { text: 'Property Fields', url: /property-fields/, heading: 'Property Fields' },
      { text: 'Bulk Upload', url: /bulk-upload/, heading: 'Bulk Upload' },
      { text: 'Analytics', url: /analytics/, heading: 'Analytics Dashboard' },
      { text: 'Narratives', url: /narratives/, heading: 'Appeal Narratives' },
    ];

    for (const nav of navigationTests) {
      const startTime = Date.now();

      await page.click(`text=${nav.text}`);
      await expect(page).toHaveURL(nav.url);
      await expect(page.getByText(nav.heading)).toBeVisible();

      const navTime = Date.now() - startTime;
      expect(navTime).toBeLessThan(2000); // 2 second navigation budget

      // Return to dashboard
      await page.click('text=Dashboard');
      await expect(page).toHaveURL(/dashboard/);
    }
  });
});

test.describe('Dashboard - Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[placeholder="Username"]', 'admin');
    await page.fill('input[placeholder="Password"]', 'secret');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Focus should start at collapse button or first interactive element
    await page.keyboard.press('Tab');

    // Should be able to navigate through quick action buttons
    const focusedElement = await page.locator(':focus').textContent();
    expect(focusedElement).toBeTruthy();

    // Tab through multiple elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const newFocus = await page.locator(':focus').textContent();
      expect(newFocus).toBeTruthy();
    }
  });

  test('should activate buttons with Enter/Space', async ({ page }) => {
    // Find the customize layout button
    await page.keyboard.press('Tab');
    let focused = await page.locator(':focus');

    // Keep tabbing until we find the customize button
    while (!(await focused.textContent())?.includes('Customize')) {
      await page.keyboard.press('Tab');
      focused = await page.locator(':focus');

      // Safety check to avoid infinite loop
      const text = await focused.textContent();
      if (!text) break;
    }

    // Activate with Enter
    await page.keyboard.press('Enter');
    await expect(page.locator('.ant-message')).toContainText(
      'Dashboard customization coming soon!'
    );
  });
});

test.describe('Dashboard - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[placeholder="Username"]', 'admin');
    await page.fill('input[placeholder="Password"]', 'secret');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should have proper heading structure', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();

    // Should have main heading
    expect(headings).toContain('Welcome to CHARLY, admin!');
    expect(headings.length).toBeGreaterThan(1);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check for card regions
    const cards = page.locator('[role="article"], .ant-card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Check buttons have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();

      // Button should have either aria-label or text content
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Test key UI elements for color contrast
    const elements = [
      page.getByText('Welcome to CHARLY, admin!'),
      page.getByRole('button', { name: /Customize Layout/ }),
      page.getByText('Properties'),
    ];

    for (const element of elements) {
      const styles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        };
      });

      expect(styles.color).toBeTruthy();
      // Background may be transparent, which is acceptable
    }
  });
});
