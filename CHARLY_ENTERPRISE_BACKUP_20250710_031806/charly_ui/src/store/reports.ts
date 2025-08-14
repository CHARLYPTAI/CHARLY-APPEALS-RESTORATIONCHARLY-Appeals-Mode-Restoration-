import { create } from "zustand";

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
  fetchReports: () => void;
  unlockReport: (id: string) => Promise<void>;
};

export const useReportsStore = create<ReportsState>((set, get) => ({
  reports: [],
  loadingId: null,
  error: null,

  fetchReports: () => {
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
  },

  unlockReport: async (id) => {
    set({ loadingId: id, error: null });
    try {
      // Simulate Stripe checkout delay
      await new Promise((res) => setTimeout(res, 1000));

      const updated = get().reports.map((r) =>
        r.id === id ? { ...r, unlocked: true } : r
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
}));