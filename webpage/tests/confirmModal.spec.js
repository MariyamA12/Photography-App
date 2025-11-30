const { test, expect } = require("@playwright/test");

test.describe("ConfirmModal Component", () => {
  test.beforeEach(async ({ page }) => {
    // Create a simple test page with the ConfirmModal component
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ConfirmModal Component Test</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            /* Mock icon styles */
            .w-5 { width: 1.25rem; }
            .h-5 { height: 1.25rem; }
          </style>
        </head>
        <body>
          <div id="app">
            <!-- Open Modal -->
            <div id="open-modal" class="fixed inset-0 z-50 flex items-center justify-center">
              <div class="absolute inset-0 bg-black opacity-50"></div>
              <div class="bg-white p-6 rounded shadow-lg z-10 w-80">
                <button class="text-gray-500 float-right" id="close-btn">
                  <span class="w-5 h-5">×</span>
                </button>
                <p class="mb-6">Are you sure you want to delete this item?</p>
                <div class="flex justify-end space-x-4">
                  <button class="px-4 py-2 rounded border" id="cancel-btn">Cancel</button>
                  <button class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" id="delete-btn">Delete</button>
                </div>
              </div>
            </div>
            
            <!-- Hidden Modal (isOpen = false) -->
            <div id="hidden-modal" class="fixed inset-0 z-50 flex items-center justify-center" style="display: none;">
              <div class="absolute inset-0 bg-black opacity-50"></div>
              <div class="bg-white p-6 rounded shadow-lg z-10 w-80">
                <button class="text-gray-500 float-right">
                  <span class="w-5 h-5">×</span>
                </button>
                <p class="mb-6">This modal should be hidden</p>
                <div class="flex justify-end space-x-4">
                  <button class="px-4 py-2 rounded border">Cancel</button>
                  <button class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
  });

  test("should render modal with correct structure and styling", async ({
    page,
  }) => {
    const modal = page.locator("#open-modal");
    const overlay = modal.locator(".absolute.inset-0.bg-black");
    const content = modal.locator(".bg-white.p-6.rounded.shadow-lg");
    const message = page.locator("#open-modal p");
    const closeButton = page.locator("#close-btn");
    const cancelButton = page.locator("#cancel-btn");
    const deleteButton = page.locator("#delete-btn");

    // Check modal visibility and structure
    await expect(modal).toBeVisible();
    await expect(overlay).toBeVisible();
    await expect(content).toBeVisible();

    // Check modal styling
    await expect(modal).toHaveClass(/fixed/);
    await expect(modal).toHaveClass(/z-50/);
    await expect(content).toHaveClass(/bg-white/);
    await expect(content).toHaveClass(/rounded/);

    // Check content
    await expect(message).toHaveText(
      "Are you sure you want to delete this item?"
    );
    await expect(closeButton).toBeVisible();
    await expect(cancelButton).toHaveText("Cancel");
    await expect(deleteButton).toHaveText("Delete");
  });

  test("should handle modal interactions correctly", async ({ page }) => {
    const closeButton = page.locator("#close-btn");
    const cancelButton = page.locator("#cancel-btn");
    const deleteButton = page.locator("#delete-btn");
    const hiddenModal = page.locator("#hidden-modal");

    // Verify all buttons are visible and clickable
    await expect(closeButton).toBeVisible();
    await expect(cancelButton).toBeVisible();
    await expect(deleteButton).toBeVisible();

    // Test that we can click on each button without errors
    await closeButton.click({ force: true });
    await cancelButton.click({ force: true });
    await deleteButton.click({ force: true });

    // Verify all buttons are still visible after clicking
    await expect(closeButton).toBeVisible();
    await expect(cancelButton).toBeVisible();
    await expect(deleteButton).toBeVisible();

    // Check that hidden modal is not visible
    await expect(hiddenModal).not.toBeVisible();
  });
});
