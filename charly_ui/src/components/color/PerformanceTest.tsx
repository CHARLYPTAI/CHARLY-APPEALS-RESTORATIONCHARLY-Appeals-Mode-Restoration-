import React, { useState, useEffect } from 'react';
import { useAdaptiveColor } from './AdaptiveColorEngine';
import { useColorTransitionOrchestrator } from './ColorTransitionOrchestrator';
import { useColorAccessibility } from './ColorAccessibilityProvider';

export const ColorPerformanceTest: React.FC = () => {
  const { performanceMetrics, updateColor, currentPalette } = useAdaptiveColor();
  const { queueTransition } = useColorTransitionOrchestrator();
  const { accessibilityReport } = useColorAccessibility();
  
  const [testResults, setTestResults] = useState<{
    transitionTime: number;
    frameRate: number;
    accessibility: boolean;
    passed: boolean;
  }>({
    transitionTime: 0,
    frameRate: 0,
    accessibility: false,
    passed: false
  });

  const runPerformanceTest = () => {
    const startTime = performance.now();
    
    // Test color transition
    const testColors = [
      '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'
    ];
    
    testColors.forEach((color, index) => {
      setTimeout(() => {
        updateColor('primary', color);
        if (index === testColors.length - 1) {
          // Test complete
          const endTime = performance.now();
          const totalTime = endTime - startTime;
          
          setTestResults({
            transitionTime: totalTime / testColors.length,
            frameRate: performanceMetrics.frameRate,
            accessibility: accessibilityReport?.wcagCompliance === 'AA' || accessibilityReport?.wcagCompliance === 'AAA',
            passed: (totalTime / testColors.length) < 50 && performanceMetrics.frameRate > 30
          });
        }
      }, index * 100);
    });
  };

  useEffect(() => {
    // Run test automatically on mount
    setTimeout(runPerformanceTest, 1000);
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Color System Performance Test</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-2">Performance Metrics</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Transition Time:</span>
              <span className={`text-sm font-medium ${testResults.transitionTime < 50 ? 'text-green-600' : 'text-red-600'}`}>
                {testResults.transitionTime.toFixed(2)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Frame Rate:</span>
              <span className={`text-sm font-medium ${testResults.frameRate > 30 ? 'text-green-600' : 'text-red-600'}`}>
                {testResults.frameRate} fps
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Memory Usage:</span>
              <span className="text-sm font-medium">
                {performanceMetrics.memoryUsage.toFixed(2)} MB
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-2">Accessibility</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">WCAG Compliance:</span>
              <span className={`text-sm font-medium ${accessibilityReport?.wcagCompliance === 'AA' || accessibilityReport?.wcagCompliance === 'AAA' ? 'text-green-600' : 'text-red-600'}`}>
                {accessibilityReport?.wcagCompliance || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Contrast Ratio:</span>
              <span className="text-sm font-medium">
                {accessibilityReport?.contrastRatio.toFixed(2)}:1
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Readability:</span>
              <span className="text-sm font-medium">
                {accessibilityReport?.readabilityScore.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <h4 className="font-medium text-sm text-gray-600 mb-2">Current Palette</h4>
        <div className="flex space-x-2">
          <div className="w-8 h-8 rounded" style={{ backgroundColor: currentPalette.primary }} title="Primary"></div>
          <div className="w-8 h-8 rounded" style={{ backgroundColor: currentPalette.secondary }} title="Secondary"></div>
          <div className="w-8 h-8 rounded" style={{ backgroundColor: currentPalette.accent }} title="Accent"></div>
          <div className="w-8 h-8 rounded" style={{ backgroundColor: currentPalette.semantic.success }} title="Success"></div>
          <div className="w-8 h-8 rounded" style={{ backgroundColor: currentPalette.semantic.warning }} title="Warning"></div>
          <div className="w-8 h-8 rounded" style={{ backgroundColor: currentPalette.semantic.error }} title="Error"></div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className={`px-3 py-1 rounded text-sm font-medium ${testResults.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {testResults.passed ? '✓ PASSED' : '✗ FAILED'}
        </div>
        
        <button
          onClick={runPerformanceTest}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Run Test
        </button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Target: &lt;50ms transitions, &gt;30fps, WCAG AA compliance</p>
        <p>Test cycles through 6 colors and measures average transition time</p>
      </div>
    </div>
  );
};

export default ColorPerformanceTest;