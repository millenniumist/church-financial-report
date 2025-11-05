# Test-Driven Development (TDD) Guide

## 📋 Table of Contents
- [Introduction](#introduction)
- [TDD Workflow](#tdd-workflow)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Structure](#test-structure)
- [Coverage Requirements](#coverage-requirements)
- [Best Practices](#best-practices)

## Introduction

This project uses **Test-Driven Development (TDD)** with Jest and React Testing Library. TDD helps us write better code by:
- Writing tests before implementation
- Ensuring code meets requirements
- Preventing regressions
- Improving code design
- Providing documentation through tests

## TDD Workflow

### The Red-Green-Refactor Cycle

1. **🔴 RED**: Write a failing test
   - Write a test that describes what you want to build
   - Run the test and watch it fail (this confirms the test works)

2. **🟢 GREEN**: Make it pass
   - Write the minimal code to make the test pass
   - Don't worry about perfection yet

3. **🔵 REFACTOR**: Clean it up
   - Improve the code while keeping tests green
   - Remove duplication
   - Improve naming and structure

### Example TDD Workflow

```bash
# 1. Write a failing test
npm test -- ImageCarousel.test.jsx

# 2. Implement the feature
# Edit: components/ImageCarousel.js

# 3. Run tests again - should pass
npm test -- ImageCarousel.test.jsx

# 4. Refactor if needed
# Tests keep you safe while refactoring

# 5. Check coverage
npm run test:coverage
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended for TDD)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- ImageCarousel.test.jsx

# Run tests matching a pattern
npm test -- api/admin

# Run tests in a specific folder
npm test -- __tests__/components
```

### Watch Mode Commands

When in watch mode, press:
- `a` - run all tests
- `f` - run only failed tests
- `p` - filter by filename pattern
- `t` - filter by test name pattern
- `q` - quit watch mode

## Writing Tests

### Test File Location

Place test files in `__tests__` directory:

```
__tests__/
├── components/          # Component tests
│   └── ImageCarousel.test.jsx
├── api/                 # API route tests
│   └── admin/
│       └── missions.test.js
├── lib/                 # Library/utility tests
│   └── financial.test.js
├── utils/               # Test utilities
│   └── test-helpers.js
└── mocks/               # Mock implementations
    ├── prisma.js
    ├── cloudinary.js
    └── next.js
```

### Test Structure

Use the **AAA pattern**: Arrange, Act, Assert

```javascript
describe('ComponentName', () => {
  describe('Feature/Behavior', () => {
    it('should do something specific', () => {
      // Arrange - Setup test data and dependencies
      const mockData = { ... };

      // Act - Execute the code being tested
      const result = myFunction(mockData);

      // Assert - Verify the result
      expect(result).toBe(expected);
    });
  });
});
```

### Component Tests

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### API Route Tests

```javascript
import { NextRequest } from 'next/server';

describe('POST /api/admin/missions', () => {
  it('creates a new mission', async () => {
    // Mock dependencies
    verifyAdminAuth.mockResolvedValue(true);
    prisma.mission.create.mockResolvedValue(mockMission);

    // Create request
    const request = new NextRequest('http://localhost/api/admin/missions', {
      method: 'POST',
      body: JSON.stringify(missionData),
    });

    // Call handler
    const { POST } = await import('@/app/api/admin/missions/route');
    const response = await POST(request);

    // Assertions
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toEqual(mockMission);
  });
});
```

### Library Function Tests

```javascript
import { calculateTotal } from '@/lib/calculations';

describe('calculateTotal', () => {
  it('sums array of numbers', () => {
    const numbers = [10, 20, 30];
    expect(calculateTotal(numbers)).toBe(60);
  });

  it('handles empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('ignores non-numeric values', () => {
    const mixed = [10, 'invalid', 20, null, 30];
    expect(calculateTotal(mixed)).toBe(60);
  });
});
```

## Test Structure

### Test Organization

```javascript
describe('ComponentName', () => {
  // Setup/teardown
  beforeEach(() => {
    // Run before each test
  });

  afterEach(() => {
    // Run after each test
  });

  // Group related tests
  describe('Rendering', () => {
    it('renders basic content', () => { ... });
    it('renders with props', () => { ... });
  });

  describe('User Interaction', () => {
    it('handles click', () => { ... });
    it('handles form submission', () => { ... });
  });

  describe('Edge Cases', () => {
    it('handles null data', () => { ... });
    it('handles error state', () => { ... });
  });
});
```

### Test Naming

Use descriptive test names that explain the behavior:

✅ Good:
```javascript
it('displays error message when API call fails')
it('disables submit button while form is submitting')
it('navigates to mission details page when card is clicked')
```

❌ Bad:
```javascript
it('works')
it('test1')
it('button click')
```

## Coverage Requirements

### Coverage Thresholds

- **Global**: 70% coverage (branches, functions, lines, statements)
- **Library (`/lib`)**: 80% coverage (stricter for business logic)

### Checking Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Coverage Report Explanation

```
----------|---------|----------|---------|---------|
File      | % Stmts | % Branch | % Funcs | % Lines |
----------|---------|----------|---------|---------|
All files |   75.5  |   70.2   |   80.1  |   75.8  |
----------|---------|----------|---------|---------|
```

- **Statements**: Individual instructions
- **Branches**: if/else, switch, ternary
- **Functions**: Function definitions
- **Lines**: Lines of code

## Best Practices

### 1. Write Tests First (TDD)

```javascript
// 1. Write the test (it will fail)
it('calculates discount correctly', () => {
  expect(calculateDiscount(100, 0.2)).toBe(20);
});

// 2. Implement the function
function calculateDiscount(price, rate) {
  return price * rate;
}

// 3. Test passes ✓
```

### 2. One Assertion Per Test

✅ Good:
```javascript
it('sets user name', () => {
  const user = createUser({ name: 'John' });
  expect(user.name).toBe('John');
});

it('sets default role', () => {
  const user = createUser();
  expect(user.role).toBe('user');
});
```

❌ Bad:
```javascript
it('creates user', () => {
  const user = createUser({ name: 'John' });
  expect(user.name).toBe('John');
  expect(user.role).toBe('user');
  expect(user.active).toBe(true);
});
```

### 3. Test Behavior, Not Implementation

✅ Good (tests behavior):
```javascript
it('displays filtered missions', () => {
  render(<MissionList filter="pinned" />);
  expect(screen.getAllByRole('article')).toHaveLength(2);
});
```

❌ Bad (tests implementation):
```javascript
it('calls filter function', () => {
  const spy = jest.spyOn(utils, 'filterMissions');
  render(<MissionList filter="pinned" />);
  expect(spy).toHaveBeenCalled();
});
```

### 4. Use Test Utilities

```javascript
import { factories, mockFetch } from '@/__tests__/utils/test-helpers';

it('displays mission data', () => {
  const mission = factories.mission({ title: 'Test' });
  mockFetch(mission);

  render(<MissionCard id="1" />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### 5. Mock External Dependencies

```javascript
// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    mission: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));
```

### 6. Test Error Cases

```javascript
describe('API error handling', () => {
  it('displays error message on network failure', async () => {
    mockFetchError('Network error');

    render(<MissionList />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### 7. Clean Up After Tests

```javascript
describe('MyComponent', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  // Tests...
});
```

## Common Testing Patterns

### Testing Async Code

```javascript
it('loads data asynchronously', async () => {
  render(<DataComponent />);

  // Wait for element to appear
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### Testing Forms

```javascript
it('submits form with valid data', async () => {
  const handleSubmit = jest.fn();
  render(<MyForm onSubmit={handleSubmit} />);

  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'John' },
  });

  fireEvent.click(screen.getByText('Submit'));

  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith({ name: 'John' });
  });
});
```

### Testing Loading States

```javascript
it('shows loading spinner while fetching', () => {
  render(<DataComponent />);
  expect(screen.getByTestId('loading')).toBeInTheDocument();
});

it('hides loading spinner after data loads', async () => {
  render(<DataComponent />);

  await waitFor(() => {
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });
});
```

## Debugging Tests

### Using `screen.debug()`

```javascript
it('renders something', () => {
  render(<MyComponent />);
  screen.debug(); // Prints the DOM
});
```

### Using `screen.logTestingPlaygroundURL()`

```javascript
it('interactive debugging', () => {
  render(<MyComponent />);
  screen.logTestingPlaygroundURL(); // Opens interactive query builder
});
```

### Running Single Test

```javascript
// Use .only to run just this test
it.only('focused test', () => {
  // ...
});

// Use .skip to skip this test
it.skip('skipped test', () => {
  // ...
});
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [TDD Principles](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

## Quick Reference

```bash
# Essential commands
npm test                    # Run tests once
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report

# Test specific files
npm test -- MyComponent     # By name
npm test -- api/admin       # By path
npm test -- --testNamePattern="renders correctly"  # By test name

# Debug
npm test -- --verbose       # Detailed output
npm test -- --detectOpenHandles  # Find async issues
```

---

**Remember**: Write tests, make them pass, refactor. Repeat. 🔄
