import { create } from "zustand";
import { authenticatedRequest } from "@/lib/auth";

type Report = {
  id: string;
  name: string;
  description: string;
  type: "leads" | "savings" | "narrative";
  unlocked: boolean;
  price: number;
  download_url: string;
};

type ReportsState = {
  reports: Report[];
  loadingId: string | null;
  error: string | null;
  fetchReports: () => Promise<void>;
  unlockReport: (id: string) => Promise<void>;
  downloadReport: (id: string) => Promise<void>;
};

export const useReportsStore = create<ReportsState>((set, get) => ({
  reports: [],
  loadingId: null,
  error: null,

  fetchReports: async () => {
    try {
      const response = await authenticatedRequest('/api/reports/');
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      const reports = await response.json();
      set({ reports, error: null });
      console.log('✅ Reports loaded from backend:', reports.length);
    } catch (err: unknown) {
      console.error("Failed to fetch reports:", err);
      const message = err instanceof Error ? err.message : "Failed to load reports";
      set({ error: message });
      
      // Fallback to mock data if backend fails
      console.log('⚠️ Using fallback mock reports data');
      set({
        reports: [
          {
            id: "RPT-001",
            name: "Flagged Lead Pack",
            description: "50 underassessed properties by jurisdiction",
            type: "leads",
            unlocked: false,
            price: 99,
            download_url: "/reports/flagged-leads.pdf",
          },
          {
            id: "RPT-002",
            name: "Savings Forecast", 
            description: "Projected tax savings across your portfolio",
            type: "savings",
            unlocked: false,
            price: 129,
            download_url: "/reports/savings-forecast.pdf",
          },
          {
            id: "RPT-003",
            name: "AI Narrative Briefing",
            description: "GPT-generated summary across all open cases", 
            type: "narrative",
            unlocked: false,
            price: 149,
            download_url: "/reports/ai-briefing.pdf",
          },
        ],
      });
    }
  },

  unlockReport: async (id) => {
    set({ loadingId: id, error: null });
    try {
      const response = await authenticatedRequest('/api/reports/unlock', {
        method: 'POST',
        body: JSON.stringify({ report_id: id }),
      });

      if (!response.ok) {
        throw new Error('Failed to unlock report');
      }

      const result = await response.json();

      const updated = get().reports.map((r) =>
        r.id === id ? { ...r, unlocked: true, download_url: result.download_url } : r
      );
      set({ reports: updated });
    } catch (err: unknown) {
      console.error("Unlock failed", err);
      const message = err instanceof Error ? err.message : "Unlock failed";
      set({ error: message });
    } finally {
      set({ loadingId: null });
    }
  },

  downloadReport: async (id) => {
    set({ error: null });
    try {
      const report = get().reports.find(r => r.id === id);
      if (!report) {
        throw new Error('Report not found');
      }

      if (!report.unlocked) {
        throw new Error('Report must be unlocked before downloading');
      }

      // Trigger download
      const response = await authenticatedRequest(`/api/reports/download/${id}`);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `charly_report_${id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error("Download failed", err);
      const message = err instanceof Error ? err.message : "Download failed";
      set({ error: message });
    }
  },
}));