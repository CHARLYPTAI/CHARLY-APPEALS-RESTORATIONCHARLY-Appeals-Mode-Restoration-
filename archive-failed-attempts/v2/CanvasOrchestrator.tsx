// src/components/v2/CanvasOrchestrator.tsx

import React, { Suspense } from "react";
import { useCanvasContext, CanvasMode } from "./CanvasContext";
import { Skeleton } from "../ui/skeleton";

const PortfolioMode = React.lazy(() => import("./modes/PortfolioMode"));
const AnalysisMode = React.lazy(() => import("./modes/AnalysisCanvas"));
const IntelligenceMode = React.lazy(() => import("./modes/IntelligenceCanvas"));
const AppealsMode = React.lazy(() => import("./modes/AppealsCanvas"));
const ResultsMode = React.lazy(() => import("./modes/ResultsCanvas"));

export const CanvasOrchestrator: React.FC = () => {
  const { mode } = useCanvasContext();

  console.log("🧠 Current CanvasMode:", mode);

  const renderMode = () => {
    switch (mode) {
      case CanvasMode.Portfolio:
        console.log("🖼 Rendering: PortfolioMode");
        return <PortfolioMode />;
      case CanvasMode.Analysis:
        console.log("🖼 Rendering: AnalysisMode");
        return <AnalysisMode />;
      case CanvasMode.Intelligence:
        console.log("🖼 Rendering: IntelligenceMode");
        return <IntelligenceMode />;
      case CanvasMode.Appeals:
        console.log("🖼 Rendering: AppealsMode");
        return <AppealsMode />;
      case CanvasMode.Results:
        console.log("🖼 Rendering: ResultsMode");
        return <ResultsMode />;
      default:
        console.log("❌ Invalid CanvasMode, rendering fallback");
        return <div className="p-8 text-gray-500">Invalid mode</div>;
    }
  };

  return (
    <Suspense fallback={<Skeleton className="h-full w-full" />}>
      {renderMode()}
    </Suspense>
  );
};

export default CanvasOrchestrator;
