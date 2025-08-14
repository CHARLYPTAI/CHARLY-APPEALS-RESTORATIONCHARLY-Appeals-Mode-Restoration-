// src/components/v2/CanvasOrchestrator.tsx

import React, { useEffect, useState } from "react"
import { CanvasMode, useCanvasContext } from "./CanvasContext"
import { IntelligentCanvas } from "./IntelligentCanvas"

const CanvasOrchestrator: React.FC = () => {
  const { mode } = useCanvasContext()
  const [activeMode, setActiveMode] = useState<CanvasMode>(mode)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (mode !== activeMode) {
      setFading(true)
      const fadeOut = setTimeout(() => {
        setActiveMode(mode)
        setFading(false)
      }, 300) // 300ms crossfade

      return () => clearTimeout(fadeOut)
    }
  }, [mode, activeMode])

  return (
    <div
      className={`transition-opacity duration-300 ease-in-out ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <IntelligentCanvas key={activeMode} />
    </div>
  )
}

export default CanvasOrchestrator
