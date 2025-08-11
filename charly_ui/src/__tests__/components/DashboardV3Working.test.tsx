// src/__tests__/components/DashboardV3Working.test.tsx

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import DashboardV3Working from '@/pages/DashboardV3Working'
import { ThemeProvider } from '@/components/ui/theme' // Adjust this path if needed

describe('DashboardV3Working', () => {
  it('renders IntelligentCanvas with PortfolioMode by default', () => {
    render(
      <ThemeProvider>
        <DashboardV3Working />
      </ThemeProvider>
    )

    expect(screen.getByText(/portfolio/i)).toBeInTheDocument()
  })
})
