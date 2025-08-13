import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

interface QuickActionsProps {
  loading: boolean;
  onGenerateReport: (type: string) => void;
  onRunFlaggingAnalysis: () => void;
  isRunningFlaggingAnalysis: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  loading,
  onGenerateReport,
  onRunFlaggingAnalysis,
  isRunningFlaggingAnalysis
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">⚡ Quick Actions</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={() => onGenerateReport('compliance')}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          ) : (
            <FileText className="w-5 h-5 text-blue-600" />
          )}
          <span className="text-sm font-medium">Compliance Report</span>
        </Button>

        <Button
          variant="outline"
          className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          onClick={() => onGenerateReport('performance')}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-green-600" />
          ) : (
            <BarChart3 className="w-5 h-5 text-green-600" />
          )}
          <span className="text-sm font-medium">Performance Analytics</span>
        </Button>

        <Button
          variant="outline"
          className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          onClick={onRunFlaggingAnalysis}
          disabled={loading || isRunningFlaggingAnalysis}
        >
          {isRunningFlaggingAnalysis ? (
            <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          )}
          <span className="text-sm font-medium">
            {isRunningFlaggingAnalysis ? 'Analyzing...' : 'Run Flagging Analysis'}
          </span>
        </Button>

        <Button
          variant="outline"
          className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          onClick={() => onGenerateReport('portfolio-summary')}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
          ) : (
            <RefreshCw className="w-5 h-5 text-purple-600" />
          )}
          <span className="text-sm font-medium">Portfolio Summary</span>
        </Button>
      </div>
    </div>
  );
};