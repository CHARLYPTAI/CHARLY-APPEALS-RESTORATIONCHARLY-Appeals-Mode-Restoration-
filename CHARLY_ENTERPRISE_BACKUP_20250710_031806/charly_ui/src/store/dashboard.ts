import { create } from "zustand";

interface CachedKPIData {
  taxSavings: string;
  openAppeals: number;
  upcomingDeadlines: number;
  appealsWon: number;
  timestamp: number;
}

interface DashboardState {
  taxSavings: string;
  openAppeals: number;
  upcomingDeadlines: number;
  appealsWon: number;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  recentActivity: any[];
  analytics: any;
  aiInsights: any;
  fetchKPIs: (forceRefresh?: boolean) => Promise<void>;
  fetchRecentActivity: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  fetchAIInsights: () => Promise<void>;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEY = "charly-dashboard-kpis";

const getCachedData = (): CachedKPIData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data: CachedKPIData = JSON.parse(cached);
    const now = Date.now();
    
    if (now - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return data;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const setCachedData = (data: Omit<CachedKPIData, "timestamp">) => {
  try {
    const cachedData: CachedKPIData = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
  } catch {
    // Silently fail if localStorage is unavailable
  }
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
      // Fetch all KPIs from single endpoint
      const response = await fetch("/api/kpis");

      // Check for errors
      if (!response.ok) {
        throw new Error(`Failed to fetch KPI data: ${response.status}`);
      }

      // Parse response
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
      set({
        error: err instanceof Error ? err.message : "Failed to load dashboard data",
        loading: false,
      });
    }
  },

  fetchRecentActivity: async () => {
    try {
      const response = await fetch("/api/dashboard/recent-activity");
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
      const response = await fetch("/api/dashboard/analytics");
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
      const response = await fetch("/api/dashboard/ai-insights");
      if (response.ok) {
        const data = await response.json();
        set({ aiInsights: data });
      }
    } catch (error) {
      console.error("Failed to fetch AI insights:", error);
    }
  },
}));