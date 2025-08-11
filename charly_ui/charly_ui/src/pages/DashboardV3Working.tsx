// src/pages/DashboardV3Working.tsx

import React from "react";
import { useSearchParams } from "react-router-dom";
import { CanvasContextProvider, CanvasMode } from "@/components/v2/CanvasContext";
import CanvasOrchestrator from "@/components/v2/CanvasOrchestrator";
import WorkflowNavigation from "@/components/WorkflowNavigation";
import { ThemeProvider } from "@/components/ui/theme";

const getModeFromParam = (modeParam: string | null): CanvasMode => {
  switch (modeParam?.toLowerCase()) {
    case "portfolio":
    case "analysis":
    case "intelligence":
    case "appeals":
    case "results":
      return modeParam.toLowerCase() as CanvasMode;
    default:
      return "portfolio";
  }
};

const DashboardV3Working: React.FC = () => {
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode");
  const initialMode = getModeFromParam(modeParam);

  return (
    <ThemeProvider>
      <CanvasContextProvider initialMode={initialMode}>
        <main className="relative min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
          <WorkflowNavigation />
          <CanvasOrchestrator />
        </main>
      </CanvasContextProvider>
    </ThemeProvider>
  );
};

export default DashboardV3Working;
