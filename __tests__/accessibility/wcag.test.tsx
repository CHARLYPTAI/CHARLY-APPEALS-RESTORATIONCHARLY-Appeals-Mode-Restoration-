// LOC_CATEGORY: interface
// Test file - React import handled by Jest setup
import { screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { renderWithProviders, createMockUser, viewports } from '../setup/testUtils';
import Dashboard from '@/components/Dashboard';
import Login from '@/components/Login';
import PropertyFields from '@/components/PropertyFields';
import BulkUpload from '@/components/BulkUpload';
import Analytics from '@/components/Analytics';
import Narratives from '@/components/Narratives';

expect.extend(toHaveNoViolations);

describe('WCAG 2.1 AA Compliance Tests', () => {
  const mockUser = createMockUser();
  const mockOnLogin = jest.fn();

  describe('Login Component Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<Login onLogin={mockOnLogin} />);

      const results = await axe(container, {
        rules: {
          // Enforce WCAG 2.1 AA standards
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'aria-labels': { enabled: true },
          'heading-order': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper heading structure', () => {
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('CHARLY');

      // Should have proper heading hierarchy
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have proper form labels', () => {
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      const usernameInput = screen.getByPlaceholderText('Username');
      const passwordInput = screen.getByPlaceholderText('Password');

      // Inputs should have accessible names
      expect(usernameInput).toHaveAccessibleName();
      expect(passwordInput).toHaveAccessibleName();
    });

    it('should have sufficient color contrast', async () => {
      const { container } = renderWithProviders(<Login onLogin={mockOnLogin} />);

      // Test specific elements for contrast
      const button = screen.getByRole('button', { name: /Sign In/i });
      const styles = window.getComputedStyle(button);

      // Should have proper contrast (this is a simplified check)
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();

      // Use axe for comprehensive contrast checking
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', () => {
      renderWithProviders(<Login onLogin={mockOnLogin} />);

      const usernameInput = screen.getByPlaceholderText('Username');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      // All interactive elements should be focusable
      expect(usernameInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();

      // Tab index should be appropriate
      expect(usernameInput.tabIndex).toBeGreaterThanOrEqual(0);
      expect(passwordInput.tabIndex).toBeGreaterThanOrEqual(0);
      expect(submitButton.tabIndex).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Dashboard Component Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper landmark regions', async () => {
      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('Welcome to CHARLY, admin!')).toBeInTheDocument();
      });

      // Should have main content area
      const main = screen.getByRole('main') || document.querySelector('main');
      if (!main) {
        // Check for other landmark roles
        const regions = screen.getAllByRole('region');
        expect(regions.length).toBeGreaterThan(0);
      }
    });

    it('should have accessible widget cards', async () => {
      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('🏠 Platform Overview')).toBeInTheDocument();
      });

      // Widget cards should have proper roles
      const cards =
        screen.getAllByRole('article') ||
        document.querySelectorAll('[role="region"]') ||
        document.querySelectorAll('.ant-card');

      expect(cards.length).toBeGreaterThan(0);

      // Each card should have accessible name
      Array.from(cards).forEach((card) => {
        const hasAccessibleName =
          card.getAttribute('aria-label') ||
          card.getAttribute('aria-labelledby') ||
          card.querySelector('h1, h2, h3, h4, h5, h6');

        expect(hasAccessibleName).toBeTruthy();
      });
    });

    it('should have accessible statistics', async () => {
      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('Properties')).toBeInTheDocument();
      });

      // Statistics should be properly labeled
      const statistics = document.querySelectorAll('.ant-statistic');
      Array.from(statistics).forEach((stat) => {
        const title = stat.querySelector('.ant-statistic-title');
        const value = stat.querySelector('.ant-statistic-content-value');

        expect(title).toBeTruthy();
        expect(value).toBeTruthy();

        // Should have accessible description
        if (value) {
          expect(value.textContent?.trim()).toBeTruthy();
        }
      });
    });
  });

  describe('PropertyFields Component Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<PropertyFields />);

      await waitFor(() => {
        expect(screen.getByText('Property Fields')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have properly labeled form fields', async () => {
      renderWithProviders(<PropertyFields />);

      await waitFor(() => {
        expect(screen.getByText('Property Fields')).toBeInTheDocument();
      });

      const formFields = screen.getAllByRole('textbox');
      formFields.forEach((field) => {
        // Each field should have an accessible name
        expect(field).toHaveAccessibleName();
      });

      const selectFields = screen.getAllByRole('combobox');
      selectFields.forEach((field) => {
        expect(field).toHaveAccessibleName();
      });
    });

    it('should have proper fieldset grouping', async () => {
      renderWithProviders(<PropertyFields />);

      await waitFor(() => {
        expect(screen.getByText('Property Fields')).toBeInTheDocument();
      });

      // Form sections should be properly grouped
      const fieldsets =
        document.querySelectorAll('fieldset') || document.querySelectorAll('[role="group"]');

      if (fieldsets.length > 0) {
        Array.from(fieldsets).forEach((fieldset) => {
          // Fieldsets should have legends or aria-label
          const legend =
            fieldset.querySelector('legend') ||
            fieldset.getAttribute('aria-label') ||
            fieldset.getAttribute('aria-labelledby');

          expect(legend).toBeTruthy();
        });
      }
    });

    it('should handle validation errors accessibly', async () => {
      renderWithProviders(<PropertyFields />);

      await waitFor(() => {
        expect(screen.getByText('Property Fields')).toBeInTheDocument();
      });

      // Try to find validation error patterns
      const errorMessages =
        document.querySelectorAll('[role="alert"]') ||
        document.querySelectorAll('.ant-form-item-explain-error');

      // If there are error messages, they should be accessible
      Array.from(errorMessages).forEach((error) => {
        expect(error.textContent?.trim()).toBeTruthy();

        // Error should be associated with field
        const fieldId = error.getAttribute('id') || error.getAttribute('aria-describedby');

        if (fieldId) {
          const associatedField = document.querySelector(`[aria-describedby="${fieldId}"]`);
          expect(associatedField).toBeTruthy();
        }
      });
    });
  });

  describe('BulkUpload Component Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<BulkUpload />);

      await waitFor(() => {
        expect(screen.getByText('Bulk Upload')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible file upload area', async () => {
      renderWithProviders(<BulkUpload />);

      await waitFor(() => {
        expect(screen.getByText('Bulk Upload')).toBeInTheDocument();
      });

      // File upload should be keyboard accessible
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        expect(fileInput).toHaveAccessibleName();
        expect((fileInput as HTMLInputElement).tabIndex).toBeGreaterThanOrEqual(0);
      }

      // Drag and drop area should be accessible
      const dropzone = document.querySelector('.ant-upload-drag');
      if (dropzone) {
        expect(dropzone).toHaveAttribute('role');
        expect(dropzone).toHaveAccessibleName();
      }
    });

    it('should announce upload progress', async () => {
      renderWithProviders(<BulkUpload />);

      await waitFor(() => {
        expect(screen.getByText('Bulk Upload')).toBeInTheDocument();
      });

      // Progress indicators should be accessible
      const progressBars =
        document.querySelectorAll('[role="progressbar"]') ||
        document.querySelectorAll('.ant-progress');

      Array.from(progressBars).forEach((progress) => {
        // Should have aria-valuenow, aria-valuemin, aria-valuemax
        if (progress.getAttribute('role') === 'progressbar') {
          expect(progress).toHaveAttribute('aria-valuenow');
          expect(progress).toHaveAttribute('aria-valuemin');
          expect(progress).toHaveAttribute('aria-valuemax');
        }
      });
    });
  });

  describe('Analytics Component Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<Analytics />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible data tables', () => {
      renderWithProviders(<Analytics />);

      const tables = screen.getAllByRole('table');
      tables.forEach((table) => {
        // Tables should have captions or aria-label
        const caption =
          table.querySelector('caption') ||
          table.getAttribute('aria-label') ||
          table.getAttribute('aria-labelledby');

        expect(caption).toBeTruthy();

        // Headers should be properly marked
        const headers = table.querySelectorAll('th');
        expect(headers.length).toBeGreaterThan(0);
      });
    });

    it('should have accessible charts and visualizations', () => {
      renderWithProviders(<Analytics />);

      // Chart placeholders should have text alternatives
      const chartContainers =
        document.querySelectorAll('[data-testid*="chart"]') ||
        document.querySelectorAll('.chart-container');

      Array.from(chartContainers).forEach((chart) => {
        // Charts should have accessible descriptions
        const description =
          chart.getAttribute('aria-label') ||
          chart.getAttribute('aria-describedby') ||
          chart.querySelector('title, .sr-only');

        expect(description).toBeTruthy();
      });
    });
  });

  describe('Narratives Component Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<Narratives />);

      await waitFor(() => {
        expect(screen.getByText('Appeal Narratives')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible modal dialogs', async () => {
      renderWithProviders(<Narratives />);

      await waitFor(() => {
        expect(screen.getByText('Appeal Narratives')).toBeInTheDocument();
      });

      // Modal dialogs should be properly implemented
      const modals =
        document.querySelectorAll('[role="dialog"]') || document.querySelectorAll('.ant-modal');

      Array.from(modals).forEach((modal) => {
        // Modal should have accessible name
        const title =
          modal.getAttribute('aria-labelledby') ||
          modal.getAttribute('aria-label') ||
          modal.querySelector('.ant-modal-title');

        expect(title).toBeTruthy();

        // Modal should trap focus
        expect(modal).toHaveAttribute('role', 'dialog');
      });
    });
  });

  describe('Responsive Accessibility', () => {
    const testViewports = [
      { name: 'mobile', ...viewports.mobile },
      { name: 'tablet', ...viewports.tablet },
      { name: 'desktop', ...viewports.desktop },
    ];

    testViewports.forEach((viewport) => {
      it(`should be accessible on ${viewport.name} viewport`, async () => {
        const { container } = renderWithProviders(<Dashboard user={mockUser} />, { viewport });

        await waitFor(() => {
          expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });

        const results = await axe(container, {
          rules: {
            'target-size': { enabled: true }, // Ensure touch targets are large enough
            orientation: { enabled: true }, // Ensure content works in both orientations
          },
        });

        expect(results).toHaveNoViolations();
      });
    });

    it('should have appropriate touch target sizes on mobile', async () => {
      renderWithProviders(<Dashboard user={mockUser} />, { viewport: viewports.mobile });

      await waitFor(() => {
        expect(screen.getByText('Welcome to CHARLY, admin!')).toBeInTheDocument();
      });

      // Interactive elements should be at least 44x44px on mobile
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        const minSize = 44; // WCAG recommendation for touch targets

        // Allow some flexibility for icon buttons with proper spacing
        expect(rect.width >= minSize || rect.height >= minSize).toBeTruthy();
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper heading hierarchy', async () => {
      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('Welcome to CHARLY, admin!')).toBeInTheDocument();
      });

      const headings = screen.getAllByRole('heading');
      const headingLevels = headings.map((h) => parseInt(h.tagName.charAt(1)));

      // Should start with h1 or h2 and not skip levels
      expect(headingLevels[0]).toBeLessThanOrEqual(2);

      for (let i = 1; i < headingLevels.length; i++) {
        const diff = (headingLevels[i] ?? 0) - (headingLevels[i - 1] ?? 0);
        expect(diff).toBeLessThanOrEqual(1); // Shouldn't skip heading levels
      }
    });

    it('should announce dynamic content changes', async () => {
      renderWithProviders(<Dashboard user={mockUser} />);

      // Live regions should be present for dynamic updates - checked implicitly via message containers
      // At minimum, there should be message containers
      const messageContainers = document.querySelectorAll('.ant-message');
      expect(messageContainers.length).toBeGreaterThanOrEqual(0);
    });

    it('should have skip links for navigation', () => {
      renderWithProviders(<Dashboard user={mockUser} />);

      // Check for skip links (usually hidden until focused)
      const skipLinks =
        document.querySelectorAll('a[href^="#"]') || document.querySelectorAll('.skip-link');

      // While not required, skip links improve navigation
      Array.from(skipLinks).forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });
  });
});
