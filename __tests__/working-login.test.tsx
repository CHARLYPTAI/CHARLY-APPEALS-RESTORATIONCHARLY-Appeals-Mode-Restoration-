// LOC_CATEGORY: interface
import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import Login from '../src/components/Login';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ConfigProvider>{children}</ConfigProvider>
);

describe('Login Component - Working Test', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    mockOnLogin.mockClear();
  });

  it('should render login form', () => {
    render(
      <TestWrapper>
        <Login onLogin={mockOnLogin} />
      </TestWrapper>
    );

    expect(screen.getByText('CHARLY')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });
});
