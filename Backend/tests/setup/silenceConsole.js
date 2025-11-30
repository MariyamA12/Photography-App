// tests/setup/silenceConsole.js
const noop = () => {};
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(noop);
  jest.spyOn(console, 'warn').mockImplementation(noop);
});
afterAll(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
});
