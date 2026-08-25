// src/setupTests.js
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock any modules that might cause issues in tests
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    // You can add custom mocks here if needed
  };
});

// Mock redux-persist
vi.mock('redux-persist/integration/react', () => ({
  PersistGate: ({ children }) => children,
}));

// Mock store if needed
vi.mock('./store/store', () => ({
  store: {
    getState: () => ({}),
    subscribe: () => () => {},
    dispatch: () => {},
  },
  persistor: {
    persist: () => {},
    purge: () => {},
    flush: () => Promise.resolve(),
  },
}));