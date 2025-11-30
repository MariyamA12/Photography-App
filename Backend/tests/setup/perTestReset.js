// tests/setup/perTestReset.js
// If we're running "mocked" tests (no DB), skip any DB resets.
if (process.env.MOCK_DB === 'true') {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });
} else {
  // Your existing DB reset logic can stay here OR be minimal:
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });
}
