// 🍎 Intelligence Page - AI-Powered Property Tax Insights
// "Innovation distinguishes between a leader and a follower" - Steve Jobs

import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { LoadingDots } from '../components/LoadingDots';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { TRANSITIONS } from '../design/animations';
import { authenticatedRequest } from '../lib/auth';

// AI Intelligence Data Structures
interface AIInsight {
  id: string;
  type: 'prediction' | 'recommendation' | 'alert' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  category: string;
  actionable: boolean;
  estimatedSavings?: number;
}

interface PredictionModel {
  id: string;
  name: string;
  description: string;
  accuracy: number;
  lastTrained: string;
  predictions: number;
  status: 'active' | 'training' | 'inactive';
}

interface MarketPrediction {
  timeframe: string;
  assessmentTrend: 'increasing' | 'decreasing' | 'stable';
  confidenceLevel: number;
  predictedChange: number;
  factors: string[];
}

interface PropertyScore {
  address: string;
  aiScore: number;
  appealProbability: number;
  estimatedSavings: number;
  riskFactors: string[];
  opportunities: string[];
}

const Intelligence: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [models, setModels] = useState<PredictionModel[]>([]);
  const [predictions, setPredictions] = useState<MarketPrediction[]>([]);
  const [propertyScores, setPropertyScores] = useState<PropertyScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'models' | 'predictions' | 'scores'>('insights');

  useEffect(() => {
    loadIntelligenceData();
  }, []);

  const loadIntelligenceData = async () => {
    try {
      setLoading(true);
      
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI insights
      setInsights([
        {
          id: '1',
          type: 'opportunity',
          title: 'High-Value Appeal Opportunity Detected',
          description: '123 Main St shows 34% over-assessment compared to comparable properties in the same neighborhood.',
          confidence: 92,
          impact: 'high',
          category: 'Property Assessment',
          actionable: true,
          estimatedSavings: 28000
        },
        {
          id: '2',
          type: 'prediction',
          title: 'Market Assessment Trend Shift',
          description: 'AI models predict a 12% increase in property assessments for Q2 2024 based on recent sales data.',
          confidence: 87,
          impact: 'medium',
          category: 'Market Trends',
          actionable: false
        },
        {
          id: '3',
          type: 'alert',
          title: 'Appeal Deadline Approaching',
          description: '5 properties in your portfolio have appeal deadlines within the next 30 days.',
          confidence: 100,
          impact: 'high',
          category: 'Deadlines',
          actionable: true
        },
        {
          id: '4',
          type: 'recommendation',
          title: 'Neighborhood Strategy Update',
          description: 'East Austin shows 89% appeal success rate. Consider prioritizing properties in this area.',
          confidence: 78,
          impact: 'medium',
          category: 'Strategy',
          actionable: true,
          estimatedSavings: 156000
        }
      ]);

      // Mock prediction models
      setModels([
        {
          id: '1',
          name: 'Property Valuation AI',
          description: 'Machine learning model trained on 50K+ property assessments and sales data',
          accuracy: 94.2,
          lastTrained: '2024-08-10',
          predictions: 15420,
          status: 'active'
        },
        {
          id: '2',
          name: 'Appeal Success Predictor',
          description: 'Neural network predicting appeal outcomes based on property characteristics and historical data',
          accuracy: 87.6,
          lastTrained: '2024-08-08',
          predictions: 8945,
          status: 'active'
        },
        {
          id: '3',
          name: 'Market Trend Analyzer',
          description: 'Time series analysis model for predicting assessment trends and market movements',
          accuracy: 82.1,
          lastTrained: '2024-08-12',
          predictions: 3201,
          status: 'training'
        }
      ]);

      // Mock market predictions
      setPredictions([
        {
          timeframe: 'Next 6 Months',
          assessmentTrend: 'increasing',
          confidenceLevel: 89,
          predictedChange: 8.5,
          factors: ['Rising home prices', 'New construction', 'Infrastructure improvements']
        },
        {
          timeframe: 'Next 12 Months',
          assessmentTrend: 'increasing',
          confidenceLevel: 76,
          predictedChange: 15.2,
          factors: ['Market appreciation', 'Tax revenue needs', 'Commercial development']
        },
        {
          timeframe: 'Next 24 Months',
          assessmentTrend: 'stable',
          confidenceLevel: 62,
          predictedChange: 3.1,
          factors: ['Market stabilization', 'Economic factors', 'Policy changes']
        }
      ]);

      // Mock property AI scores
      setPropertyScores([
        {
          address: '123 Main St',
          aiScore: 94,
          appealProbability: 87,
          estimatedSavings: 28000,
          riskFactors: ['Over-assessed by 34%', 'Recent sales below assessment'],
          opportunities: ['Strong comparable sales data', 'High neighborhood success rate']
        },
        {
          address: '456 Oak Ave',
          aiScore: 78,
          appealProbability: 65,
          estimatedSavings: 18500,
          riskFactors: ['Moderate over-assessment', 'Limited comparable data'],
          opportunities: ['Recent property improvements', 'Market trend favorable']
        },
        {
          address: '789 Business Blvd',
          aiScore: 92,
          appealProbability: 82,
          estimatedSavings: 45000,
          riskFactors: ['Commercial property complexity', 'Income approach needed'],
          opportunities: ['Vacancy issues', 'Market downturn evidence']
        }
      ]);

    } catch (error) {
      console.error('Failed to load intelligence data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div style={styles.loadingContainer}>
          <LoadingDots size="lg" />
          <p style={styles.loadingText}>Processing AI insights...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'insights':
        return <AIInsights insights={insights} />;
      case 'models':
        return <PredictionModels models={models} />;
      case 'predictions':
        return <MarketPredictions predictions={predictions} />;
      case 'scores':
        return <PropertyScores scores={propertyScores} />;
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'insights' as const, label: 'AI Insights', icon: '🧠' },
    { id: 'models' as const, label: 'ML Models', icon: '🤖' },
    { id: 'predictions' as const, label: 'Market Predictions', icon: '🔮' },
    { id: 'scores' as const, label: 'Property Scores', icon: '⭐' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>AI Intelligence Center</h1>
        <p style={styles.subtitle}>
          Machine learning-powered insights for property tax appeals and market intelligence
        </p>
      </div>

      <div style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              <span style={styles.tabLabel}>{tab.label}</span>
              {isActive && <div style={styles.activeIndicator} />}
            </button>
          );
        })}
      </div>

      <div style={styles.content}>
        {renderTabContent()}
      </div>
    </div>
  );
};

// AI Insights Component
interface AIInsightsProps {
  insights: AIInsight[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ insights }) => {
  const getInsightColor = (type: string, impact: string) => {
    if (type === 'alert') return APPLE_COLORS.RED;
    if (type === 'opportunity') return APPLE_COLORS.GREEN;
    if (type === 'prediction') return APPLE_COLORS.BLUE;
    if (impact === 'high') return APPLE_COLORS.ORANGE;
    return NEUTRAL_COLORS.GRAY_600;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return '💡';
      case 'prediction': return '📊';
      case 'alert': return '⚠️';
      case 'recommendation': return '🎯';
      default: return '💭';
    }
  };

  return (
    <div style={styles.tabContent}>
      <div style={styles.insightsHeader}>
        <h3 style={styles.sectionTitle}>Real-Time AI Insights</h3>
        <p style={styles.sectionDescription}>
          AI-powered analysis of your property portfolio and market conditions
        </p>
      </div>

      <div style={styles.insightsGrid}>
        {insights.map((insight) => (
          <div key={insight.id} style={styles.insightCard}>
            <div style={styles.insightHeader}>
              <div style={styles.insightMeta}>
                <span style={styles.insightIcon}>{getInsightIcon(insight.type)}</span>
                <span style={styles.insightCategory}>{insight.category}</span>
              </div>
              <div style={styles.confidenceBadge}>
                <span style={styles.confidenceText}>{insight.confidence}%</span>
              </div>
            </div>
            
            <h4 style={{...styles.insightTitle, color: getInsightColor(insight.type, insight.impact)}}>
              {insight.title}
            </h4>
            
            <p style={styles.insightDescription}>{insight.description}</p>
            
            <div style={styles.insightFooter}>
              {insight.estimatedSavings && (
                <span style={styles.savingsAmount}>
                  Potential Savings: ${insight.estimatedSavings.toLocaleString()}
                </span>
              )}
              {insight.actionable && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => console.log('Take action:', insight.id)}
                >
                  Take Action
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Prediction Models Component
interface PredictionModelsProps {
  models: PredictionModel[];
}

const PredictionModels: React.FC<PredictionModelsProps> = ({ models }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return APPLE_COLORS.GREEN;
      case 'training': return APPLE_COLORS.ORANGE;
      case 'inactive': return NEUTRAL_COLORS.GRAY_500;
      default: return NEUTRAL_COLORS.GRAY_500;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '✅';
      case 'training': return '🔄';
      case 'inactive': return '⏸️';
      default: return '❓';
    }
  };

  return (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>Machine Learning Models</h3>
      <p style={styles.sectionDescription}>
        Advanced AI models powering property tax appeal predictions and market analysis
      </p>
      
      <div style={styles.modelsGrid}>
        {models.map((model) => (
          <div key={model.id} style={styles.modelCard}>
            <div style={styles.modelHeader}>
              <div style={styles.modelStatus}>
                <span style={styles.statusIcon}>{getStatusIcon(model.status)}</span>
                <span style={{...styles.statusText, color: getStatusColor(model.status)}}>
                  {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                </span>
              </div>
              <div style={styles.accuracyBadge}>
                <span style={styles.accuracyText}>{model.accuracy}% Accuracy</span>
              </div>
            </div>
            
            <h4 style={styles.modelName}>{model.name}</h4>
            <p style={styles.modelDescription}>{model.description}</p>
            
            <div style={styles.modelStats}>
              <div style={styles.stat}>
                <span style={styles.statLabel}>Predictions Made</span>
                <span style={styles.statValue}>{model.predictions.toLocaleString()}</span>
              </div>
              <div style={styles.stat}>
                <span style={styles.statLabel}>Last Trained</span>
                <span style={styles.statValue}>{model.lastTrained}</span>
              </div>
            </div>
            
            <div style={styles.modelActions}>
              <Button variant="secondary" size="sm">View Details</Button>
              {model.status === 'active' && (
                <Button variant="primary" size="sm">Retrain Model</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Market Predictions Component
interface MarketPredictionsProps {
  predictions: MarketPrediction[];
}

const MarketPredictions: React.FC<MarketPredictionsProps> = ({ predictions }) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return APPLE_COLORS.RED;
      case 'decreasing': return APPLE_COLORS.GREEN;
      case 'stable': return APPLE_COLORS.BLUE;
      default: return NEUTRAL_COLORS.GRAY_500;
    }
  };

  return (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>Market Predictions & Forecasting</h3>
      <p style={styles.sectionDescription}>
        AI-powered predictions of property assessment trends and market movements
      </p>
      
      <div style={styles.predictionsGrid}>
        {predictions.map((prediction, index) => (
          <div key={index} style={styles.predictionCard}>
            <div style={styles.predictionHeader}>
              <span style={styles.timeframe}>{prediction.timeframe}</span>
              <div style={styles.confidenceIndicator}>
                <div 
                  style={{
                    ...styles.confidenceBar,
                    width: `${prediction.confidenceLevel}%`,
                    backgroundColor: prediction.confidenceLevel > 80 ? APPLE_COLORS.GREEN :
                                   prediction.confidenceLevel > 60 ? APPLE_COLORS.ORANGE : APPLE_COLORS.RED
                  }} 
                />
                <span style={styles.confidenceLabel}>{prediction.confidenceLevel}% Confidence</span>
              </div>
            </div>
            
            <div style={styles.trendDisplay}>
              <span style={styles.trendIcon}>{getTrendIcon(prediction.assessmentTrend)}</span>
              <div style={styles.trendInfo}>
                <span style={{...styles.trendText, color: getTrendColor(prediction.assessmentTrend)}}>
                  {prediction.assessmentTrend.charAt(0).toUpperCase() + prediction.assessmentTrend.slice(1)}
                </span>
                <span style={styles.changeAmount}>
                  {prediction.predictedChange > 0 ? '+' : ''}{prediction.predictedChange}%
                </span>
              </div>
            </div>
            
            <div style={styles.factors}>
              <h5 style={styles.factorsTitle}>Key Factors:</h5>
              <ul style={styles.factorsList}>
                {prediction.factors.map((factor, idx) => (
                  <li key={idx} style={styles.factor}>{factor}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Property Scores Component
interface PropertyScoresProps {
  scores: PropertyScore[];
}

const PropertyScores: React.FC<PropertyScoresProps> = ({ scores }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return APPLE_COLORS.GREEN;
    if (score >= 70) return APPLE_COLORS.ORANGE;
    return APPLE_COLORS.RED;
  };

  return (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>AI Property Scores</h3>
      <p style={styles.sectionDescription}>
        Machine learning-generated scores indicating appeal potential and estimated savings
      </p>
      
      <div style={styles.scoresGrid}>
        {scores.map((score, index) => (
          <div key={index} style={styles.scoreCard}>
            <div style={styles.scoreHeader}>
              <h4 style={styles.propertyAddress}>{score.address}</h4>
              <div style={styles.scoreDisplay}>
                <span style={{...styles.aiScore, color: getScoreColor(score.aiScore)}}>
                  {score.aiScore}
                </span>
                <span style={styles.scoreLabel}>AI Score</span>
              </div>
            </div>
            
            <div style={styles.scoreMetrics}>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Appeal Probability</span>
                <span style={{...styles.metricValue, color: APPLE_COLORS.BLUE}}>
                  {score.appealProbability}%
                </span>
              </div>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Estimated Savings</span>
                <span style={{...styles.metricValue, color: APPLE_COLORS.GREEN}}>
                  ${score.estimatedSavings.toLocaleString()}
                </span>
              </div>
            </div>
            
            <div style={styles.factors}>
              <div style={styles.factorSection}>
                <h5 style={styles.factorTitle}>Risk Factors:</h5>
                <ul style={styles.factorList}>
                  {score.riskFactors.map((factor, idx) => (
                    <li key={idx} style={{...styles.factorItem, color: APPLE_COLORS.RED}}>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div style={styles.factorSection}>
                <h5 style={styles.factorTitle}>Opportunities:</h5>
                <ul style={styles.factorList}>
                  {score.opportunities.map((opp, idx) => (
                    <li key={idx} style={{...styles.factorItem, color: APPLE_COLORS.GREEN}}>
                      {opp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div style={styles.scoreActions}>
              <Button variant="primary" size="sm">Start Appeal</Button>
              <Button variant="secondary" size="sm">View Analysis</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: SPACING.LG,
  },

  header: {
    textAlign: 'center' as const,
    marginBottom: SPACING.XXL,
  },

  title: {
    fontSize: '36px',
    fontWeight: 700,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.SM,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  subtitle: {
    fontSize: '18px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
  },

  tabBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: SPACING.SM,
    marginBottom: SPACING.XXL,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
    paddingBottom: SPACING.SM,
  },

  tab: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.SM,
    padding: `${SPACING.MD} ${SPACING.LG}`,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: TRANSITIONS.STANDARD,
    fontSize: '14px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_600,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  tabActive: {
    color: APPLE_COLORS.BLUE,
    backgroundColor: `${APPLE_COLORS.BLUE}08`,
  },

  tabIcon: {
    fontSize: '18px',
  },

  tabLabel: {
    fontSize: '14px',
    fontWeight: 500,
  },

  activeIndicator: {
    position: 'absolute' as const,
    bottom: '-9px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '40px',
    height: '2px',
    backgroundColor: APPLE_COLORS.BLUE,
    borderRadius: '1px',
  },

  content: {
    minHeight: '600px',
  },

  tabContent: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '12px',
    padding: SPACING.XXL,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: SPACING.LG,
  },

  loadingText: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
  },

  sectionTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.SM,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  sectionDescription: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    marginBottom: SPACING.XL,
    lineHeight: 1.5,
  },

  // AI Insights Styles
  insightsHeader: {
    marginBottom: SPACING.XL,
  },

  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: SPACING.LG,
  },

  insightCard: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
    borderRadius: '12px',
    padding: SPACING.LG,
  },

  insightHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },

  insightMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.SM,
  },

  insightIcon: {
    fontSize: '20px',
  },

  insightCategory: {
    fontSize: '12px',
    color: NEUTRAL_COLORS.GRAY_500,
    fontWeight: 500,
  },

  confidenceBadge: {
    backgroundColor: `${APPLE_COLORS.GREEN}15`,
    padding: `${SPACING.XS} ${SPACING.SM}`,
    borderRadius: '6px',
  },

  confidenceText: {
    fontSize: '12px',
    fontWeight: 600,
    color: APPLE_COLORS.GREEN,
  },

  insightTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
    marginBottom: SPACING.SM,
  },

  insightDescription: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    lineHeight: 1.5,
    margin: 0,
    marginBottom: SPACING.LG,
  },

  insightFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  savingsAmount: {
    fontSize: '14px',
    fontWeight: 600,
    color: APPLE_COLORS.GREEN,
  },

  // Models Styles
  modelsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: SPACING.LG,
  },

  modelCard: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
    borderRadius: '12px',
    padding: SPACING.LG,
  },

  modelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },

  modelStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.XS,
  },

  statusIcon: {
    fontSize: '16px',
  },

  statusText: {
    fontSize: '14px',
    fontWeight: 600,
  },

  accuracyBadge: {
    backgroundColor: `${APPLE_COLORS.BLUE}15`,
    padding: `${SPACING.XS} ${SPACING.SM}`,
    borderRadius: '6px',
  },

  accuracyText: {
    fontSize: '12px',
    fontWeight: 600,
    color: APPLE_COLORS.BLUE,
  },

  modelName: {
    fontSize: '20px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.SM,
  },

  modelDescription: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    lineHeight: 1.5,
    margin: 0,
    marginBottom: SPACING.LG,
  },

  modelStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: SPACING.MD,
    marginBottom: SPACING.LG,
  },

  stat: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.XS,
  },

  statLabel: {
    fontSize: '12px',
    color: NEUTRAL_COLORS.GRAY_500,
    fontWeight: 500,
  },

  statValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
  },

  modelActions: {
    display: 'flex',
    gap: SPACING.SM,
  },

  // Predictions Styles
  predictionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: SPACING.LG,
  },

  predictionCard: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
    borderRadius: '12px',
    padding: SPACING.LG,
  },

  predictionHeader: {
    marginBottom: SPACING.LG,
  },

  timeframe: {
    fontSize: '18px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    marginBottom: SPACING.MD,
    display: 'block',
  },

  confidenceIndicator: {
    position: 'relative' as const,
    backgroundColor: NEUTRAL_COLORS.GRAY_100,
    borderRadius: '8px',
    height: '6px',
    marginBottom: SPACING.SM,
  },

  confidenceBar: {
    height: '100%',
    borderRadius: '8px',
    transition: TRANSITIONS.STANDARD,
  },

  confidenceLabel: {
    fontSize: '12px',
    color: NEUTRAL_COLORS.GRAY_600,
    fontWeight: 500,
  },

  trendDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.MD,
    marginBottom: SPACING.LG,
  },

  trendIcon: {
    fontSize: '32px',
  },

  trendInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.XS,
  },

  trendText: {
    fontSize: '16px',
    fontWeight: 600,
  },

  changeAmount: {
    fontSize: '20px',
    fontWeight: 700,
    color: NEUTRAL_COLORS.GRAY_900,
  },

  factors: {
    marginTop: SPACING.LG,
  },

  factorsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.SM,
  },

  factorsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },

  factor: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    marginBottom: SPACING.XS,
    paddingLeft: SPACING.SM,
    position: 'relative' as const,
  },

  // Property Scores Styles
  scoresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: SPACING.LG,
  },

  scoreCard: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
    borderRadius: '12px',
    padding: SPACING.LG,
  },

  scoreHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },

  propertyAddress: {
    fontSize: '18px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
  },

  scoreDisplay: {
    textAlign: 'center' as const,
  },

  aiScore: {
    fontSize: '36px',
    fontWeight: 700,
    display: 'block',
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  scoreLabel: {
    fontSize: '12px',
    color: NEUTRAL_COLORS.GRAY_500,
    fontWeight: 500,
  },

  scoreMetrics: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: SPACING.MD,
    marginBottom: SPACING.LG,
  },

  metric: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.XS,
  },

  metricLabel: {
    fontSize: '12px',
    color: NEUTRAL_COLORS.GRAY_500,
    fontWeight: 500,
  },

  metricValue: {
    fontSize: '18px',
    fontWeight: 600,
  },

  factorSection: {
    marginBottom: SPACING.MD,
  },

  factorTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.SM,
  },

  factorList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },

  factorItem: {
    fontSize: '13px',
    marginBottom: SPACING.XS,
    paddingLeft: SPACING.SM,
    position: 'relative' as const,
  },

  scoreActions: {
    display: 'flex',
    gap: SPACING.SM,
    marginTop: SPACING.LG,
  },
} as const;

export default Intelligence;