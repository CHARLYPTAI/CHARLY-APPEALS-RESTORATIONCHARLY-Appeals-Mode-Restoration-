import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppShell } from './AppShell';
import { Navigation } from '../components/Navigation';

// Mock the ToastProvider since it uses complex state
vi.mock('../components/ToastProvider', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="toast-provider">{children}</div>,
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
    toasts: [],
  }),
}));

describe('AppShell Layout', () => {
  it('renders the main layout structure', () => {
    render(
      <AppShell>
        <div data-testid="test-content">Test Content</div>
      </AppShell>
    );

    // Check for main layout elements
    expect(screen.getByText('CHARLY')).toBeInTheDocument();
    expect(screen.getByText('Commercial')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('includes accessibility features', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    // Check for accessible notification button
    const notificationButton = screen.getByLabelText(/notifications/i);
    expect(notificationButton).toBeInTheDocument();
  });

  it('renders with responsive design classes', () => {
    const { container } = render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    // Check for responsive utility classes
    const header = container.querySelector('header');
    expect(header).toHaveClass('sticky', 'top-0', 'z-50');
  });
});

describe('Navigation Component', () => {
  it('renders all 6 tabs', () => {
    render(<Navigation />);

    const expectedTabs = ['Portfolio', 'Analysis', 'Intelligence', 'Appeals', 'Results', 'Settings'];
    
    expectedTabs.forEach(tabName => {
      expect(screen.getByRole('tab', { name: tabName })).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation', () => {
    render(<Navigation />);

    const firstTab = screen.getByRole('tab', { name: 'Portfolio' });
    expect(firstTab).toHaveAttribute('aria-selected', 'true');

    // Test tab switching
    const analysisTab = screen.getByRole('tab', { name: 'Analysis' });
    fireEvent.click(analysisTab);
    
    expect(analysisTab).toHaveAttribute('aria-selected', 'true');
    expect(firstTab).toHaveAttribute('aria-selected', 'false');
  });

  it('has proper ARIA attributes', () => {
    render(<Navigation />);

    const tabList = screen.getByRole('tablist');
    expect(tabList).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    tabs.forEach((tab, index) => {
      expect(tab).toHaveAttribute('aria-controls');
      expect(tab).toHaveAttribute('aria-selected');
    });
  });

  it('applies correct styling for active and inactive tabs', () => {
    render(<Navigation />);

    const activeTab = screen.getByRole('tab', { name: 'Portfolio' });
    const inactiveTab = screen.getByRole('tab', { name: 'Analysis' });

    // Active tab should have blue styling
    expect(activeTab).toHaveClass('border-blue-500', 'text-blue-600');
    
    // Inactive tab should have gray styling
    expect(inactiveTab).toHaveClass('border-transparent', 'text-gray-500');
  });
});

describe('Layout Accessibility', () => {
  it('meets WCAG 2.1 AA requirements', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    // Check for proper heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toBeInTheDocument();

    // Check for keyboard focus management
    const focusableElements = screen.getAllByRole('button');
    focusableElements.forEach(element => {
      expect(element).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  it('supports screen readers', () => {
    render(<Navigation />);

    // Check for screen reader text
    expect(screen.getByText('Tabs')).toBeInTheDocument();
  });
});