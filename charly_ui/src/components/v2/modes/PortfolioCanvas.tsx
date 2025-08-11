import React from "react"
import { useCanvasContext } from "@/components/v2/CanvasContext"
import ExpandableCard from "@/components/v2/ExpandableCard"

export default function PortfolioCanvas() {
  let highlight: string | undefined = undefined

  try {
    const ctx = useCanvasContext()
    highlight = ctx?.workflow?.context?.highlight
  } catch (err) {
    console.error("CanvasContext not available:", err)
  }

  return (
    <main className="px-8 pt-16 pb-32 space-y-16 text-body text-gray-900 dark:text-white">
      <h1 className="text-title-medium font-semibold">🏢 Portfolio Mode</h1>

      <ExpandableCard
        title="Overassessment Detected"
        highlighted={highlight === "overassessment"}
      >
        <p className="text-body">
          Property appears to be assessed <span className="font-mono">28%</span> above market comps.
        </p>
        <p className="text-caption mt-1 text-gray-500 dark:text-gray-400">
          Consider running a comp-backed challenge or income approach justification.
        </p>
      </ExpandableCard>

      <ExpandableCard
        title="Vacancy Anomaly"
        highlighted={highlight === "vacancy"}
      >
        <p className="text-body">
          Vacancy rate is <span className="font-mono">37%</span> higher than county reported norm.
        </p>
        <p className="text-caption mt-1 text-gray-500 dark:text-gray-400">
          Flag likely to support market adjustment.
        </p>
      </ExpandableCard>

      <ExpandableCard
        title="Expense Ratio Outlier"
        highlighted={highlight === "expenses"}
      >
        <p className="text-body">
          Expense ratio exceeds <span className="font-mono">65%</span> — well beyond accepted standards.
        </p>
        <p className="text-caption mt-1 text-gray-500 dark:text-gray-400">
          Justifies appeal via operational inefficiency or cap rate revision.
        </p>
      </ExpandableCard>
    </main>
  )
}
