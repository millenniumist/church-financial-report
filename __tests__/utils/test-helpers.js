/**
 * Test Utilities and Helpers
 * Common patterns for testing React components and Next.js features
 */

import { render } from '@testing-library/react';

/**
 * Custom render with providers
 * Use this when your component needs providers
 */
export function renderWithProviders(ui, options = {}) {
  const {
    ...renderOptions
  } = options;

  function Wrapper({ children }) {
    return children;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Wait for async updates
 */
export const waitFor = (callback, options) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      callback();
      resolve();
    }, options?.timeout || 0);
  });
};

/**
 * Mock Next.js router
 */
export function createMockRouter(overrides = {}) {
  return {
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
    ...overrides,
  };
}

/**
 * Mock fetch responses
 */
export function mockFetch(data, options = {}) {
  const { status = 200, ok = true } = options;

  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data),
    })
  );
}

/**
 * Mock fetch error
 */
export function mockFetchError(error = 'Network error') {
  global.fetch = jest.fn(() => Promise.reject(new Error(error)));
}

/**
 * Create mock API response
 */
export function createMockApiResponse(data, status = 200) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  };
}

/**
 * Suppress console errors during tests (useful for expected errors)
 */
export function suppressConsoleError(callback) {
  const originalError = console.error;
  console.error = jest.fn();

  try {
    callback();
  } finally {
    console.error = originalError;
  }
}

/**
 * Test data factories
 */
export const factories = {
  mission: (overrides = {}) => ({
    id: 'test-mission-1',
    slug: 'test-mission',
    title: { th: 'ทดสอบพันธกิจ', en: 'Test Mission' },
    theme: { th: 'ธีม', en: 'Theme' },
    summary: { th: 'สรุป', en: 'Summary' },
    description: { th: 'รายละเอียด', en: 'Description' },
    focusAreas: ['Area 1', 'Area 2'],
    scripture: { text: 'Test verse', reference: 'Test 1:1' },
    nextSteps: { th: 'ก้าวต่อไป', en: 'Next Steps' },
    pinned: false,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  project: (overrides = {}) => ({
    id: 'test-project-1',
    name: 'Test Project',
    description: 'Test project description',
    targetAmount: 10000,
    currentAmount: 5000,
    priority: 1,
    isActive: true,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  financialRecord: (overrides = {}) => ({
    id: 'test-record-1',
    date: new Date(),
    income: 10000,
    expenses: 5000,
    balance: 5000,
    incomeDetails: [{ category: 'Tithes', amount: 10000 }],
    expenseDetails: [{ category: 'Rent', amount: 5000 }],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};

/**
 * Mock environment variables
 */
export function mockEnv(vars) {
  const original = { ...process.env };
  Object.assign(process.env, vars);
  return () => {
    process.env = original;
  };
}
