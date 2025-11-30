const { test, expect } = require("@playwright/test");

test.describe("UI Components Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Create a test page that simulates a real application with multiple components
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>UI Components Integration Test</title>
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
          <div id="app" class="min-h-screen bg-gray-50">
            <!-- Header with navigation -->
            <header class="bg-white shadow-sm border-b">
              <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                  <h1 class="text-xl font-semibold text-gray-900">Test Application</h1>
                  <nav class="flex space-x-4">
                    <button id="nav-btn-1" class="flex items-center justify-center px-4 py-2 rounded font-semibold focus:outline-none bg-blue-600 hover:bg-blue-700 text-white">
                      Dashboard
                    </button>
                    <button id="nav-btn-2" class="flex items-center justify-center px-4 py-2 rounded font-semibold focus:outline-none bg-gray-600 hover:bg-gray-700 text-white">
                      Settings
                    </button>
                  </nav>
                </div>
              </div>
            </header>

            <!-- Main content area -->
            <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <!-- Action buttons -->
              <div id="actions-section" class="mb-8">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Action Buttons</h2>
                <div class="flex space-x-4">
                  <button id="primary-btn" class="flex items-center justify-center px-4 py-2 rounded font-semibold focus:outline-none bg-blue-600 hover:bg-blue-700 text-white">
                    Primary Action
                  </button>
                  <button id="secondary-btn" class="flex items-center justify-center px-4 py-2 rounded font-semibold focus:outline-none bg-gray-600 hover:bg-gray-700 text-white">
                    Secondary Action
                  </button>
                  <button id="disabled-btn" class="flex items-center justify-center px-4 py-2 rounded font-semibold focus:outline-none bg-blue-600 hover:bg-blue-700 text-white opacity-50 cursor-not-allowed" disabled>
                    Disabled Action
                  </button>
                </div>
              </div>

              <!-- Toast notifications -->
              <div id="toast-section" class="mb-8">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Toast Notifications</h2>
                <div class="flex space-x-4">
                  <button id="show-success-toast" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Show Success</button>
                  <button id="show-error-toast" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Show Error</button>
                </div>
                
                <!-- Toast containers -->
                <div id="success-toast" class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none" style="display: none;">
                  <div class="bg-green-100 text-green-800 pointer-events-auto px-4 py-2 rounded shadow-lg">
                    Success! Your action was completed successfully.
                  </div>
                </div>
                
                <div id="error-toast" class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none" style="display: none;">
                  <div class="bg-red-100 text-red-800 pointer-events-auto px-4 py-2 rounded shadow-lg">
                    Error! Something went wrong. Please try again.
                  </div>
                </div>
              </div>

              <!-- Modal section -->
              <div id="modal-section" class="mb-8">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Confirmation Modals</h2>
                <div class="flex space-x-4">
                  <button id="show-delete-modal" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete Item</button>
                </div>
                
                <!-- Delete confirmation modal -->
                <div id="delete-modal" class="fixed inset-0 z-50 flex items-center justify-center" style="display: none;">
                  <div class="absolute inset-0 bg-black opacity-50"></div>
                  <div class="bg-white p-6 rounded shadow-lg z-10 w-80">
                    <button class="text-gray-500 float-right">×</button>
                    <p class="mb-6">Are you sure you want to delete this item? This action cannot be undone.</p>
                    <div class="flex justify-end space-x-4">
                      <button class="px-4 py-2 rounded border">Cancel</button>
                      <button class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>

          <script>
            // Simple JavaScript to handle toast and modal interactions
            document.getElementById('show-success-toast').addEventListener('click', () => {
              document.getElementById('success-toast').style.display = 'block';
              setTimeout(() => {
                document.getElementById('success-toast').style.display = 'none';
              }, 3000);
            });
            
            document.getElementById('show-error-toast').addEventListener('click', () => {
              document.getElementById('error-toast').style.display = 'block';
              setTimeout(() => {
                document.getElementById('error-toast').style.display = 'none';
              }, 3000);
            });
            
            document.getElementById('show-delete-modal').addEventListener('click', () => {
              document.getElementById('delete-modal').style.display = 'flex';
            });
            
            // Close modals when clicking outside or on close button
            document.querySelectorAll('#delete-modal').forEach(modal => {
              modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.textContent === '×') {
                  modal.style.display = 'none';
                }
              });
            });
          </script>
        </body>
      </html>
    `);
  });

  test("should render all components correctly", async ({ page }) => {
    // Check header
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("h1")).toHaveText("Test Application");

    // Check navigation buttons
    await expect(page.locator("#nav-btn-1")).toHaveText("Dashboard");
    await expect(page.locator("#nav-btn-2")).toHaveText("Settings");

    // Check action buttons
    await expect(page.locator("#primary-btn")).toHaveText("Primary Action");
    await expect(page.locator("#secondary-btn")).toHaveText("Secondary Action");
    await expect(page.locator("#disabled-btn")).toHaveText("Disabled Action");
    await expect(page.locator("#disabled-btn")).toBeDisabled();

    // Check section headers
    await expect(page.locator("#actions-section h2")).toHaveText(
      "Action Buttons"
    );
    await expect(page.locator("#toast-section h2")).toHaveText(
      "Toast Notifications"
    );
    await expect(page.locator("#modal-section h2")).toHaveText(
      "Confirmation Modals"
    );
  });

  test("should handle component interactions", async ({ page }) => {
    // Test toast interactions
    await page.locator("#show-success-toast").click();
    const successToast = page.locator("#success-toast");
    await expect(successToast).toBeVisible();
    await expect(successToast).toHaveText(
      "Success! Your action was completed successfully."
    );

    await page.locator("#show-error-toast").click();
    const errorToast = page.locator("#error-toast");
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toHaveText(
      "Error! Something went wrong. Please try again."
    );

    // Test modal interactions
    await page.locator("#show-delete-modal").click();
    const deleteModal = page.locator("#delete-modal");
    await expect(deleteModal).toBeVisible();
    await expect(deleteModal).toContainText(
      "Are you sure you want to delete this item? This action cannot be undone."
    );

    // Close modal
    await deleteModal.locator('button:has-text("×")').click();
    await expect(deleteModal).not.toBeVisible();
  });
});
