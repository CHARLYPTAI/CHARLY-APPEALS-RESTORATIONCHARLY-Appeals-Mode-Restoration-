// LOC_CATEGORY: interface
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple test to verify Jest and React Testing Library are working
describe('Basic Test Setup', () => {
  it('should render a simple component', () => {
    const TestComponent = () => <div>Hello CHARLY Tests!</div>;

    render(<TestComponent />);

    expect(screen.getByText('Hello CHARLY Tests!')).toBeInTheDocument();
  });

  it('should handle async operations', async () => {
    const AsyncComponent = () => {
      const [text, setText] = React.useState('Loading...');

      React.useEffect(() => {
        setTimeout(() => setText('Loaded!'), 100);
      }, []);

      return <div>{text}</div>;
    };

    render(<AsyncComponent />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await screen.findByText('Loaded!');
    expect(screen.getByText('Loaded!')).toBeInTheDocument();
  });

  it('should validate test environment', () => {
    // Check that our Jest environment is properly configured
    expect(global.fetch).toBeDefined();
    expect(window.localStorage).toBeDefined();
    expect(window.matchMedia).toBeDefined();
  });
});
