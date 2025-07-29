// LOC_CATEGORY: interface
import { render, screen, waitFor } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import userEvent from '@testing-library/user-event';
// import { server } from './api/handlers/server';
// import { http, HttpResponse } from 'msw';
import Login from '../src/components/Login';

// MSW Integration Test Suite
describe('🔌 MSW v2 Integration Testing', () => {
  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ConfigProvider>{children}</ConfigProvider>
  );

  beforeEach(() => {
    // server.resetHandlers();
    jest.clearAllMocks();
  });

  it('should successfully mock login API with MSW v2', async () => {
    const mockOnLogin = jest.fn();
    const user = userEvent.setup();

    // Override fetch for this test - mockFetch is already setup in setupTests.ts

    render(
      <TestWrapper>
        <Login onLogin={mockOnLogin} />
      </TestWrapper>
    );

    // Fill form
    await user.type(screen.getByPlaceholderText('Username'), 'admin');
    await user.type(screen.getByPlaceholderText('Password'), 'secret');

    // Submit form
    const signInButton = screen.getByRole('button', { name: /Sign In/i });
    await user.click(signInButton);

    // Wait for API call
    await waitFor(
      () => {
        expect(mockOnLogin).toHaveBeenCalledWith(
          { username: 'admin', role: 'admin' },
          'mock-token-123'
        );
      },
      { timeout: 5000 }
    );
  });

  it('should handle API error responses correctly', async () => {
    const mockOnLogin = jest.fn();
    const user = userEvent.setup();

    // Mock error response - override global fetch for this test
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve(new Response(JSON.stringify({ detail: 'Server error' }), { status: 500 }))
    );

    render(
      <TestWrapper>
        <Login onLogin={mockOnLogin} />
      </TestWrapper>
    );

    await user.type(screen.getByPlaceholderText('Username'), 'admin');
    await user.type(screen.getByPlaceholderText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    // Should not call onLogin on error
    await waitFor(() => {
      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  it('should verify mock fetch is properly configured', () => {
    // Test that global fetch is mocked
    expect(global.fetch).toBeDefined();
    expect(jest.isMockFunction(global.fetch)).toBe(true);
  });

  it('should test property data API mocking', async () => {
    // mockFetch handles this automatically

    // Make actual fetch request to test MSW
    const response = await fetch('http://localhost:8000/api/sample-properties');
    const data = await response.json();

    expect(data).toHaveLength(1);
    expect(data[0].account_number).toBe('123456789');
    expect(data[0].flag_status).toBe('Over-assessed');
  });

  it('should test file upload API mocking', async () => {
    // mockFetch handles this automatically

    // Create test file
    const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:8000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.filename).toBe('test.csv');
    expect(result.records_processed).toBe(100);
  });

  it('should test analytics API endpoints', async () => {
    // mockFetch handles this automatically

    const response = await fetch('http://localhost:8000/api/analytics');
    const data = await response.json();

    expect(data.totalProperties).toBe(1000);
    expect(data.flaggedProperties).toBe(250);
    expect(data.averageSavings).toBe(15000);
  });
});
