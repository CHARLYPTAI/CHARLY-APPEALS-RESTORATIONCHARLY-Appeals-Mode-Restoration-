// src/components/v2/CanvasContext.tsx

import React, { createContext, useContext, useState } from "react";

export enum CanvasMode {
  Portfolio = "portfolio",
  Analysis = "analysis",
  Intelligence = "intelligence",
  Appeals = "appeals",
  Results = "results",
}

interface CanvasContextType {
  mode: CanvasMode;
  setMode: (mode: CanvasMode) => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<CanvasMode>(CanvasMode.Portfolio);

  return (
    <CanvasContext.Provider value={{ mode, setMode }}>
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvasContext = (): CanvasContextType => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvasContext must be used within a CanvasContextProvider");
  }
  return context;
};
