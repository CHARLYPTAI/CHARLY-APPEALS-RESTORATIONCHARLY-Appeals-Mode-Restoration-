// src/components/v2/WorkflowNavigation.tsx

import React from "react"
import { CanvasMode, useCanvasContext } from "@/components/v2/CanvasContext"
import { cn } from "@/lib/utils"

const tabs: { mode: CanvasMode; label: string; icon: string }[] = [
  { mode: CanvasMode.Portfolio, label: "Portfolio", icon: "🏢" },
  { mode: CanvasMode.Analysis, label: "Analysis", icon: "📊" },
  { mode: CanvasMode.Intelligence, label: "Intelligence", icon: "🧠" },
  { mode: CanvasMode.Appeals, label: "Appeals", icon: "⚖️" },
  { mode: CanvasMode.Results, label: "Results", icon: "🏆" },
]

export const WorkflowNavigation: React.FC = () => {
  const { mode, setMode } = useCanvasContext()

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex gap-6 px-6 py-3 rounded-full border border-white/30 shadow-2xl backdrop-blur-xl bg-white/70 dark:bg-white/10 transition-all duration-300">
        {tabs.map((tab) => {
          const isActive = tab.mode === mode
          return (
            <button
              key={tab.label}
              onClick={() => setMode(tab.mode)}
              className={cn(
                "flex flex-col items-center text-xs font-medium transition-all duration-300 ease-in-out",
                isActive
                  ? "text-primary-600 scale-110"
                  : "text-neutral-500 hover:text-neutral-800 hover:scale-105"
              )}
            >
              <div className="text-xl">{tab.icon}</div>
              <div className="mt-0.5">{tab.label}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default WorkflowNavigation
