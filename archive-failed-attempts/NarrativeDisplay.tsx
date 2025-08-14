import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Copy, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  DollarSign,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface NarrativeResult {
  success: boolean;
  narrative_type: 'income_summary' | 'sales_comparison' | 'cost_approach';
  narrative: string;
  model_used: string;
  tokens_used: number;
  estimated_cost: number;
  generation_time: number;
  confidence_score: number;
}

interface NarrativeDisplayProps {
  narrativeResult: NarrativeResult;
  isLoading?: boolean;
  onRegenerate?: () => void;
  onCopy?: () => void;
  onExport?: () => void;
  propertyAddress?: string;
}

const getNarrativeTypeInfo = (type: string) => {
  const types = {
    income_summary: {
      title: 'Income Approach Analysis',
      description: 'Valuation based on income-generating potential',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    sales_comparison: {
      title: 'Sales Comparison Analysis', 
      description: 'Market value based on comparable sales',
      icon: FileText,
      color: 'bg-blue-500'
    },
    cost_approach: {
      title: 'Cost Approach Analysis',
      description: 'Value based on replacement cost methodology',
      icon: Zap,
      color: 'bg-orange-500'
    }
  };
  
  return types[type as keyof typeof types] || types.income_summary;
};

const getConfidenceColor = (score: number) => {
  if (score >= 0.8) return 'text-green-600 bg-green-50';
  if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

const getModelBadgeColor = (model: string) => {
  if (model.includes('gpt-4')) return 'bg-purple-100 text-purple-800';
  if (model.includes('claude')) return 'bg-blue-100 text-blue-800';
  if (model.includes('demo')) return 'bg-gray-100 text-gray-800';
  return 'bg-green-100 text-green-800';
};

export function NarrativeDisplay({
  narrativeResult,
  isLoading = false,
  onRegenerate,
  onCopy,
  onExport,
  propertyAddress
}: NarrativeDisplayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const typeInfo = getNarrativeTypeInfo(narrativeResult.narrative_type);
  const IconComponent = typeInfo.icon;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(narrativeResult.narrative);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Narrative Copied",
        description: "The narrative has been copied to your clipboard.",
      });
      
      onCopy?.();
    } catch {
      toast({
        title: "Copy Failed",
        description: "Failed to copy narrative to clipboard.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${typeInfo.color} bg-opacity-10`}>
              <IconComponent className={`w-5 h-5 text-gray-400`} />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-400">Generating {typeInfo.title}...</CardTitle>
              <p className="text-sm text-gray-500">{typeInfo.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">AI is generating your narrative...</p>
              <p className="text-sm text-gray-400 mt-2">This typically takes 10-30 seconds</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${typeInfo.color} bg-opacity-10`}>
              <IconComponent className={`w-5 h-5 text-white`} style={{ color: typeInfo.color.replace('bg-', '').replace('-500', '') }} />
            </div>
            <div>
              <CardTitle className="text-lg">{typeInfo.title}</CardTitle>
              <p className="text-sm text-gray-600">{typeInfo.description}</p>
              {propertyAddress && (
                <p className="text-xs text-gray-500 mt-1">{propertyAddress}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge 
              variant="secondary" 
              className={getConfidenceColor(narrativeResult.confidence_score)}
            >
              {narrativeResult.success ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <AlertCircle className="w-3 h-3 mr-1" />
              )}
              {(narrativeResult.confidence_score * 100).toFixed(0)}% Confidence
            </Badge>
            
            <Badge 
              variant="outline" 
              className={getModelBadgeColor(narrativeResult.model_used)}
            >
              {narrativeResult.model_used}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Narrative Content */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
              {narrativeResult.narrative}
            </pre>
          </div>
        </div>
        
        <Separator />
        
        {/* Metadata and Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Generation Metadata */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Generation Details</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center text-gray-600">
                <Clock className="w-3 h-3 mr-1" />
                {narrativeResult.generation_time}ms
              </div>
              <div className="flex items-center text-gray-600">
                <Zap className="w-3 h-3 mr-1" />
                {narrativeResult.tokens_used} tokens
              </div>
              <div className="flex items-center text-gray-600">
                <DollarSign className="w-3 h-3 mr-1" />
                ${narrativeResult.estimated_cost.toFixed(4)}
              </div>
              <div className="flex items-center text-gray-600">
                <FileText className="w-3 h-3 mr-1" />
                {narrativeResult.narrative.split(' ').length} words
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Actions</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="text-xs"
              >
                {copied ? (
                  <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 mr-1" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              )}
              
              {onRegenerate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRegenerate}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}