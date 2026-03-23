import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from '@/components/layout/Sidebar';

const mocks = vi.hoisted(() => ({
  openAccountPanel: vi.fn(),
  docOpen: vi.fn(),
  remoteStatus: {
    data: {
      account: {
        loggedIn: true,
        email: 'user@example.com'
      }
    }
  }
}));

vi.mock('@/components/doc-browser', () => ({
  useDocBrowser: () => ({
    open: mocks.docOpen
  })
}));

vi.mock('@/presenter/app-presenter-context', () => ({
  useAppPresenter: () => ({
    accountManager: {
      openAccountPanel: mocks.openAccountPanel
    }
  })
}));

vi.mock('@/hooks/useRemoteAccess', () => ({
  useRemoteStatus: () => mocks.remoteStatus
}));

vi.mock('@/components/providers/I18nProvider', () => ({
  useI18n: () => ({
    language: 'en',
    setLanguage: vi.fn()
  })
}));

vi.mock('@/components/providers/ThemeProvider', () => ({
  useTheme: () => ({
    theme: 'warm',
    setTheme: vi.fn()
  })
}));

describe('Sidebar', () => {
  it('keeps the settings sidebar bounded and lets the navigation scroll independently', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/model']}>
        <Sidebar mode="settings" />
      </MemoryRouter>
    );

    const aside = container.querySelector('aside');
    const nav = container.querySelector('nav');

    expect(aside?.className).toContain('min-h-0');
    expect(aside?.className).toContain('overflow-hidden');
    expect(nav?.className).toContain('flex-1');
    expect(nav?.className).toContain('min-h-0');
    expect(nav?.className).toContain('overflow-y-auto');
  });

  it('uses a compact single-row header for settings mode', () => {
    render(
      <MemoryRouter initialEntries={['/model']}>
        <Sidebar mode="settings" />
      </MemoryRouter>
    );

    const header = screen.getByTestId('settings-sidebar-header');

    expect(header).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to Main' })).toBeTruthy();
    expect(header.className).not.toContain('bg-white');
    expect(header.className).not.toContain('rounded-2xl');
  });

  it('renders the account entry with the same neutral visual tone as other footer items', () => {
    render(
      <MemoryRouter initialEntries={['/model']}>
        <Sidebar mode="settings" />
      </MemoryRouter>
    );

    const accountEntry = screen.getByTestId('settings-sidebar-account-entry');

    expect(accountEntry).toBeTruthy();
    expect(screen.getByText('Account and Device Entry')).toBeTruthy();
    expect(screen.getByText('user@example.com')).toBeTruthy();
    expect(accountEntry.className).toContain('text-gray-600');
  });
});
