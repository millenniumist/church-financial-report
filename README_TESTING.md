# Testing Setup - Full TDD Coverage

## ✅ Setup Complete!

Your project now has comprehensive Jest testing infrastructure with full TDD support.

## 📊 Test Results

```
PASS __tests__/lib/adminSettings.test.js
PASS __tests__/components/PageWrapper.test.jsx

Test Suites: 2 passed, 2 total
Tests:       4 passed, 4 total
```

## 🚀 Quick Start

### Run Tests

```bash
# Run all tests
npm test

# Watch mode (recommended for TDD)
npm run test:watch

# Coverage report
npm run test:coverage
```

### TDD Workflow

1. **Write a failing test** (Red)
2. **Make it pass** (Green)
3. **Refactor** (Blue)

See `docs/TDD_GUIDE.md` for detailed workflow and best practices.

## 📁 Project Structure

```
__tests__/
├── components/          # Component tests
│   └── PageWrapper.test.jsx
├── lib/                 # Business logic tests
│   └── adminSettings.test.js
├── api/                 # API route tests (examples removed)
├── utils/               # Test utilities
│   └── test-helpers.js
└── mocks/               # Mock implementations
    ├── prisma.js
    ├── cloudinary.js
    └── next.js
```

## 🎯 Coverage Thresholds

### Global (70%)
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### Library Code (80% - stricter)
- `/lib/**/*.{js,jsx,ts,tsx}`: 80% across all metrics
- Business logic requires higher coverage

## 🛠️ What's Included

### Jest Configuration
- ✅ Next.js integration with `next/jest`
- ✅ React Testing Library setup
- ✅ Coverage thresholds (70% global, 80% lib)
- ✅ Watch mode with typeahead plugins
- ✅ Automatic mock clearing
- ✅ Proper environment setup

### Test Utilities (`__tests__/utils/test-helpers.js`)
- `renderWithProviders()` - Custom render with providers
- `mockFetch()` - Mock fetch responses
- `mockFetchError()` - Mock network errors
- `createMockRouter()` - Mock Next.js router
- `factories` - Test data factories (mission, project, financialRecord)
- `mockEnv()` - Mock environment variables

### Mock Handlers
- **Prisma Mock** (`__tests__/mocks/prisma.js`)
  - Deep mock of Prisma client
  - Helper functions for common operations
  - Automatic reset between tests

- **Cloudinary Mock** (`__tests__/mocks/cloudinary.js`)
  - Mock image uploads
  - Mock upload streams
  - Test-friendly responses

- **Next.js Mocks** (`__tests__/mocks/next.js`)
  - Mock `next/navigation` (useRouter, usePathname, etc.)
  - Mock `next/headers` (cookies, headers)
  - Mock `next/image` and `next/link`

### Global Setup (`jest.setup.js`)
- Testing Library Jest DOM matchers
- Environment variables for tests
- ResizeObserver and IntersectionObserver mocks
- matchMedia mock for responsive tests
- ScrollTo mock
- Console error filtering

## 📚 Documentation

### Complete TDD Guide
See **`docs/TDD_GUIDE.md`** for:
- TDD workflow (Red-Green-Refactor)
- Writing effective tests
- Test organization patterns
- Common testing patterns
- Best practices
- Debugging tips
- Quick reference

## 🧪 Example Tests

### Component Test
```javascript
describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Library Function Test
```javascript
describe('calculateTotal', () => {
  it('sums array of numbers', () => {
    expect(calculateTotal([10, 20, 30])).toBe(60);
  });
});
```

### API Route Test (Pattern)
```javascript
describe('POST /api/endpoint', () => {
  it('creates resource', async () => {
    const request = new NextRequest('http://localhost/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const { POST } = await import('@/app/api/endpoint/route');
    const response = await POST(request);

    expect(response.status).toBe(201);
  });
});
```

## 🔧 Configuration Files

### `jest.config.js`
- Complete Jest configuration
- Next.js integration
- Coverage collection rules
- Threshold enforcement
- Watch mode plugins

### `jest.setup.js`
- Global test setup
- DOM mocks
- Environment variables
- Console filtering

### `package.json` Scripts
```json
{
  "test": "jest --passWithNoTests",
  "test:watch": "npm test -- --watch",
  "test:coverage": "npm test -- --coverage"
}
```

## 💡 Tips for Success

### Write Tests First (TDD)
1. Write a failing test that describes the feature
2. Write minimal code to make it pass
3. Refactor while keeping tests green

### Use Watch Mode
```bash
npm run test:watch
```
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `p` to filter by filename
- Press `t` to filter by test name

### Check Coverage Regularly
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Test Behavior, Not Implementation
✅ Test what the component does
❌ Don't test how it does it

### Mock External Dependencies
- Use mocks from `__tests__/mocks/`
- Keep tests fast and isolated
- Avoid network calls in tests

## 🎨 Best Practices

1. **One assertion per test** (when possible)
2. **Descriptive test names** - Explain what is being tested
3. **AAA pattern** - Arrange, Act, Assert
4. **Test edge cases** - Null, empty, error states
5. **Clean up** - Use beforeEach/afterEach
6. **Use factories** - For test data generation
7. **Avoid implementation details** - Test behavior

## 📦 Installed Packages

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/dom": "^10.4.0",
    "@testing-library/user-event": "^14.6.1",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "jest-watch-typeahead": "^2.2.2",
    "jest-mock-extended": "latest"
  }
}
```

## 🚦 Next Steps

1. **Start writing tests for new features** following TDD
2. **Add tests for existing code** to reach coverage goals
3. **Run tests before commits** to catch regressions
4. **Review the TDD Guide** in `docs/TDD_GUIDE.md`
5. **Use test utilities** from `__tests__/utils/test-helpers.js`

## 🎯 Coverage Goals

- **Short term**: Reach 70% global coverage
- **Medium term**: Reach 80% lib coverage
- **Long term**: Maintain high coverage as project grows

## 🆘 Need Help?

- Read `docs/TDD_GUIDE.md` for detailed guidance
- Check existing tests in `__tests__/` for examples
- Use `screen.debug()` to inspect rendered output
- Run tests with `--verbose` for detailed output

---

**Remember**: Tests are documentation, safety nets, and design tools. Write them first! 🔄
