import { act, fireEvent, render, screen } from '@testing-library/react';
import PageWrapper from '@/components/PageWrapper';

jest.mock('@/components/AdminPanel', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }) =>
    isOpen ? (
      <div data-testid="admin-panel">
        Admin Panel
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

describe('PageWrapper', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  function renderWithFooter() {
    return render(
      <PageWrapper>
        <main>Content</main>
        <footer data-testid="secret-footer">Footer</footer>
      </PageWrapper>
    );
  }

  it('opens the admin panel after ten rapid footer taps', () => {
    renderWithFooter();
    const footer = screen.getByTestId('secret-footer');

    for (let i = 0; i < 9; i += 1) {
      fireEvent.click(footer);
    }
    expect(screen.queryByTestId('admin-panel')).toBeNull();

    fireEvent.click(footer);
    expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
  });

  it('resets the tap counter when taps are spaced out beyond the timeout', () => {
    renderWithFooter();
    const footer = screen.getByTestId('secret-footer');

    for (let i = 0; i < 5; i += 1) {
      fireEvent.click(footer);
    }

    act(() => {
      jest.advanceTimersByTime(2001);
    });

    for (let i = 0; i < 9; i += 1) {
      fireEvent.click(footer);
    }

    expect(screen.queryByTestId('admin-panel')).toBeNull();
  });
});
