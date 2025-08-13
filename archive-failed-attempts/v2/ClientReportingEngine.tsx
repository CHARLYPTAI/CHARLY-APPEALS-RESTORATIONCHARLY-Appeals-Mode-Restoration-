// src/components/v2/ClientReportingEngine.tsx

import React from "react"

const ExpandableCard = ({ children }: { children: React.ReactNode }) => (
  <div className="border p-4 bg-gray-50 rounded-xl">{children}</div>
)

export const ClientReportingEngine = () => {
  return (
    <ExpandableCard>
      <h2 className="text-lg font-bold mb-2">Client Reporting</h2>
      <p>Placeholder report content goes here.</p>
    </ExpandableCard>
  )
}
