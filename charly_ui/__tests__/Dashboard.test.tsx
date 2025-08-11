import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { Dashboard } from '../src/pages/Dashboard';
import { useDashboardStore } from '../src/store/dashboard';

// Mock the dashboard store
vi.mock('../src/store/dashboard', () => ({
  useDashboardStore: vi.fn(),
}));

// Mock chart components to avoid canvas rendering issues in tests
vi.mock('../src/components/charts/SuccessProbabilityChart', () => ({
  SuccessProbabilityChart: () => <div data-testid="success-probability-chart">Chart</div>,
}));

vi.mock('../src/components/charts/MarketFactorsChart', () => ({
  MarketFactorsChart: () => <div data-testid="market-factors-chart">Chart</div>,
}));

vi.mock('../src/components/charts/FinancialImpactChart', () => ({
  FinancialImpactChart: () => <div data-testid="financial-impact-chart">Chart</div>,
}));

const mockDashboardStore = {
  taxSavings: '$128,450',
  openAppeals: 12,
  upcomingDeadlines: 5,
  appealsWon: 37,
  loading: false,
  error: null,
  fetchKPIs: vi.fn(),
  recentActivity: [
    {
      id: '1',
      message: 'New property analysis completed for 123 Main St',
      timestamp: '2025-07-13T10:00:00Z',
      type: 'analysis',
      severity: 'info'
    }
  ],
  analytics: {
    totalProperties: 150,
    totalSavings: 128450,
    appealsWon: 37,
    successRate: 85.2,
    financialMetrics: [
      { category: 'Tax Savings', value: 128450, trend: 12.5 }
    ],
    monthlyTrends: [
      { month: 'Jan', appeals: 8, savings: 45000 }
    ]
  },
  aiInsights: {
    summary: 'Strong market position with 85% success rate',
    keyFindings: [
      {
        id: '1',
        title: 'Market Opportunity',
        description: 'High-value properties show 15% over-assessment',
        impact: 'high',
        confidence: 92
      }
    ],
    recommendations: [
      {
        id: '1',
        action: 'Focus on commercial properties',
        priority: 'high',
        estimatedImpact: '$50K additional savings'
      }
    ],
    marketAnalysis: [
      {
        county: 'Hamilton',
        trend: 'increasing',
        compliance: 78,
        opportunities: 25
      }
    ]
  }
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboardStore as ReturnType<typeof vi.fn>).mockReturnValue(mockDashboardStore);
  });

  test('displays KPI values correctly', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('$128,450')).toBeInTheDocument();
      expect(screen.getAllByText('12')).toHaveLength(2); // Handle multiple instances
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getAllByText('37')).toHaveLength(2); // Handle multiple instances
    });
  });

  test('shows loading state initially', () => {
    (useDashboardStore as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockDashboardStore,
      loading: true,
    });

    render(<Dashboard />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays error state when error occurs', () => {
    (useDashboardStore as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockDashboardStore,
      error: 'Failed to fetch data',
    });

    render(<Dashboard />);
    
    expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
  });

  test('calls fetchKPIs on component mount', () => {
    render(<Dashboard />);
    
    expect(mockDashboardStore.fetchKPIs).toHaveBeenCalled();
  });

  test('displays recent activity when available', () => {
    render(<Dashboard />);
    
    expect(screen.getByText(/New property analysis completed/)).toBeInTheDocument();
  });

  test('displays analytics data correctly', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('150')).toBeInTheDocument(); // Total properties
  });

  test('displays AI insights when available', () => {
    render(<Dashboard />);
    
    expect(screen.getByText(/Strong market position/)).toBeInTheDocument();
    expect(screen.getByText('Market Opportunity')).toBeInTheDocument();
  });

  test('renders chart components', () => {
    render(<Dashboard />);
    
    expect(screen.getByTestId('success-probability-chart')).toBeInTheDocument();
    expect(screen.getByTestId('market-factors-chart')).toBeInTheDocument();
    expect(screen.getByTestId('financial-impact-chart')).toBeInTheDocument();
  });

  test('handles empty data gracefully', () => {
    (useDashboardStore as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockDashboardStore,
      recentActivity: [],
      analytics: null,
      aiInsights: null,
    });

    render(<Dashboard />);
    
    // Should still render KPIs
    expect(screen.getByText('$128,450')).toBeInTheDocument();
  });
});