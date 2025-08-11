// src/__tests__/components/OpportunityRankingEngine.test.tsx

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ThemeProvider } from '@/components/ui/theme'
import { OpportunityRankingEngine } from '@/components/v2/OpportunityRankingEngine'

describe('OpportunityRankingEngine', () => {
  it('renders without crashing', () => {
    render(
      <ThemeProvider>
        <OpportunityRankingEngine />
      </ThemeProvider>
    )

    expect(screen.getByText(/opportunity/i)).toBeInTheDocument()
  })
})
