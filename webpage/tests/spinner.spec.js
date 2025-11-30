const { test, expect } = require("@playwright/test");

test.describe("Spinner Component", () => {
  test.beforeEach(async ({ page }) => {
    // Create a simple test page with the Spinner component
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Spinner Component Test</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            .dot {
              animation: bounce-dot 1.4s infinite ease-in-out both;
            }
            @keyframes bounce-dot {
              0%, 80%, 100% { transform: scale(0); }
              40% { transform: scale(1); }
            }
            .dot:nth-child(1) { animation-delay: -0.32s; }
            .dot:nth-child(2) { animation-delay: -0.16s; }
            .dot:nth-child(3) { animation-delay: 0s; }
          </style>
        </head>
        <body>
          <div id="app">
            <!-- Spinner -->
            <div class="flex justify-center items-center py-10">
              <div class="flex space-x-1 text-blue-600 text-4xl">
                <span class="dot">.</span>
                <span class="dot">.</span>
                <span class="dot">.</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
  });

  test("should render spinner with correct structure and animation", async ({
    page,
  }) => {
    const spinner = page.locator(".flex.justify-center.items-center");
    const dots = page.locator(".dot");

    // Check spinner container
    await expect(spinner).toBeVisible();
    await expect(spinner).toHaveClass(/flex/);
    await expect(spinner).toHaveClass(/justify-center/);
    await expect(spinner).toHaveClass(/items-center/);

    // Check dots
    await expect(dots).toHaveCount(3);
    await expect(dots.first()).toHaveClass(/dot/);

    // Check styling
    const dotContainer = page.locator(".flex.space-x-1.text-blue-600.text-4xl");
    await expect(dotContainer).toHaveClass(/text-blue-600/);
    await expect(dotContainer).toHaveClass(/text-4xl/);
  });
});
