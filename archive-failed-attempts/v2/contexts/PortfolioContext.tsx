import React, { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { Property } from "@/types/property";

type PortfolioContextType = {
  properties: Property[];
  selectedProperties: string[];
  showAddPropertyModal: boolean;
  setShowAddPropertyModal: (value: boolean) => void;
  showBulkActionsModal: boolean;
  setShowBulkActionsModal: (value: boolean) => void;
  newPropertyData: Partial<Property>;
  setNewPropertyData: (value: Partial<Property>) => void;
  isBulkProcessing: boolean;
  setIsBulkProcessing: (value: boolean) => void;
  sortedAndFilteredProperties: Property[];
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  compareProperties: (ids: string[]) => void;
  isAnalyzing: boolean;
  onAnalyzeProperties: (ids: string[]) => void;
  onFlagProperty: (id: string) => void;
  analysisResults: Record<string, any>;
  setSelectedProperties: (ids: string[]) => void;
};

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const usePortfolioContext = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolioContext must be used within a PortfolioContextProvider");
  }
  return context;
};

export const PortfolioContextProvider = ({ children }: { children: ReactNode }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
  const [newPropertyData, setNewPropertyData] = useState<Partial<Property>>({});
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Record<string, any>>({});

  const sortedAndFilteredProperties = useMemo(() => {
    let filtered = properties;
    
    if (filterStatus !== 'all') {
      filtered = properties.filter(p => p.appealStatus === filterStatus);
    }
    
    return filtered.sort((a, b) => a.address.localeCompare(b.address));
  }, [properties, filterStatus]);

  const compareProperties = (ids: string[]) => {
    // Implementation for comparing properties
    console.log('Comparing properties:', ids);
  };

  const onAnalyzeProperties = async (ids: string[]) => {
    setIsAnalyzing(true);
    try {
      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      const results: Record<string, any> = {};
      ids.forEach(id => {
        results[id] = { summary: 'Analysis complete' };
      });
      setAnalysisResults(prev => ({ ...prev, ...results }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onFlagProperty = (id: string) => {
    setProperties(prev => prev.map(p => 
      p.id === id ? { ...p, flaggedReasons: ['Flagged for review'] } : p
    ));
  };

  const value: PortfolioContextType = {
    properties,
    selectedProperties,
    showAddPropertyModal,
    setShowAddPropertyModal,
    showBulkActionsModal,
    setShowBulkActionsModal,
    newPropertyData,
    setNewPropertyData,
    isBulkProcessing,
    setIsBulkProcessing,
    sortedAndFilteredProperties,
    filterStatus,
    setFilterStatus,
    compareProperties,
    isAnalyzing,
    onAnalyzeProperties,
    onFlagProperty,
    analysisResults,
    setSelectedProperties,
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
};
