// src/pages/DashboardV3Working.tsx

import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { CanvasContextProvider, CanvasMode } from "@/components/v2/CanvasContext"
import { ThemeProvider } from "@/components/ui/theme"
import CanvasOrchestrator from "@/components/v2/CanvasOrchestrator"

const getModeFromParam = (modeParam: string | null): CanvasMode => {
  switch (modeParam?.toLowerCase()) {
    case "portfolio":
      return CanvasMode.Portfolio
    case "analysis":
      return CanvasMode.Analysis
    case "intelligence":
      return CanvasMode.Intelligence
    case "appeals":
      return CanvasMode.Appeals
    case "results":
      return CanvasMode.Results
    default:
      return CanvasMode.Portfolio
  }
}

export default function DashboardV3Working() {
  const [params] = useSearchParams()
  const modeParam = params.get("mode")
  const highlight = params.get("highlight")

  const initialMode = getModeFromParam(modeParam)

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <CanvasContextProvider
        initialMode={initialMode}
        user={{
          id: "george",
          role: "admin",
          preferences: {},
        }}
        workflow={{
          currentStep: 1,
          totalSteps: 4,
          context: {
            highlight,
          },
        }}
        properties={{
          selected: [],
          flagged: [],
          processing: [],
        }}
      >
        <CanvasOrchestrator />
      </CanvasContextProvider>
    </ThemeProvider>
  )
}
