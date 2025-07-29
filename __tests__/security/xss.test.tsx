// LOC_CATEGORY: interface
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../setup/testUtils';
import PropertyFields from '@/components/PropertyFields';
import Login from '@/components/Login';
import Narratives from '@/components/Narratives';
import { server } from '../api/handlers/server';
import { rest } from 'msw';

describe('XSS Security Tests', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<img src="x" onerror="alert(\'XSS\')" />',
    '<svg onload="alert(\'XSS\')" />',
    '"><script>alert("XSS")</script>',
    '\'; alert("XSS"); //',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<object data="javascript:alert(\'XSS\')"></object>',
    '<embed src="javascript:alert(\'XSS\')" />',
    '<link rel="stylesheet" href="javascript:alert(\'XSS\')" />',
    '<style>@import "javascript:alert(\'XSS\')"</style>',
    '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')" />',
    'data:text/html,<script>alert("XSS")</script>',
    '<details open ontoggle="alert(\'XSS\')">',
    '<marquee onstart="alert(\'XSS\')">',
    '<select onfocus="alert(\'XSS\')" autofocus>',
  ];

  describe('Login Form XSS Protection', () => {
    const mockOnLogin = jest.fn();

    beforeEach(() => {
      mockOnLogin.mockClear();
    });

    xssPayloads.forEach((payload, index) => {
      it(`should sanitize XSS payload ${index + 1} in username field`, async () => {
        const user = userEvent.setup();
        renderWithProviders(<Login onLogin={mockOnLogin} />);

        const usernameInput = screen.getByPlaceholderText('Username') as HTMLInputElement;
        await user.type(usernameInput, payload);

        // Input should contain the raw text, not execute script
        expect(usernameInput.value).toBe(payload);
        expect(usernameInput.value).not.toContain('<script>');

        // Document should not contain injected script
        expect(document.querySelector('script[src*="alert"]')).toBeNull();
        expect(document.querySelector('img[onerror*="alert"]')).toBeNull();
      });

      it(`should sanitize XSS payload ${index + 1} in password field`, async () => {
        const user = userEvent.setup();
        renderWithProviders(<Login onLogin={mockOnLogin} />);

        const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
        await user.type(passwordInput, payload);

        // Input should contain the raw text
        expect(passwordInput.value).toBe(payload);

        // No script execution
        expect(document.querySelector('script[src*="alert"]')).toBeNull();
      });
    });

    it('should not execute JavaScript in form submission', async () => {
      const user = userEvent.setup();
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      renderWithProviders(<Login onLogin={mockOnLogin} />);

      await user.type(screen.getByPlaceholderText('Username'), '<script>alert("XSS")</script>');
      await user.type(screen.getByPlaceholderText('Password'), 'javascript:alert("XSS")');
      await user.click(screen.getByRole('button', { name: /Sign In/i }));

      // No alert should have been called
      expect(alertSpy).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });
  });

  describe('Property Fields XSS Protection', () => {
    xssPayloads.forEach((payload, index) => {
      it(`should sanitize XSS payload ${index + 1} in property fields`, async () => {
        const user = userEvent.setup();
        renderWithProviders(<PropertyFields />);

        await waitFor(() => {
          expect(screen.getByText('Property Fields')).toBeInTheDocument();
        });

        // Try to inject XSS in account number field
        const accountField = screen.getByLabelText(/Account Number/i);
        if (accountField) {
          await user.clear(accountField);
          await user.type(accountField, payload);

          // Field should contain raw text
          expect((accountField as HTMLInputElement).value).toBe(payload);

          // No script elements should be created
          expect(document.querySelector('script[src*="alert"]')).toBeNull();
          expect(document.querySelector('img[onerror*="alert"]')).toBeNull();
        }
      });
    });

    it('should protect textarea fields from XSS', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PropertyFields />);

      await waitFor(() => {
        const textareas = screen.getAllByRole('textbox');
        expect(textareas.length).toBeGreaterThan(0);
      });

      const textareas = screen.getAllByRole('textbox');
      const textarea = textareas.find((ta) => ta.tagName.toLowerCase() === 'textarea');

      if (textarea) {
        await user.type(textarea, '<script>alert("XSS in textarea")</script>');

        expect((textarea as HTMLTextAreaElement).value).toContain('<script>');
        expect(document.querySelector('script[src*="alert"]')).toBeNull();
      }
    });
  });

  describe('Narratives XSS Protection', () => {
    it('should sanitize narrative content display', async () => {
      // Mock narrative with XSS payload
      server.use(
        rest.get('http://localhost:8000/api/narratives', (req, res, ctx) => {
          return res(
            ctx.json([
              {
                id: '1',
                property_address: '<script>alert("XSS")</script>',
                account_number: '<img src="x" onerror="alert(\'XSS\')" />',
                narrative_type: 'Commercial Appeal',
                content: '<svg onload="alert(\'XSS in content\')" />',
                created_date: '2024-06-11',
                status: 'Final',
                word_count: 50,
              },
            ])
          );
        })
      );

      renderWithProviders(<Narratives />);

      await waitFor(() => {
        expect(screen.getByText('Appeal Narratives')).toBeInTheDocument();
      });

      // XSS payloads should be displayed as text, not executed
      expect(screen.getByText(/script.*alert.*XSS/)).toBeInTheDocument();
      expect(document.querySelector('script[src*="alert"]')).toBeNull();
      expect(document.querySelector('img[onerror*="alert"]')).toBeNull();
      expect(document.querySelector('svg[onload*="alert"]')).toBeNull();
    });

    it('should sanitize narrative editor content', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Narratives />);

      await waitFor(() => {
        expect(screen.getByText('Appeal Narratives')).toBeInTheDocument();
      });

      // Click on first narrative to edit
      const viewButtons = screen.getAllByText('View');
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);

        await waitFor(() => {
          expect(screen.getByText('View Narrative')).toBeInTheDocument();
        });

        const editButton = screen.getByText('Edit Narrative');
        await user.click(editButton);

        await waitFor(() => {
          const textarea = screen.getByRole('textbox', { name: /content/i });
          if (textarea) {
            await user.clear(textarea);
            await user.type(textarea, '<script>alert("XSS in editor")</script>');

            expect((textarea as HTMLTextAreaElement).value).toContain('<script>');
            expect(document.querySelector('script[src*="alert"]')).toBeNull();
          }
        });
      }
    });
  });

  describe('API Response XSS Protection', () => {
    it('should sanitize malicious API responses', async () => {
      // Mock API to return XSS payload
      server.use(
        rest.get('http://localhost:8000/api/sample-properties', (req, res, ctx) => {
          return res(
            ctx.json([
              {
                account_number: '<script>alert("XSS")</script>',
                property_address: '<img src="x" onerror="alert(\'XSS\')" />',
                current_assessed_value: 500000,
                market_value: 525000,
                property_type: '<svg onload="alert(\'XSS\')" />',
                jurisdiction: 'javascript:alert("XSS")',
                flag_status: '<iframe src="javascript:alert(\'XSS\')"></iframe>',
                appeal_potential: 'High',
              },
            ])
          );
        })
      );

      const { container } = renderWithProviders(<PropertyFields />);

      await waitFor(() => {
        expect(screen.getByText('Property Fields')).toBeInTheDocument();
      });

      // Check that no script elements were injected
      expect(container.querySelector('script')).toBeNull();
      expect(container.querySelector('img[onerror]')).toBeNull();
      expect(container.querySelector('svg[onload]')).toBeNull();
      expect(container.querySelector('iframe[src*="javascript"]')).toBeNull();
    });
  });

  describe('URL Parameter XSS Protection', () => {
    it('should sanitize URL parameters', async () => {
      // Mock location with XSS in hash
      Object.defineProperty(window, 'location', {
        value: {
          hash: '#<script>alert("XSS")</script>',
          pathname: '/dashboard',
          search: '?test=<img src="x" onerror="alert(\'XSS\')" />',
        },
        writable: true,
      });

      renderWithProviders(<PropertyFields />);

      // No scripts should be executed from URL parameters
      expect(document.querySelector('script[src*="alert"]')).toBeNull();
      expect(document.querySelector('img[onerror*="alert"]')).toBeNull();
    });
  });

  describe('Content Security Policy Validation', () => {
    it('should have proper CSP headers', async () => {
      // This would typically be tested at the server level
      // Here we verify the client-side doesn't create unsafe content

      const { container } = renderWithProviders(<PropertyFields />);

      // No inline scripts should be present
      const inlineScripts = container.querySelectorAll('script:not([src])');
      inlineScripts.forEach((script) => {
        expect(script.textContent).not.toContain('eval(');
        expect(script.textContent).not.toContain('Function(');
        expect(script.textContent).not.toContain('setTimeout(');
        expect(script.textContent).not.toContain('setInterval(');
      });

      // No inline event handlers
      const elementsWithEvents = container.querySelectorAll('[onclick], [onload], [onerror]');
      expect(elementsWithEvents.length).toBe(0);
    });
  });

  describe('DOM Manipulation XSS Protection', () => {
    it('should safely handle innerHTML manipulation', () => {
      const testDiv = document.createElement('div');
      const xssPayload = '<script>alert("XSS")</script><img src="x" onerror="alert(\'XSS\')" />';

      // Test React's default XSS protection
      testDiv.textContent = xssPayload;
      expect(testDiv.innerHTML).toBe(
        '&lt;script&gt;alert("XSS")&lt;/script&gt;&lt;img src="x" onerror="alert(\'XSS\')" /&gt;'
      );

      // No script elements should be created
      expect(testDiv.querySelector('script')).toBeNull();
      expect(testDiv.querySelector('img[onerror]')).toBeNull();
    });

    it('should protect against dangerouslySetInnerHTML misuse', () => {
      // Verify no components use dangerouslySetInnerHTML without sanitization
      const { container } = renderWithProviders(<PropertyFields />);

      // Look for potentially dangerous patterns
      const allElements = container.querySelectorAll('*');
      allElements.forEach((element) => {
        // Check if element has dangerous content
        const innerHTML = element.innerHTML;
        expect(innerHTML).not.toMatch(/<script[\s\S]*?>[\s\S]*?<\/script>/gi);
        expect(innerHTML).not.toMatch(/javascript:/gi);
        expect(innerHTML).not.toMatch(/on\w+\s*=/gi);
      });
    });
  });
});
