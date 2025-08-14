import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAdaptiveColor } from './AdaptiveColorEngine';

interface PropertyData {
  assessed_value?: number;
  market_value?: number;
  tax_amount?: number;
  noi?: number;
  cap_rate?: number;
  expense_ratio?: number;
  value_change?: number;
  tax_change?: number;
  flag_status?: string;
  appeal_potential?: number;
}

interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral';
  confidence: number;
  factors: {
    assessment: 'over' | 'under' | 'fair';
    tax_burden: 'high' | 'medium' | 'low';
    market_trend: 'rising' | 'falling' | 'stable';
    appeal_viability: 'strong' | 'moderate' | 'weak';
  };
  score: number; // -1 to 1
}

interface SentimentColorMapping {
  sentiment: 'positive' | 'negative' | 'neutral';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background?: string;
    text?: string;
  };
  intensity: number; // 0-1
}

interface SentimentColorContextType {
  analyzeSentiment: (data: PropertyData) => SentimentAnalysis;
  applyColorMapping: (analysis: SentimentAnalysis) => void;
  getColorForValue: (value: number, baseline: number, category: 'financial' | 'tax' | 'assessment') => string;
  createDataVisualizationPalette: (dataSet: PropertyData[]) => string[];
  currentSentiment: SentimentAnalysis | null;
  isAnalyzing: boolean;
}

const SentimentColorContext = createContext<SentimentColorContextType | undefined>(undefined);

export const SentimentColorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { updateColor, applyDataSentiment, currentPalette, isDarkMode } = useAdaptiveColor();
  const [currentSentiment, setCurrentSentiment] = useState<SentimentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Sentiment analysis algorithm
  const analyzeSentiment = useCallback((data: PropertyData): SentimentAnalysis => {
    setIsAnalyzing(true);
    
    const factors = {
      assessment: 'fair' as 'over' | 'under' | 'fair',
      tax_burden: 'medium' as 'high' | 'medium' | 'low',
      market_trend: 'stable' as 'rising' | 'falling' | 'stable',
      appeal_viability: 'moderate' as 'strong' | 'moderate' | 'weak'
    };
    
    let score = 0;
    let confidence = 0;
    let factorCount = 0;

    // Assessment analysis
    if (data.assessed_value && data.market_value) {
      const assessmentRatio = data.assessed_value / data.market_value;
      if (assessmentRatio > 1.1) {
        factors.assessment = 'over';
        score -= 0.3;
      } else if (assessmentRatio < 0.9) {
        factors.assessment = 'under';
        score += 0.2;
      }
      confidence += 0.25;
      factorCount++;
    }

    // Tax burden analysis
    if (data.tax_amount && data.market_value) {
      const taxRate = data.tax_amount / data.market_value;
      if (taxRate > 0.025) {
        factors.tax_burden = 'high';
        score -= 0.2;
      } else if (taxRate < 0.015) {
        factors.tax_burden = 'low';
        score += 0.1;
      }
      confidence += 0.2;
      factorCount++;
    }

    // Market trend analysis
    if (data.value_change !== undefined) {
      if (data.value_change > 0.05) {
        factors.market_trend = 'rising';
        score += 0.1;
      } else if (data.value_change < -0.05) {
        factors.market_trend = 'falling';
        score -= 0.1;
      }
      confidence += 0.15;
      factorCount++;
    }

    // Appeal viability analysis
    if (data.appeal_potential !== undefined) {
      if (data.appeal_potential > 0.7) {
        factors.appeal_viability = 'strong';
        score -= 0.4; // Strong appeal potential = negative for current situation
      } else if (data.appeal_potential < 0.3) {
        factors.appeal_viability = 'weak';
        score += 0.1;
      }
      confidence += 0.3;
      factorCount++;
    }

    // Cap rate analysis
    if (data.cap_rate !== undefined) {
      if (data.cap_rate > 0.08) {
        score += 0.15; // High cap rate = positive
      } else if (data.cap_rate < 0.04) {
        score -= 0.1; // Low cap rate = negative
      }
      confidence += 0.1;
      factorCount++;
    }

    // Normalize score and confidence
    score = Math.max(-1, Math.min(1, score));
    confidence = Math.min(1, confidence);

    // Determine overall sentiment
    let overall: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (score > 0.2) {
      overall = 'positive';
    } else if (score < -0.2) {
      overall = 'negative';
    }

    const analysis: SentimentAnalysis = {
      overall,
      confidence,
      factors,
      score
    };

    setCurrentSentiment(analysis);
    setIsAnalyzing(false);
    
    return analysis;
  }, []);

  // Color mapping based on sentiment
  const getSentimentColorMapping = useCallback((analysis: SentimentAnalysis): SentimentColorMapping => {
    const intensity = Math.abs(analysis.score);
    
    const colorMappings = {
      positive: {
        primary: isDarkMode ? '#32D74B' : '#34C759',
        secondary: isDarkMode ? '#30DB43' : '#36C95B',
        accent: isDarkMode ? '#2EDD3B' : '#38CB5D',
        background: isDarkMode ? '#0A2E0A' : '#F0FFF0',
        text: isDarkMode ? '#FFFFFF' : '#000000'
      },
      negative: {
        primary: isDarkMode ? '#FF453A' : '#FF3B30',
        secondary: isDarkMode ? '#FF4742' : '#FF3D32',
        accent: isDarkMode ? '#FF494A' : '#FF3F34',
        background: isDarkMode ? '#2E0A0A' : '#FFF0F0',
        text: isDarkMode ? '#FFFFFF' : '#000000'
      },
      neutral: {
        primary: isDarkMode ? '#0A84FF' : '#007AFF',
        secondary: isDarkMode ? '#5E5CE6' : '#5856D6',
        accent: isDarkMode ? '#BF5AF2' : '#AF52DE',
        background: isDarkMode ? '#1C1C1E' : '#F2F2F7',
        text: isDarkMode ? '#FFFFFF' : '#000000'
      }
    };

    return {
      sentiment: analysis.overall,
      colors: colorMappings[analysis.overall],
      intensity
    };
  }, [isDarkMode]);

  // Apply color mapping to the color system
  const applyColorMapping = useCallback((analysis: SentimentAnalysis) => {
    const mapping = getSentimentColorMapping(analysis);
    
    // Apply colors based on sentiment with intensity modulation
    const alpha = Math.min(1, mapping.intensity + 0.3); // Ensure minimum visibility
    
    // Update primary colors
    updateColor('primary', mapping.colors.primary);
    updateColor('secondary', mapping.colors.secondary);
    updateColor('accent', mapping.colors.accent);
    
    // Update semantic colors based on sentiment
    if (analysis.overall === 'negative') {
      updateColor('semantic.error', mapping.colors.primary);
      updateColor('semantic.warning', mapping.colors.secondary);
    } else if (analysis.overall === 'positive') {
      updateColor('semantic.success', mapping.colors.primary);
      updateColor('semantic.info', mapping.colors.secondary);
    }
    
    // Use the AdaptiveColorEngine's applyDataSentiment function
    applyDataSentiment(analysis.overall);
  }, [getSentimentColorMapping, updateColor, applyDataSentiment]);

  // Get color for specific value comparison
  const getColorForValue = useCallback((
    value: number, 
    baseline: number, 
    category: 'financial' | 'tax' | 'assessment'
  ): string => {
    const ratio = value / baseline;
    const deviation = Math.abs(ratio - 1);
    
    const categoryColors = {
      financial: {
        positive: isDarkMode ? '#32D74B' : '#34C759',
        negative: isDarkMode ? '#FF453A' : '#FF3B30',
        neutral: isDarkMode ? '#0A84FF' : '#007AFF'
      },
      tax: {
        positive: isDarkMode ? '#32D74B' : '#34C759', // Lower tax is positive
        negative: isDarkMode ? '#FF453A' : '#FF3B30', // Higher tax is negative
        neutral: isDarkMode ? '#8E8E93' : '#8E8E93'
      },
      assessment: {
        positive: isDarkMode ? '#32D74B' : '#34C759', // Under-assessed is positive
        negative: isDarkMode ? '#FF453A' : '#FF3B30', // Over-assessed is negative
        neutral: isDarkMode ? '#8E8E93' : '#8E8E93'
      }
    };

    if (deviation < 0.05) {
      return categoryColors[category].neutral;
    }

    if (category === 'financial') {
      return ratio > 1 ? categoryColors[category].positive : categoryColors[category].negative;
    } else if (category === 'tax') {
      return ratio > 1 ? categoryColors[category].negative : categoryColors[category].positive;
    } else { // assessment
      return ratio > 1 ? categoryColors[category].negative : categoryColors[category].positive;
    }
  }, [isDarkMode]);

  // Create data visualization palette
  const createDataVisualizationPalette = useCallback((dataSet: PropertyData[]): string[] => {
    if (dataSet.length === 0) return currentPalette.chart.trend;
    
    const sentiments = dataSet.map(data => analyzeSentiment(data));
    const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
    
    const baseColors = {
      positive: ['#32D74B', '#30DB43', '#2EDD3B', '#2CDF33', '#2AE12B'],
      negative: ['#FF453A', '#FF4742', '#FF494A', '#FF4B52', '#FF4D5A'],
      neutral: ['#0A84FF', '#5E5CE6', '#BF5AF2', '#FF375F', '#FF9F0A']
    };
    
    let palette: string[];
    
    if (avgScore > 0.2) {
      palette = baseColors.positive;
    } else if (avgScore < -0.2) {
      palette = baseColors.negative;
    } else {
      palette = baseColors.neutral;
    }
    
    // Adjust colors based on data distribution
    const scores = sentiments.map(s => s.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const range = maxScore - minScore;
    
    if (range > 0.5) {
      // High variation - use full spectrum
      return palette.concat(palette.reverse());
    } else {
      // Low variation - use similar colors
      return palette.slice(0, 3);
    }
  }, [currentPalette.chart.trend, analyzeSentiment]);

  // Auto-analyze sentiment when property data changes
  useEffect(() => {
    const handlePropertyUpdate = (event: CustomEvent<PropertyData>) => {
      const analysis = analyzeSentiment(event.detail);
      applyColorMapping(analysis);
    };

    window.addEventListener('propertyDataUpdate', handlePropertyUpdate as EventListener);
    return () => window.removeEventListener('propertyDataUpdate', handlePropertyUpdate as EventListener);
  }, [analyzeSentiment, applyColorMapping]);

  const value: SentimentColorContextType = {
    analyzeSentiment,
    applyColorMapping,
    getColorForValue,
    createDataVisualizationPalette,
    currentSentiment,
    isAnalyzing
  };

  return (
    <SentimentColorContext.Provider value={value}>
      {children}
    </SentimentColorContext.Provider>
  );
};

export const useSentimentColor = () => {
  const context = useContext(SentimentColorContext);
  if (!context) {
    throw new Error('useSentimentColor must be used within a SentimentColorProvider');
  }
  return context;
};

// Utility hook for automatic sentiment analysis
export const usePropertySentiment = (propertyData: PropertyData | null) => {
  const { analyzeSentiment, applyColorMapping, getColorForValue } = useSentimentColor();
  const [analysis, setAnalysis] = useState<SentimentAnalysis | null>(null);

  useEffect(() => {
    if (propertyData) {
      const result = analyzeSentiment(propertyData);
      setAnalysis(result);
      applyColorMapping(result);
    }
  }, [propertyData, analyzeSentiment, applyColorMapping]);

  return {
    analysis,
    getColorForValue: (value: number, baseline: number, category: 'financial' | 'tax' | 'assessment') =>
      getColorForValue(value, baseline, category)
  };
};

export default SentimentColorProvider;