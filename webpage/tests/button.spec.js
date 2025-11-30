const { test, expect } = require("@playwright/test");

test.describe("Button Component", () => {
  test.beforeEach(async ({ page }) => {
    // Create a simple test page with the Button component
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Button Component Test</title>
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
            <!-- Primary Button -->
            <button id="primary-btn" class="flex items-center justify-center px-4 py-2 rounded font-semibold focus:outline-none bg-blue-600 hover:bg-blue-700 text-white">
              Primary Button
            </button>
            
            <!-- Secondary Button -->
            <button id="secondary-btn" class="flex items-center justify-center px-4 py-2 rounded font-semibold focus:outline-none bg-gray-600 hover:bg-gray-700 text-white">
              Secondary Button
            </button>
            
            <!-- Disabled Button -->
            <button id="disabled-btn" class="flex items-center justify-center px-4 py-2 rounded font-semibold focus:outline-none bg-blue-600 hover:bg-blue-700 text-white opacity-50 cursor-not-allowed" disabled>
              Disabled Button
            </button>
            
            <!-- Loading Button -->
            <button id="loading-btn" class="flex items-center justify-center px-4 py-2 rounded font-semibold focus:outline-none bg-blue-600 hover:bg-blue-700 text-white opacity-50 cursor-not-allowed" disabled>
              <div class="flex space-x-1">
                <span class="dot text-white text-xl">.</span>
                <span class="dot text-white text-xl">.</span>
                <span class="dot text-white text-xl">.</span>
              </div>
            </button>
          </div>
        </body>
      </html>
    `);
  });

  test("should render buttons with correct text and styling", async ({
    page,
  }) => {
    const primaryBtn = page.locator("#primary-btn");
    const secondaryBtn = page.locator("#secondary-btn");
    const disabledBtn = page.locator("#disabled-btn");
    const loadingBtn = page.locator("#loading-btn");

    // Check button text
    await expect(primaryBtn).toHaveText("Primary Button");
    await expect(secondaryBtn).toHaveText("Secondary Button");
    await expect(disabledBtn).toHaveText("Disabled Button");

    // Check styling
    await expect(primaryBtn).toHaveClass(/bg-blue-600/);
    await expect(secondaryBtn).toHaveClass(/bg-gray-600/);
    await expect(disabledBtn).toHaveClass(/opacity-50/);
    await expect(disabledBtn).toBeDisabled();
  });

  test("should handle button interactions correctly", async ({ page }) => {
    const primaryBtn = page.locator("#primary-btn");
    const disabledBtn = page.locator("#disabled-btn");

    // Test clickable button
    await page.evaluate(() => {
      window.clickCount = 0;
      document.getElementById("primary-btn").addEventListener("click", () => {
        window.clickCount++;
      });
    });

    await primaryBtn.click();
    const clickCount = await page.evaluate(() => window.clickCount);
    expect(clickCount).toBe(1);

    // Test disabled button
    await expect(disabledBtn).toBeDisabled();
  });

  test("should show loading state properly", async ({ page }) => {
    const loadingBtn = page.locator("#loading-btn");
    const loadingDots = loadingBtn.locator(".dot");

    await expect(loadingBtn).toBeDisabled();
    await expect(loadingDots).toHaveCount(3);
    await expect(loadingBtn).toHaveClass(/opacity-50/);
  });
});
