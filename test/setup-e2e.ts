import 'reflect-metadata';

// Global test timeout for e2e tests
jest.setTimeout(60000);

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global cleanup to help with native module handles
afterAll(async () => {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  // Small delay to allow cleanup
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Additional cleanup for any remaining timers
  jest.clearAllTimers();
  jest.useRealTimers();
});
