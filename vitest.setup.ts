import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock crypto for tests
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomBytes: (size: number) => ({
      toString: (encoding: string) => 'a'.repeat(size * 2),
    }),
    createHash: (algo: string) => ({
      update: () => ({
        digest: (encoding: string) => Buffer.from('a'.repeat(64), 'hex'),
      }),
    }),
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2),
  },
});
