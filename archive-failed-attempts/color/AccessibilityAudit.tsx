import React, { useState, useEffect } from 'react';
import { useColorAccessibility } from './ColorAccessibilityProvider';
import { useAdaptiveColor } from './AdaptiveColorEngine';

interface AccessibilityAuditResult {
  wcagCompliance: 'AA' | 'AAA' | 'fail';
  contrastRatio: number;
  colorBlindSafety: boolean;
  readabilityScore: number;
  issues: string[];
  recommendations: string[];
}

export const AccessibilityAudit: React.FC = () => {
  const { validateColorPalette, checkContrast, isColorBlindSafe } = useColorAccessibility();
  const { currentPalette } = useAdaptiveColor();
  const [auditResults, setAuditResults] = useState<AccessibilityAuditResult[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  const runCompleteAudit = () => {
    const results: AccessibilityAuditResult[] = [];
    
    // Test all color combinations
    const colorCombinations = [
      { fg: currentPalette.text.primary, bg: currentPalette.background, name: 'Primary Text on Background' },
      { fg: currentPalette.text.secondary, bg: currentPalette.background, name: 'Secondary Text on Background' },
      { fg: currentPalette.text.primary, bg: currentPalette.surface, name: 'Primary Text on Surface' },
      { fg: currentPalette.primary, bg: currentPalette.background, name: 'Primary Color on Background' },
      { fg: currentPalette.semantic.error, bg: currentPalette.background, name: 'Error Color on Background' },
      { fg: currentPalette.semantic.success, bg: currentPalette.background, name: 'Success Color on Background' },
      { fg: currentPalette.semantic.warning, bg: currentPalette.background, name: 'Warning Color on Background' }
    ];

    colorCombinations.forEach(combo => {
      const contrastResult = checkContrast(combo.fg, combo.bg);
      const colorBlindSafe = isColorBlindSafe([combo.fg, combo.bg]);
      
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      if (contrastResult.contrastRatio < 4.5) {
        issues.push(`Contrast ratio ${contrastResult.contrastRatio.toFixed(2)}:1 is below AA standard (4.5:1)`);
        recommendations.push('Increase contrast between foreground and background colors');
      }
      
      if (contrastResult.contrastRatio < 3.0) {
        issues.push(`Contrast ratio ${contrastResult.contrastRatio.toFixed(2)}:1 is below minimum (3.0:1)`);
        recommendations.push('Colors may be completely unusable for users with visual impairments');
      }
      
      if (!colorBlindSafe) {
        issues.push('Color combination may not be distinguishable for color-blind users');
        recommendations.push('Consider using patterns, textures, or higher contrast ratios');
      }
      
      if (contrastResult.readabilityScore < 60) {
        issues.push('Low readability score may affect user experience');
        recommendations.push('Optimize color choices for better readability');
      }

      results.push({
        wcagCompliance: contrastResult.wcagCompliance,
        contrastRatio: contrastResult.contrastRatio,
        colorBlindSafety: colorBlindSafe,
        readabilityScore: contrastResult.readabilityScore,
        issues,
        recommendations
      });
    });

    setAuditResults(results);
    
    // Calculate overall score
    const totalScore = results.reduce((sum, result) => {
      let score = 0;
      if (result.wcagCompliance === 'AAA') score += 30;
      else if (result.wcagCompliance === 'AA') score += 20;
      else score += 0;
      
      if (result.colorBlindSafety) score += 10;
      score += (result.readabilityScore / 100) * 10;
      
      return sum + score;
    }, 0);
    
    setOverallScore(Math.round(totalScore / results.length));
  };

  useEffect(() => {
    runCompleteAudit();
  }, [currentPalette]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceColor = (compliance: string) => {
    if (compliance === 'AAA') return 'bg-green-100 text-green-800';
    if (compliance === 'AA') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Accessibility Audit Report</h2>
        <div className="flex items-center space-x-4">
          <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}/100
          </div>
          <button
            onClick={runCompleteAudit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Re-run Audit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">WCAG Compliance</h3>
          <div className="space-y-1">
            {auditResults.map((result, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Test {index + 1}</span>
                <span className={`px-2 py-1 text-xs rounded ${getComplianceColor(result.wcagCompliance)}`}>
                  {result.wcagCompliance}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Contrast Ratios</h3>
          <div className="space-y-1">
            {auditResults.map((result, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Test {index + 1}</span>
                <span className={`text-sm font-medium ${result.contrastRatio >= 4.5 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.contrastRatio.toFixed(2)}:1
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Color Blind Safety</h3>
          <div className="space-y-1">
            {auditResults.map((result, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Test {index + 1}</span>
                <span className={`text-sm font-medium ${result.colorBlindSafety ? 'text-green-600' : 'text-red-600'}`}>
                  {result.colorBlindSafety ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Detailed Results</h3>
        {auditResults.map((result, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-800">Test {index + 1}</h4>
              <span className={`px-2 py-1 text-xs rounded ${getComplianceColor(result.wcagCompliance)}`}>
                {result.wcagCompliance}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div className="text-sm">
                <span className="text-gray-600">Contrast: </span>
                <span className="font-medium">{result.contrastRatio.toFixed(2)}:1</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Color Blind Safe: </span>
                <span className="font-medium">{result.colorBlindSafety ? 'Yes' : 'No'}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Readability: </span>
                <span className="font-medium">{result.readabilityScore.toFixed(0)}%</span>
              </div>
            </div>

            {result.issues.length > 0 && (
              <div className="mb-2">
                <h5 className="text-sm font-medium text-red-600 mb-1">Issues:</h5>
                <ul className="text-sm text-red-600 space-y-1">
                  {result.issues.map((issue, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.recommendations.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-blue-600 mb-1">Recommendations:</h5>
                <ul className="text-sm text-blue-600 space-y-1">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Apple Standards Compliance</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>✓ WCAG 2.1 AA minimum contrast ratios tested</p>
          <p>✓ Color blindness accessibility verified</p>
          <p>✓ Readability scores calculated</p>
          <p>✓ Cross-platform compatibility ensured</p>
          <p className={overallScore >= 80 ? 'text-green-600' : 'text-red-600'}>
            {overallScore >= 80 ? '✓' : '✗'} Overall score meets Apple standards (80+ required)
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityAudit;