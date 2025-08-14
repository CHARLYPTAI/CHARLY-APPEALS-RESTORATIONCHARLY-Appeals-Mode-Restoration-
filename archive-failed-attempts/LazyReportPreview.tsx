import { lazy, Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ReportData, FinancialImpact } from "@/types/report";

// Lazy load heavy report components
const ReportPreview = lazy(() => import('./ReportPreview').then(module => ({
  default: module.ReportPreview
})));

const SuccessProbabilityChart = lazy(() => import('./charts/SuccessProbabilityChart').then(module => ({
  default: module.SuccessProbabilityChart
})));

const MarketFactorsChart = lazy(() => import('./charts/MarketFactorsChart').then(module => ({
  default: module.MarketFactorsChart
})));

const FinancialImpactChart = lazy(() => import('./charts/FinancialImpactChart').then(module => ({
  default: module.FinancialImpactChart
})));

const IAAAOComplianceSection = lazy(() => import('./IAAAOComplianceSection').then(module => ({
  default: module.IAAAOComplianceSection
})));

interface LazyReportPreviewProps {
  showReportPreview: boolean;
  setShowReportPreview: (show: boolean) => void;
  reportData: ReportData | null;
}

// Loading fallback component
function ReportLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">🌟 Loading Supernova 2B Analysis</h3>
        <p className="text-sm text-gray-600">Preparing AI-enhanced charts and compliance validation...</p>
        <Progress value={75} className="w-64 h-2 mt-3" />
      </div>
    </div>
  );
}

// Chart loading fallback
function ChartLoadingFallback() {
  return (
    <div className="bg-white p-6 rounded-lg shadow animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-48 bg-gray-100 rounded"></div>
    </div>
  );
}

export function LazyReportPreview({ showReportPreview, setShowReportPreview, reportData }: LazyReportPreviewProps) {
  if (!reportData) return null;

  return (
    <Dialog open={showReportPreview} onOpenChange={setShowReportPreview}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            🌟 Supernova 2B Property Analysis Report Preview
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Performance Optimized
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <Suspense fallback={<ReportLoadingFallback />}>
          <ReportPreview 
            showReportPreview={showReportPreview}
            setShowReportPreview={setShowReportPreview}
            reportData={reportData}
          />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}

// Export individual lazy chart components for granular loading
export const LazySuccessProbabilityChart = ({ successProbability, confidenceLevel }: { successProbability: number; confidenceLevel: number }) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <SuccessProbabilityChart successProbability={successProbability} confidenceLevel={confidenceLevel} />
  </Suspense>
);

interface MarketFactorsChartProps {
  marketFactors: Record<string, unknown>
  propertyFactors: Record<string, unknown>
  jurisdictionFactors: Record<string, unknown>
  timingFactors: Record<string, unknown>
}

export const LazyMarketFactorsChart = ({ marketFactors, propertyFactors, jurisdictionFactors, timingFactors }: MarketFactorsChartProps) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <MarketFactorsChart 
      marketFactors={marketFactors}
      propertyFactors={propertyFactors}
      jurisdictionFactors={jurisdictionFactors}
      timingFactors={timingFactors}
    />
  </Suspense>
);

interface FinancialImpactChartProps {
  financialImpact: FinancialImpact
}

export const LazyFinancialImpactChart = ({ financialImpact }: FinancialImpactChartProps) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <FinancialImpactChart financialImpact={financialImpact} />
  </Suspense>
);

export const LazyIAAAOComplianceSection = ({ reportData }: { reportData: ReportData }) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <IAAAOComplianceSection reportData={reportData} />
  </Suspense>
);

export default LazyReportPreview;