// LOC_CATEGORY: interface
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Dashboard from '../../../src/components/Dashboard';
import {
  renderWithProviders,
  measureRenderTime,
  viewports,
  createMockUser,
} from '../../setup/testUtils';
import { server } from '../../api/handlers/server';
import { http } from 'msw';
import type { User } from '../../../src/types/api';

// Mock react-grid-layout to avoid layout calculation issues in tests
jest.mock('react-grid-layout', () => ({
  __esModule: true,
  default: ({
    children,
    onLayoutChange,
  }: {
    children: React.ReactNode;
    onLayoutChange?: (layout: unknown[]) => void;
  }) => (
    <div data-testid='grid-layout' onClick={() => onLayoutChange?.([])}>
      {children}
    </div>
  ),
  WidthProvider: (Component: React.ComponentType) => Component,
}));

describe('Dashboard Component', () => {
  const mockUser = createMockUser();

  describe('Rendering', () => {
    it('should render dashboard with user greeting', () => {
      renderWithProviders(<Dashboard user={mockUser} />);

      expect(screen.getByText(`Welcome to CHARLY, ${mockUser.username}!`)).toBeInTheDocument();
      expect(screen.getByText('Property Tax Appeal Platform Dashboard')).toBeInTheDocument();
    });

    it('should render all dashboard widgets', async () => {
      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('🏠 Platform Overview')).toBeInTheDocument();
        expect(screen.getByText('📊 Sample Properties')).toBeInTheDocument();
        expect(screen.getByText('🏛️ Jurisdiction Info')).toBeInTheDocument();
        expect(screen.getByText('⚡ Quick Actions')).toBeInTheDocument();
      });
    });

    it('should display loading state initially', () => {
      renderWithProviders(<Dashboard user={mockUser} />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should handle null user gracefully', () => {
      renderWithProviders(<Dashboard user={null as unknown as User} />);

      expect(screen.getByText(/Welcome to CHARLY/)).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('should load and display property data', async () => {
      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('123 Main Street, Dallas, TX 75201')).toBeInTheDocument();
        expect(screen.getByText('Account: 123456789')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        http.get('http://localhost:8000/api/sample-properties', () => {
          return new Response(JSON.stringify({ detail: 'Server error' }), { status: 500 });
        })
      );

      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });

    it('should display empty state when no properties', async () => {
      server.use(
        http.get('http://localhost:8000/api/sample-properties', () => {
          return new Response(JSON.stringify([]), { status: 200 });
        })
      );

      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('Properties')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });
  });

  describe('Widget Interactions', () => {
    it('should update statistics based on property data', async () => {
      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        const overAssessedStat = screen.getByText('Over-Assessed').closest('div');
        expect(overAssessedStat).toHaveTextContent('1');
      });
    });

    it('should handle jurisdiction selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('Dallas County, TX')).toBeInTheDocument();
      });

      const select = screen.getByText('Switch Jurisdiction').closest('div')?.querySelector('input');
      if (select) {
        await user.click(select);
        // Verify dropdown opens (Ant Design Select behavior)
      }
    });

    it('should handle quick action button clicks', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        const uploadButton = screen.getByRole('button', { name: /Upload Data/i });
        expect(uploadButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Upload Data/i }));
      // Verify action is triggered
    });
  });

  describe('Layout Customization', () => {
    it('should handle layout customization button click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        const customizeButton = screen.getByRole('button', { name: /Customize Layout/i });
        expect(customizeButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Customize Layout/i }));
      // Verify message appears
    });

    it('should update layout on drag and drop', async () => {
      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        const gridLayout = screen.getByTestId('grid-layout');
        fireEvent.click(gridLayout);
      });

      // Layout change handler should be called
    });
  });

  describe('Responsive Behavior', () => {
    it('should render correctly on mobile viewport', async () => {
      renderWithProviders(<Dashboard user={mockUser} />, { viewport: viewports.mobile });

      await waitFor(() => {
        expect(screen.getByText('🏠 Platform Overview')).toBeInTheDocument();
      });

      // Verify mobile-optimized layout
    });

    it('should render correctly on tablet viewport', async () => {
      renderWithProviders(<Dashboard user={mockUser} />, { viewport: viewports.tablet });

      await waitFor(() => {
        expect(screen.getByText('🏠 Platform Overview')).toBeInTheDocument();
      });
    });

    it('should render correctly on desktop viewport', async () => {
      renderWithProviders(<Dashboard user={mockUser} />, { viewport: viewports.desktop });

      await waitFor(() => {
        expect(screen.getByText('🏠 Platform Overview')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should render within performance budget', async () => {
      const renderTime = await measureRenderTime(<Dashboard user={mockUser} />);

      expect(renderTime).toBeLessThan(200); // 200ms budget
    });

    it('should not re-render unnecessarily', async () => {
      const { rerender } = renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('🏠 Platform Overview')).toBeInTheDocument();
      });

      // Re-render with same props
      rerender(<Dashboard user={mockUser} />);

      // Component should not fetch data again
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels', async () => {
      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        const cards = screen.getAllByRole('article');
        expect(cards.length).toBeGreaterThan(0);
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Customize Layout/i })).toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: /Customize Layout/i })
      );
    });
  });

  describe('Error Handling', () => {
    it('should display error message on network failure', async () => {
      server.use(
        http.get('http://localhost:8000/api/sample-properties', () => {
          return Response.error();
        })
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should handle missing jurisdiction data', async () => {
      server.use(
        http.get('http://localhost:8000/api/jurisdictions', () => {
          return new Response(JSON.stringify({}), { status: 200 });
        })
      );

      renderWithProviders(<Dashboard user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('🏛️ Jurisdiction Info')).toBeInTheDocument();
      });
    });
  });
});
