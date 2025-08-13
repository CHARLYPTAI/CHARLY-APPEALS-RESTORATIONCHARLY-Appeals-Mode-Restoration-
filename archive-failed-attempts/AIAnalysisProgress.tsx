import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  FileText, 
  DollarSign, 
  Zap, 
  CheckCircle, 
  Clock,
  RefreshCw,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  estimatedTime: number; // in seconds
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  startTime?: number;
  endTime?: number;
}

interface AIAnalysisProgressProps {
  isAnalyzing: boolean;
  currentStep?: string;
  onCancel?: () => void;
  propertyAddress?: string;
  analysisType?: 'comprehensive' | 'income' | 'sales' | 'cost';
}

const ANALYSIS_STEPS: Record<string, AnalysisStep[]> = {
  comprehensive: [
    {
      id: 'initialization',
      title: 'Initializing Analysis',
      description: 'Preparing property data and AI models',
      icon: Brain,
      estimatedTime: 3,
      status: 'pending'
    },
    {
      id: 'income_narrative',
      title: 'Income Approach Analysis',
      description: 'Generating income-based valuation narrative',
      icon: DollarSign,
      estimatedTime: 12,
      status: 'pending'
    },
    {
      id: 'sales_narrative',
      title: 'Sales Comparison Analysis',
      description: 'Analyzing comparable sales data',
      icon: TrendingUp,
      estimatedTime: 10,
      status: 'pending'
    },
    {
      id: 'cost_narrative',
      title: 'Cost Approach Analysis',
      description: 'Calculating replacement cost methodology',
      icon: Zap,
      estimatedTime: 8,
      status: 'pending'
    },
    {
      id: 'finalization',
      title: 'Finalizing Report',
      description: 'Compiling comprehensive analysis',
      icon: FileText,
      estimatedTime: 5,
      status: 'pending'
    }
  ],
  income: [
    {
      id: 'initialization',
      title: 'Initializing Analysis',
      description: 'Preparing income data for AI analysis',
      icon: Brain,
      estimatedTime: 2,
      status: 'pending'
    },
    {
      id: 'income_narrative',
      title: 'Income Approach Analysis',
      description: 'Generating detailed income-based narrative',
      icon: DollarSign,
      estimatedTime: 12,
      status: 'pending'
    }
  ],
  sales: [
    {
      id: 'initialization',
      title: 'Initializing Analysis',
      description: 'Preparing comparable sales data',
      icon: Brain,
      estimatedTime: 2,
      status: 'pending'
    },
    {
      id: 'sales_narrative',
      title: 'Sales Comparison Analysis',
      description: 'Analyzing market data and comparables',
      icon: TrendingUp,
      estimatedTime: 10,
      status: 'pending'
    }
  ],
  cost: [
    {
      id: 'initialization',
      title: 'Initializing Analysis',
      description: 'Preparing cost approach data',
      icon: Brain,
      estimatedTime: 2,
      status: 'pending'
    },
    {
      id: 'cost_narrative',
      title: 'Cost Approach Analysis',
      description: 'Calculating replacement cost methodology',
      icon: Zap,
      estimatedTime: 8,
      status: 'pending'
    }
  ]
};

export function AIAnalysisProgress({
  isAnalyzing,
  currentStep,
  onCancel,
  propertyAddress,
  analysisType = 'comprehensive'
}: AIAnalysisProgressProps) {
  const [steps, setSteps] = useState<AnalysisStep[]>(ANALYSIS_STEPS[analysisType]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Timer for elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAnalyzing && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnalyzing, startTime]);

  // Initialize analysis when starting
  useEffect(() => {
    if (isAnalyzing && !startTime) {
      setStartTime(Date.now());
      setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })));
    } else if (!isAnalyzing) {
      setStartTime(null);
      setElapsedTime(0);
    }
  }, [isAnalyzing, startTime]);

  // Update step status based on currentStep
  useEffect(() => {
    if (currentStep && isAnalyzing) {
      setSteps(prev => prev.map(step => {
        if (step.id === currentStep) {
          return { 
            ...step, 
            status: 'in_progress' as const,
            startTime: step.startTime || Date.now()
          };
        } else if (step.status === 'in_progress' && step.id !== currentStep) {
          return { 
            ...step, 
            status: 'completed' as const,
            endTime: Date.now()
          };
        }
        return step;
      }));
    }
  }, [currentStep, isAnalyzing]);

  // Calculate overall progress
  useEffect(() => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const inProgressSteps = steps.filter(step => step.status === 'in_progress').length;
    const totalSteps = steps.length;
    
    const progress = ((completedSteps + (inProgressSteps * 0.5)) / totalSteps) * 100;
    setOverallProgress(Math.min(progress, 95)); // Cap at 95% until truly complete
  }, [steps]);

  const totalEstimatedTime = steps.reduce((total, step) => total + step.estimatedTime, 0);
  const remainingTime = Math.max(0, totalEstimatedTime - elapsedTime);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStepIcon = (step: AnalysisStep) => {
    const IconComponent = step.icon;
    
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <IconComponent className="w-5 h-5 text-gray-400" />;
    }
  };

  if (!isAnalyzing) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-lg">
              <Brain className="w-5 h-5 mr-2 text-blue-500" />
              AI Analysis in Progress
            </CardTitle>
            {propertyAddress && (
              <p className="text-sm text-gray-600 mt-1">{propertyAddress}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {formatTime(elapsedTime)}
            </Badge>
            {onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-gray-600">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Elapsed: {formatTime(elapsedTime)}</span>
            <span>Est. remaining: {formatTime(remainingTime)}</span>
          </div>
        </div>

        {/* Step Progress */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Analysis Steps</h4>
          {steps.map((step) => (
            <div key={step.id} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getStepIcon(step)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${
                    step.status === 'completed' ? 'text-green-700' :
                    step.status === 'in_progress' ? 'text-blue-700' :
                    step.status === 'error' ? 'text-red-700' :
                    'text-gray-700'
                  }`}>
                    {step.title}
                  </p>
                  
                  <Badge 
                    variant={
                      step.status === 'completed' ? 'default' :
                      step.status === 'in_progress' ? 'secondary' :
                      step.status === 'error' ? 'destructive' :
                      'outline'
                    }
                    className="text-xs"
                  >
                    {step.status === 'completed' ? 'Complete' :
                     step.status === 'in_progress' ? 'Processing' :
                     step.status === 'error' ? 'Error' :
                     'Pending'}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                
                {step.status === 'in_progress' && step.startTime && (
                  <div className="flex items-center mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${Math.min(((Date.now() - step.startTime) / 1000) / step.estimatedTime * 100, 95)}%` 
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 ml-2">
                      ~{Math.max(0, step.estimatedTime - Math.floor((Date.now() - step.startTime) / 1000))}s
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Status Message */}
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <Brain className="w-4 h-4 inline mr-2" />
            AI models are analyzing your property data to generate professional-grade narratives 
            suitable for legal proceedings. This process ensures comprehensive coverage of all 
            valuation approaches.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}