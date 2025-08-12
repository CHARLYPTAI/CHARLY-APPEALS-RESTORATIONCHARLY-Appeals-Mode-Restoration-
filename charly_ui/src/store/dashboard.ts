import { create } from "zustand";
import { EncryptedCacheService } from "@/lib/encryption";
import { authenticatedRequest } from "@/lib/auth";

interface CachedKPIData {
  taxSavings: string;
  openAppeals: number;
  upcomingDeadlines: number;
  appealsWon: number;
  timestamp: number;
}

interface DashboardActivity {
  id: string;
  message: string;
  timestamp: string;
  type: string;
  severity: string;
}

interface DashboardAnalytics {
  totalProperties: number;
  totalSavings: number;
  appealsWon: number;
  successRate: number;
  financialMetrics: {
    category: string;
    value: number;
    trend: number;
  }[];
  monthlyTrends: {
    month: string;
    appeals: number;
    savings: number;
  }[];
}

interface DashboardAIInsights {
  summary: string;
  keyFindings: {
    id: string;
    title: string;
    description: string;
    impact: string;
    confidence: number;
  }[];
  recommendations: {
    id: string;
    action: string;
    priority: string;
    estimatedImpact: string;
  }[];
  marketAnalysis: {
    county: string;
    trend: string;
    compliance: number;
    opportunities: number;
  }[];
}

interface DashboardState {
  taxSavings: string;
  openAppeals: number;
  upcomingDeadlines: number;
  appealsWon: number;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  recentActivity: DashboardActivity[];
  analytics: DashboardAnalytics | null;
  aiInsights: DashboardAIInsights | null;
  fetchKPIs: (forceRefresh?: boolean) => Promise<void>;
  fetchRecentActivity: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  fetchAIInsights: () => Promise<void>;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEY = "charly-dashboard-kpis";

const getCachedData = (): CachedKPIData | null => {
  return EncryptedCacheService.get<CachedKPIData>(CACHE_KEY);
};

const setCachedData = (data: Omit<CachedKPIData, "timestamp">) => {
  EncryptedCacheService.set(CACHE_KEY, data, CACHE_DURATION);
};

export const useDashboardStore = create<DashboardState>((set) => ({
  taxSavings: "$0",
  openAppeals: 0,
  upcomingDeadlines: 0,
  appealsWon: 0,
  loading: false,
  error: null,
  lastFetch: null,
  recentActivity: [],
  analytics: null,
  aiInsights: null,

  fetchKPIs: async (forceRefresh = false) => {
    // Guard: if no token, stay silent and return null/empty
    const { authService } = await import('../lib/auth');
    const hasToken = authService?.isAuthenticated?.() ?? false;
    if (!hasToken) {
      console.info("KPIs: skipped fetch — no token");
      set({ loading: false, error: null });
      return;
    }
    
    // Check cache first unless forcing refresh
    if (!forceRefresh) {
      const cached = getCachedData();
      if (cached) {
        set({
          taxSavings: cached.taxSavings,
          openAppeals: cached.openAppeals,
          upcomingDeadlines: cached.upcomingDeadlines,
          appealsWon: cached.appealsWon,
          lastFetch: cached.timestamp,
          loading: false,
          error: null,
        });
        return;
      }
    }

    set({ loading: true, error: null });

    try {
      console.log("Store: Attempting to fetch KPIs...");
      // Fetch all KPIs from single endpoint with authentication
      const response = await authenticatedRequest("/api/kpis");

      // Check for errors
      if (!response.ok) {
        throw new Error(`Failed to fetch KPI data: ${response.status}`);
      }
      console.log("Store: KPIs fetched successfully");

      // Parse response
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API returned HTML instead of JSON');
      }
      const data = await response.json();

      const kpiData = {
        taxSavings: `$${(data.estimated_savings || 0).toLocaleString()}`,
        openAppeals: data.open_appeals || 0,
        upcomingDeadlines: data.upcoming_deadlines || 0,
        appealsWon: data.appeals_won || 0,
      };

      // Cache the data
      setCachedData(kpiData);

      // Update state
      set({
        ...kpiData,
        lastFetch: Date.now(),
        loading: false,
      });
    } catch (err) {
      console.error("Store: KPI fetch error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data";
      
      set({
        loading: false,
        error: errorMessage,
      });
      
      throw err; // Re-throw to let Dashboard handle the error
    }
  },

  fetchRecentActivity: async () => {
    try {
      const response = await authenticatedRequest("/api/dashboard/recent-activity");
      if (response.ok) {
        const data = await response.json();
        set({ recentActivity: data });
      }
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
    }
  },

  fetchAnalytics: async () => {
    try {
      const response = await authenticatedRequest("/api/dashboard/analytics");
      if (response.ok) {
        const data = await response.json();
        set({ analytics: data });
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  },

  fetchAIInsights: async () => {
    try {
      const response = await authenticatedRequest("/api/dashboard/ai-insights");
      if (response.ok) {
        const data = await response.json();
        set({ aiInsights: data });
      }
    } catch (error) {
      console.error("Failed to fetch AI insights:", error);
    }
  },
}));