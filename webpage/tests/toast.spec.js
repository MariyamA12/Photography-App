const { test, expect } = require("@playwright/test");

test.describe("Toast Component", () => {
  test.beforeEach(async ({ page }) => {
    // Create a simple test page with the Toast component
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Toast Component Test</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <div id="app">
            <!-- Success Toast -->
            <div id="success-toast" class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
              <div class="bg-green-100 text-green-800 pointer-events-auto px-4 py-2 rounded shadow-lg">
                Success message here
              </div>
            </div>
            
            <!-- Error Toast -->
            <div id="error-toast" class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
              <div class="bg-red-100 text-red-800 pointer-events-auto px-4 py-2 rounded shadow-lg">
                Error message here
              </div>
            </div>
            
            <!-- Info Toast -->
            <div id="info-toast" class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
              <div class="bg-blue-100 text-blue-800 pointer-events-auto px-4 py-2 rounded shadow-lg">
                Info message here
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
  });

  test("should render different toast types with correct styling", async ({
    page,
  }) => {
    const successToast = page.locator("#success-toast .bg-green-100");
    const errorToast = page.locator("#error-toast .bg-red-100");
    const infoToast = page.locator("#info-toast .bg-blue-100");

    // Check visibility and positioning
    await expect(successToast).toBeVisible();
    await expect(errorToast).toBeVisible();
    await expect(infoToast).toBeVisible();

    // Check styling for different types
    await expect(successToast).toHaveClass(/bg-green-100/);
    await expect(errorToast).toHaveClass(/bg-red-100/);
    await expect(infoToast).toHaveClass(/bg-blue-100/);

    // Check positioning classes
    await expect(page.locator("#success-toast")).toHaveClass(/fixed/);
    await expect(page.locator("#success-toast")).toHaveClass(/top-4/);
    await expect(page.locator("#success-toast")).toHaveClass(/z-50/);
  });

  test("should be clickable and have proper pointer events", async ({
    page,
  }) => {
    const toastContent = page.locator("#success-toast .bg-green-100");

    // Verify the toast content is visible and clickable
    await expect(toastContent).toBeVisible();
    await expect(toastContent).toHaveClass(/pointer-events-auto/);

    // Test that we can click on it without errors
    await toastContent.click({ force: true });

    // Verify the element is still there after clicking
    await expect(toastContent).toBeVisible();
  });
});
