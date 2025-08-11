// src/components/v2/IntelligentCanvas.tsx

import React, { Suspense } from "react"
import { CanvasMode, useCanvasContext } from "./CanvasContext"
import { cn } from "@/lib/utils"
import WorkflowNavigation from "./WorkflowNavigation"

const PortfolioCanvas = React.lazy(() => import("./modes/PortfolioCanvas"))
const AnalysisCanvas = React.lazy(() => import("./modes/AnalysisCanvas"))
const IntelligenceCanvas = React.lazy(() => import("./modes/IntelligenceCanvas"))
const AppealsCanvas = React.lazy(() => import("./modes/AppealsCanvas"))
const ResultsCanvas = React.lazy(() => import("./modes/ResultsCanvas"))

const modeComponents: Record<CanvasMode, React.LazyExoticComponent<React.FC>> = {
  [CanvasMode.Portfolio]: PortfolioCanvas,
  [CanvasMode.Analysis]: AnalysisCanvas,
  [CanvasMode.Intelligence]: IntelligenceCanvas,
  [CanvasMode.Appeals]: AppealsCanvas,
  [CanvasMode.Results]: ResultsCanvas,
}

export const IntelligentCanvas: React.FC = () => {
  const { mode } = useCanvasContext()
  const ModeComponent = modeComponents[mode]

  return (
    <>
      <div className="min-h-screen w-full relative bg-white dark:bg-black transition-colors duration-300">
        <Suspense fallback={<div className="p-10 text-gray-400 text-center">Loading mode...</div>}>
          <ModeComponent />
        </Suspense>
      </div>

      {/* Floating Navigation - Fixed Position */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <WorkflowNavigation />
      </div>
    </>
  )
}

export default IntelligentCanvas
