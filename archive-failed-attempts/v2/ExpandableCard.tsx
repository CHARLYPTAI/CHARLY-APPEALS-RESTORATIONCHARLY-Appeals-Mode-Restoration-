import React, { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface ExpandableCardProps {
  title: string
  children: React.ReactNode
  highlighted?: boolean
}

const ExpandableCard: React.FC<ExpandableCardProps> = ({
  title,
  children,
  highlighted = false,
}) => {
  const [isOpen, setIsOpen] = useState(highlighted)
  const [pulse, setPulse] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)

  // Pulse + scroll into view if highlighted
  useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
      setPulse(true)
      setTimeout(() => setPulse(false), 1200)
    }
  }, [highlighted])

  return (
    <div
      ref={cardRef}
      className={cn(
        "rounded-xl border border-neutral-700 bg-neutral-900/70 backdrop-blur-md transition-all duration-300",
        pulse && "ring-2 ring-primary-500 ring-offset-2 ring-offset-black",
        isOpen ? "shadow-lg" : "shadow-sm"
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 text-label-medium font-medium text-white hover:bg-white/10 transition-colors duration-200"
      >
        <span>{title}</span>
        <span
          className={cn(
            "transition-transform duration-300 transform text-xl",
            isOpen ? "rotate-180" : "rotate-0"
          )}
        >
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {/* Content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-screen opacity-100 translate-y-0 px-6 pb-6" : "max-h-0 opacity-0 -translate-y-2"
        )}
      >
        {children}
      </div>
    </div>
  )
}

export default ExpandableCard
