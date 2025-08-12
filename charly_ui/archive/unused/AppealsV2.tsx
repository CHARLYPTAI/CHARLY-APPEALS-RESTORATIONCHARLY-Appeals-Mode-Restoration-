/**
 * 🍎 CHARLY 2.0 - APPEALS GENERATION REVOLUTION
 * 
 * Task 9: Hero-driven packet creation workflow that makes filing appeals
 * feel inevitable and professional through sophisticated progressive disclosure.
 */

import { useState } from "react";
import { useParams } from "react-router-dom";
// Property analysis store for future use
// import { usePropertyAnalysisStore } from "@/store/propertyAnalysis";
import { 
  MetricCard, 
  Button
} from "@/components/v2";
// UI components for future use
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import { Textarea } from "@/components/ui/textarea";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  FileText, 
  Brain, 
  Sparkles,
  CheckCircle,
  // TrendingDown, - icon for future use
  DollarSign,
  Calendar,
  Gavel
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
// Utils for future use
// import { cn } from "@/lib/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AppealData {
  propertyId: string;
  address: string;
  currentAssessment: number;
  proposedAssessment: number;
  potentialSavings: number;
  confidence: number;
  jurisdiction: string;
  
  // Appeal strategy
  strategy: 'market' | 'income' | 'cost' | 'combined';
  approach: {
    market: { enabled: boolean; confidence: number; supporting: string[] };
    income: { enabled: boolean; confidence: number; supporting: string[] };
    cost: { enabled: boolean; confidence: number; supporting: string[] };
  };
  
  // Narrative components
  narrative: {
    executive: string;
    market: string;
    income: string;
    cost: string;
    conclusion: string;
  };
  
  // Supporting evidence
  evidence: {
    comparables: number;
    documents: string[];
    photos: string[];
    inspections: string[];
  };
  
  // Filing details
  filing: {
    deadline: Date;
    filingMethod: 'electronic' | 'mail' | 'inPerson';
    contactInfo: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

interface AppealStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  confidence: number;
  completed: boolean;
  enabled: boolean;
}

// ============================================================================
// APPEALS V2 COMPONENT
// ============================================================================

export function AppealsV2() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [overallConfidence] = useState(92);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Mock data - would be populated from property analysis
  const appealData: AppealData = {
    propertyId: propertyId || 'prop_1',
    address: '123 Main Street, Chicago, IL 60601',
    currentAssessment: 850000,
    proposedAssessment: 750000,
    potentialSavings: 100000,
    confidence: 92,
    jurisdiction: 'Cook County',
    
    strategy: 'market',
    approach: {
      market: { 
        enabled: true, 
        confidence: 94, 
        supporting: ['3 comparable sales', 'Market trend analysis', 'Recent appraisal'] 
      },
      income: { 
        enabled: false, 
        confidence: 78, 
        supporting: ['NOI analysis', 'Cap rate comparison'] 
      },
      cost: { 
        enabled: false, 
        confidence: 85, 
        supporting: ['Depreciation analysis', 'Replacement cost'] 
      }
    },
    
    narrative: {
      executive: '',
      market: '',
      income: '',
      cost: '',
      conclusion: ''
    },
    
    evidence: {
      comparables: 3,
      documents: ['Assessment notice', 'Property deed', 'Tax history'],
      photos: ['Property exterior', 'Interior conditions'],
      inspections: ['Building inspection report']
    },
    
    filing: {
      deadline: new Date('2024-03-15'),
      filingMethod: 'electronic',
      contactInfo: {
        name: '',
        email: '',
        phone: ''
      }
    }
  };

  // ============================================================================
  // HERO-DRIVEN WORKFLOW STEPS
  // ============================================================================

  // Appeal steps for progressive workflow
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _appealSteps: AppealStep[] = [
    {
      id: 'intent',
      title: 'Appeal Intent',
      description: 'Confirm your readiness to challenge this assessment',
      icon: <Shield className="w-5 h-5" />,
      confidence: 100,
      completed: false,
      enabled: true
    },
    {
      id: 'strength',
      title: 'Case Strength',
      description: 'Analyze your appeal\'s winning potential',
      icon: <Target className="w-5 h-5" />,
      confidence: 92,
      completed: false,
      enabled: false
    },
    {
      id: 'strategy',
      title: 'Appeal Strategy',
      description: 'Choose your approach to maximum impact',
      icon: <Brain className="w-5 h-5" />,
      confidence: 0,
      completed: false,
      enabled: false
    },
    {
      id: 'narrative',
      title: 'Professional Narrative',
      description: 'Craft your compelling legal argument',
      icon: <FileText className="w-5 h-5" />,
      confidence: 0,
      completed: false,
      enabled: false
    },
    {
      id: 'review',
      title: 'Quality Review',
      description: 'Ensure attorney-level presentation',
      icon: <CheckCircle className="w-5 h-5" />,
      confidence: 0,
      completed: false,
      enabled: false
    },
    {
      id: 'filing',
      title: 'Professional Filing',
      description: 'Submit with confidence and precision',
      icon: <Gavel className="w-5 h-5" />,
      confidence: 0,
      completed: false,
      enabled: false
    }
  ];

  // ============================================================================
  // INITIALIZE APPEAL DATA
  // ============================================================================

  // Data is now initialized directly above

  // ============================================================================
  // STEP HANDLERS
  // ============================================================================

  const handleStepComplete = (stepIndex: number) => {
    setCompletedSteps(prev => [...prev, stepIndex]);
    setCurrentStep(stepIndex + 1);
    
    toast({
      title: "Step Completed",
      description: `Step ${stepIndex + 1} completed successfully.`,
    });
  };

  const steps = [
    {
      id: 'intent',
      title: 'Appeal Intent',
      description: 'Confirm your readiness to challenge this assessment',
      confidence: 100
    },
    {
      id: 'strength',
      title: 'Case Strength',
      description: 'Analyze your appeal\'s winning potential',
      confidence: 92
    },
    {
      id: 'strategy',
      title: 'Appeal Strategy',
      description: 'Choose your approach to maximum impact',
      confidence: 88
    },
    {
      id: 'narrative',
      title: 'Professional Narrative',
      description: 'Craft your compelling legal argument',
      confidence: 85
    },
    {
      id: 'review',
      title: 'Quality Review',
      description: 'Ensure attorney-level presentation',
      confidence: 95
    },
    {
      id: 'filing',
      title: 'Professional Filing',
      description: 'Submit with confidence and precision',
      confidence: 100
    }
  ];

  const handleGenerateNarrative = async () => {
    setIsGenerating(true);
    
    // Simulate AI narrative generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsGenerating(false);
    toast({
      title: "Narrative Generated",
      description: "Professional appeal narrative has been crafted.",
    });
  };

  const renderStepContent = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Appeal Intent
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4">Ready to Fight This Assessment?</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Your property analysis shows strong grounds for appeal. You have a 92% chance of success with potential savings of $100,000.
            </p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => navigate('/portfolio-v2')}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Not Ready
              </button>
              <button 
                onClick={() => handleStepComplete(0)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Yes, Let's Appeal →
              </button>
            </div>
          </div>
        );

      case 1: // Case Strength
        return (
          <div className="py-6">
            <h3 className="text-lg font-semibold mb-4">Case Strength Analysis</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Market Evidence</span>
                <span className="text-sm text-blue-600 font-medium">94% confidence</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Assessment Growth Rate</span>
                <span className="text-sm text-green-600 font-medium">Strong indicator</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '88%' }}></div>
              </div>
              
              <div className="pt-4">
                <button 
                  onClick={() => handleStepComplete(1)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Continue to Strategy →
                </button>
              </div>
            </div>
          </div>
        );

      case 2: // Strategy
        return (
          <div className="py-6">
            <h3 className="text-lg font-semibold mb-4">Choose Your Appeal Strategy</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="border-2 border-blue-500 bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Market Approach</h4>
                <p className="text-sm text-blue-700 mb-2">Use comparable sales data</p>
                <p className="text-sm font-medium text-blue-900">94% confidence</p>
              </div>
              <div className="border p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Income Approach</h4>
                <p className="text-sm text-gray-600 mb-2">Based on income potential</p>
                <p className="text-sm font-medium text-gray-700">78% confidence</p>
              </div>
              <div className="border p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Cost Approach</h4>
                <p className="text-sm text-gray-600 mb-2">Replacement cost analysis</p>
                <p className="text-sm font-medium text-gray-700">85% confidence</p>
              </div>
            </div>
            <button 
              onClick={() => handleStepComplete(2)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Proceed with Market Approach →
            </button>
          </div>
        );

      case 3: // Narrative
        return (
          <div className="py-6">
            <h3 className="text-lg font-semibold mb-4">Professional Narrative</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700 text-sm">
                Based on comprehensive market analysis, the current assessment of $850,000 significantly exceeds the fair market value of this property. Recent comparable sales in the immediate area demonstrate a market value closer to $750,000, representing a more accurate reflection of the property's true worth.
              </p>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={handleGenerateNarrative}
                disabled={isGenerating}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Regenerate AI Narrative'}
              </button>
              <button 
                onClick={() => handleStepComplete(3)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Continue to Review →
              </button>
            </div>
          </div>
        );

      case 4: // Review
        return (
          <div className="py-6">
            <h3 className="text-lg font-semibold mb-4">Quality Review</h3>
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium text-green-800">Attorney-Level Quality</span>
              </div>
              <p className="text-sm text-green-700">
                Your appeal meets professional standards and is ready for filing.
              </p>
            </div>
            <div className="space-y-2 mb-4">
              {['Legal formatting', 'Evidence completeness', 'Narrative strength', 'Deadline compliance'].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{item}</span>
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ))}
            </div>
            <button 
              onClick={() => handleStepComplete(4)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Approve for Filing →
            </button>
          </div>
        );

      case 5: // Filing
        return (
          <div className="py-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ready to Win $100,000</h3>
              <p className="text-gray-600 mb-4">
                Your professional appeal is ready for submission with a 92% chance of success.
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-900 mb-2">Electronic Filing (Recommended)</h4>
              <p className="text-sm text-blue-700">Instant submission with confirmation receipt</p>
            </div>
            
            <div className="flex space-x-4">
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
                Preview Packet
              </button>
              <button 
                onClick={() => handleStepComplete(5)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                File Appeal Now
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  // Header render function for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _renderHeader = () => (
    <div className="flex items-center justify-between mb-6" data-section="header">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Appeals Generation</h1>
        <p className="text-gray-600 mt-2">
          Hero-driven workflow for professional tax appeals
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <Badge variant="outline" className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4" />
          <span>{overallConfidence}% Success Confidence</span>
        </Badge>
        <Button onClick={() => navigate('/portfolio-v2')} variant="outline">
          ← Back to Portfolio
        </Button>
      </div>
    </div>
  );

  // Overview metrics render function for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _renderOverviewMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" data-section="metrics">
      <MetricCard
        title="Potential Savings"
        value={`$${appealData?.potentialSavings.toLocaleString() || '0'}`}
        change="Tax reduction opportunity"
        icon={<DollarSign className="h-6 w-6" />}
        variant="success"
      />
      <MetricCard
        title="Case Strength"
        value={`${appealData?.confidence || 0}%`}
        change="Winning probability"
        icon={<Target className="h-6 w-6" />}
        variant="primary"
      />
      <MetricCard
        title="Supporting Evidence"
        value={`${appealData?.evidence.comparables || 0} comps`}
        change="Market comparables"
        icon={<FileText className="h-6 w-6" />}
        variant="warning"
      />
      <MetricCard
        title="Filing Deadline"
        value={appealData?.filing.deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'TBD'}
        change="Days remaining"
        icon={<Calendar className="h-6 w-6" />}
        variant="danger"
      />
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appeals Generation 2.0</h1>
            <p className="text-gray-600 mt-2">Hero-driven workflow for professional tax appeals</p>
          </div>
          <button 
            onClick={() => navigate('/portfolio-v2')}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            ← Back to Portfolio
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Potential Savings</h3>
            <p className="text-2xl font-bold text-green-600">$100,000</p>
            <p className="text-sm text-gray-600 mt-1">Tax reduction opportunity</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Case Strength</h3>
            <p className="text-2xl font-bold text-blue-600">92%</p>
            <p className="text-sm text-gray-600 mt-1">Winning probability</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Supporting Evidence</h3>
            <p className="text-2xl font-bold text-purple-600">3 comps</p>
            <p className="text-sm text-gray-600 mt-1">Market comparables</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Filing Deadline</h3>
            <p className="text-2xl font-bold text-red-600">Mar 15</p>
            <p className="text-sm text-gray-600 mt-1">Days remaining</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isActive = currentStep === index;
            const isAccessible = index <= currentStep;
            
            return (
              <div key={step.id} className={`bg-white p-6 rounded-lg shadow-md transition-all duration-300 ${
                !isAccessible ? 'opacity-50' : ''
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted 
                        ? 'bg-green-100 text-green-600' 
                        : isActive 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <h2 className={`text-xl font-semibold ${!isAccessible ? 'text-gray-400' : ''}`}>
                        {step.title}
                      </h2>
                      <p className={`${!isAccessible ? 'text-gray-400' : 'text-gray-600'}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {isAccessible && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-500">Confidence</p>
                      <p className="text-lg font-bold text-blue-600">{step.confidence}%</p>
                    </div>
                  )}
                </div>
                
                {isActive && (
                  <div className="mt-6 pt-6 border-t">
                    {renderStepContent(index)}
                  </div>
                )}
                
                {!isAccessible && (
                  <p className="text-gray-400 text-center py-4">
                    Complete Step {index} to unlock
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AppealsV2;