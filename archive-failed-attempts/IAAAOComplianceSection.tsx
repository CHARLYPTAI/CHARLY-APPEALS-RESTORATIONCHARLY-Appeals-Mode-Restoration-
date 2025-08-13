import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { IAAAOComplianceService } from "@/services/iaaoComplianceService";
import type { ReportData } from "@/types/report";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";

interface IAAAOComplianceSectionProps {
  reportData: ReportData;
}

export function IAAAOComplianceSection({ reportData }: IAAAOComplianceSectionProps) {
  const compliance = IAAAOComplianceService.validateCompliance(reportData);

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceBadge = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 75) return 'secondary';
    return 'destructive';
  };

  const getIssueIcon = (level: string) => {
    switch (level) {
      case 'critical': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info': return <Info className="w-4 h-4 text-blue-600" />;
      default: return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-100 p-6 rounded-lg shadow-md border-2 border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
        <span className="w-1 h-8 bg-gradient-to-b from-slate-600 to-gray-600 mr-3"></span>
        🏛️ IAAO COMPLIANCE VALIDATION
        <Badge className={`ml-2 bg-${getComplianceBadge(compliance.overallCompliance)}`}>
          {compliance.overallCompliance}% Compliant
        </Badge>
      </h2>

      {/* Overall Compliance Score */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-slate-800">Overall IAAO Compliance</h3>
          <span className={`text-2xl font-bold ${getComplianceColor(compliance.overallCompliance)}`}>
            {compliance.overallCompliance}%
          </span>
        </div>
        <Progress value={compliance.overallCompliance} className="h-3 mb-2" />
        <p className="text-sm text-gray-600">
          International Association of Assessing Officers Standards Compliance
        </p>
      </div>

      {/* Standards Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {compliance.standardsChecked.map((standard, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow border-l-4 border-l-slate-300">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800 text-sm">{standard.name}</h4>
                <p className="text-xs text-gray-600 mt-1">{standard.description}</p>
              </div>
              <Badge variant={standard.compliance ? 'default' : 'destructive'} className="text-xs ml-2">
                {standard.category}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <Progress value={standard.score * 100} className="h-2 flex-1 mr-3" />
              <div className="flex items-center gap-1">
                {standard.compliance ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {(standard.score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Issues and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Issues */}
        {compliance.issues.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
              Compliance Issues ({compliance.issues.length})
            </h4>
            <div className="space-y-2">
              {compliance.issues.map((issue, index) => (
                <div key={index} className="border-l-4 border-l-red-300 pl-3 py-2">
                  <div className="flex items-start gap-2">
                    {getIssueIcon(issue.level)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{issue.message}</p>
                      <p className="text-xs text-gray-600 mt-1">{issue.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            IAAO Recommendations
          </h4>
          <div className="space-y-2">
            {compliance.recommendations.map((recommendation, index) => (
              <div key={index} className="border-l-4 border-l-green-300 pl-3 py-2">
                <p className="text-sm text-gray-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Summary */}
      <div className="mt-6 bg-gradient-to-r from-slate-100 to-gray-100 p-4 rounded-lg border border-slate-300">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-slate-800">IAAO Standards Assessment</h4>
            <p className="text-sm text-gray-600 mt-1">
              {compliance.overallCompliance >= 90 
                ? "Excellent compliance with IAAO mass appraisal standards" 
                : compliance.overallCompliance >= 75 
                ? "Good compliance with opportunities for improvement" 
                : "Compliance improvements needed before proceeding"
              }
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getComplianceColor(compliance.overallCompliance)}`}>
              {compliance.standardsChecked.filter(s => s.compliance).length}/{compliance.standardsChecked.length}
            </div>
            <div className="text-sm text-gray-600">Standards Met</div>
          </div>
        </div>
      </div>
    </div>
  );
}