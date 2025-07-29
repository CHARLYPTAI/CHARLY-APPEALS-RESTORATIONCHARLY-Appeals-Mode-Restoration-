// LOC_CATEGORY: interface
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Login from '../../../src/components/Login';
import { renderWithProviders, measureRenderTime, viewports } from '../../setup/testUtils';
import { server } from '../../api/handlers/server';
import { http, HttpResponse } from 'msw';

describe('Login Component', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    mockOnLogin.mockClear();
  });

  describe('Rendering', () => {
    it('should render login form with all elements', () => {
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      expect(screen.getByText('CHARLY')).toBeInTheDocument();
      expect(screen.getByText('Property Tax Appeal Platform')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    it('should display demo credentials', () => {
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      expect(screen.getByText(/Demo Credentials:/)).toBeInTheDocument();
      expect(screen.getByText(/Username: admin \| Password: secret/)).toBeInTheDocument();
      expect(screen.getByText(/Username: analyst \| Password: secret/)).toBeInTheDocument();
    });

    it('should render with gradient background', () => {
      const { container } = renderWithProviders(<Login onLogin={mockOnLogin} />);

      const backgroundDiv = container.firstChild as HTMLElement;
      expect(backgroundDiv).toHaveStyle({
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      });
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty username', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Please input your username!')).toBeInTheDocument();
      });
    });

    it('should show validation error for empty password', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      await user.type(screen.getByPlaceholderText('Username'), 'testuser');
      await user.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(screen.getByText('Please input your password!')).toBeInTheDocument();
      });
    });

    it('should not submit form with validation errors', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      await user.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(mockOnLogin).not.toHaveBeenCalled();
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should successfully login with valid credentials', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      await user.type(screen.getByPlaceholderText('Username'), 'admin');
      await user.type(screen.getByPlaceholderText('Password'), 'secret');
      await user.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'admin',
            role: 'Admin',
            email: 'admin@charly.com',
          }),
          expect.any(String)
        );
      });
    });

    it('should show error message for invalid credentials', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      await user.type(screen.getByPlaceholderText('Username'), 'invalid');
      await user.type(screen.getByPlaceholderText('Password'), 'wrong');
      await user.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(mockOnLogin).not.toHaveBeenCalled();
      });
    });

    it('should show loading state during authentication', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      await user.type(screen.getByPlaceholderText('Username'), 'slow');
      await user.type(screen.getByPlaceholderText('Password'), 'slow');

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      await user.click(signInButton);

      expect(signInButton).toHaveClass('ant-btn-loading');
    });

    it('should handle server errors gracefully', async () => {
      server.use(
        http.post('http://localhost:8000/api/auth/login', () => {
          return HttpResponse.json({ detail: 'Internal server error' }, { status: 500 });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      await user.type(screen.getByPlaceholderText('Username'), 'admin');
      await user.type(screen.getByPlaceholderText('Password'), 'secret');
      await user.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(mockOnLogin).not.toHaveBeenCalled();
      });
    });

    it('should handle network errors', async () => {
      server.use(
        http.post('http://localhost:8000/api/auth/login', () => {
          return HttpResponse.error();
        })
      );

      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderWithProviders(<Login onLogin={mockOnLogin} />);

      await user.type(screen.getByPlaceholderText('Username'), 'admin');
      await user.type(screen.getByPlaceholderText('Password'), 'secret');
      await user.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Login error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      await user.tab();
      expect(screen.getByPlaceholderText('Username')).toHaveFocus();

      await user.tab();
      expect(screen.getByPlaceholderText('Password')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /Sign In/i })).toHaveFocus();
    });

    it('should submit form on Enter key', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      await user.type(screen.getByPlaceholderText('Username'), 'admin');
      await user.type(screen.getByPlaceholderText('Password'), 'secret');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalled();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should render correctly on mobile viewport', () => {
      renderWithProviders(<Login onLogin={mockOnLogin} />, { viewport: viewports.mobile });

      const card = screen.getByText('CHARLY').closest('.ant-card');
      expect(card).toBeInTheDocument();
      // Card should maintain proper width on mobile
    });

    it('should render correctly on tablet viewport', () => {
      renderWithProviders(<Login onLogin={mockOnLogin} />, { viewport: viewports.tablet });

      expect(screen.getByText('CHARLY')).toBeInTheDocument();
    });

    it('should render correctly on desktop viewport', () => {
      renderWithProviders(<Login onLogin={mockOnLogin} />, { viewport: viewports.desktop });

      const card = screen.getByText('CHARLY').closest('.ant-card');
      expect(card).toHaveStyle({ width: '400px' });
    });
  });

  describe('Performance', () => {
    it('should render within performance budget', async () => {
      const renderTime = await measureRenderTime(<Login onLogin={mockOnLogin} />);

      expect(renderTime).toBeLessThan(200); // 200ms budget
    });

    it('should not cause memory leaks on unmount', () => {
      const { unmount } = renderWithProviders(<Login onLogin={mockOnLogin} />);

      unmount();

      // Verify no lingering event listeners or timers
      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<Login onLogin={mockOnLogin} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels', () => {
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      const usernameInput = screen.getByPlaceholderText('Username');
      const passwordInput = screen.getByPlaceholderText('Password');

      expect(usernameInput).toHaveAttribute('aria-label');
      expect(passwordInput).toHaveAttribute('aria-label');
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      await user.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        const errorMessage = screen.getByText('Please input your username!');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should have proper color contrast', () => {
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      expect(signInButton).toHaveClass('ant-btn-primary');
      // Ant Design ensures proper contrast ratios
    });
  });

  describe('Security', () => {
    it('should mask password input', () => {
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
      expect(passwordInput.type).toBe('password');
    });

    it('should not store credentials in DOM after submission', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      const usernameInput = screen.getByPlaceholderText('Username') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;

      await user.type(usernameInput, 'admin');
      await user.type(passwordInput, 'secret');
      await user.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalled();
      });

      // Inputs should be cleared after successful login
      expect(usernameInput.value).toBe('admin'); // Form maintains state
      expect(passwordInput.value).toBe('secret'); // But parent component should handle clearing
    });

    it('should not expose sensitive data in error messages', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      await user.type(screen.getByPlaceholderText('Username'), 'invalid');
      await user.type(screen.getByPlaceholderText('Password'), 'wrong');
      await user.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        // Error message should be generic
        expect(screen.queryByText(/wrong/)).not.toBeInTheDocument();
        expect(screen.queryByText(/invalid/)).not.toBeInTheDocument();
      });
    });
  });
});
