import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppContent from '@/App';

const mocks = vi.hoisted(() => ({
  refetch: vi.fn(),
  useAuthStatus: vi.fn()
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuthStatus: mocks.useAuthStatus
}));

describe('App auth bootstrap', () => {
  beforeEach(() => {
    mocks.refetch.mockReset();
    mocks.useAuthStatus.mockReset();
  });

  it('shows an actionable error state instead of staying blank when auth bootstrap fails', async () => {
    const user = userEvent.setup();
    mocks.useAuthStatus.mockReturnValue({
      isLoading: false,
      isError: true,
      isRefetching: false,
      error: new Error('Timed out waiting for remote request response after 5000ms: GET /api/auth/status'),
      refetch: mocks.refetch,
      data: undefined
    });

    render(<AppContent />);

    expect(screen.getByRole('heading', { name: /load authentication status/i })).toBeTruthy();
    expect(screen.getByText('Timed out waiting for remote request response after 5000ms: GET /api/auth/status')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });
});
