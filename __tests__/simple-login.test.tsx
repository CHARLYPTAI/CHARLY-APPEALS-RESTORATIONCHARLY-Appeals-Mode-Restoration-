// LOC_CATEGORY: interface
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfigProvider } from 'antd';
import Login from '../src/components/Login';

// Simple test wrapper for Ant Design
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ConfigProvider>{children}</ConfigProvider>
);

describe('Login Component - Simple Test', () => {
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

  it('should handle form input', () => {
    render(
      <TestWrapper>
        <Login onLogin={mockOnLogin} />
      </TestWrapper>
    );

    const usernameInput = screen.getByPlaceholderText('Username') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('testpass');
  });

  it('should display demo credentials', () => {
    render(
      <TestWrapper>
        <Login onLogin={mockOnLogin} />
      </TestWrapper>
    );

    expect(screen.getByText(/Demo Credentials:/)).toBeInTheDocument();
    expect(screen.getByText(/admin.*secret/)).toBeInTheDocument();
  });
});
