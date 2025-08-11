import React, { useEffect, useRef } from 'react';
import { FileText, TrendingDown, Home, AlertTriangle, Scale, Building } from 'lucide-react';
import { cn } from '../lib/utils';

interface AppealsProps {
  highlight?: string | null;
}

const Appeals: React.FC<AppealsProps> = ({ highlight }) => {
  const overassessmentRef = useRef<HTMLDivElement>(null);
  const depreciationRef = useRef<HTMLDivElement>(null);
  const vacancyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refs: { [key: string]: React.RefObject<HTMLDivElement> } = {
      overassessment: overassessmentRef,
      depreciation: depreciationRef,
      vacancy: vacancyRef,
    };

    if (highlight && refs[highlight]?.current) {
      setTimeout(() => {
        refs[highlight].current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
    }
  }, [highlight]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Property Tax Appeals
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Review and prepare comprehensive appeals for property tax assessments
          </p>
        </header>

        <div className="space-y-16">
          <div 
            id="overassessment"
            ref={overassessmentRef}
            className={cn(
              "rounded-2xl shadow-2xl transition-all duration-500 animate-fade-in",
              "bg-white dark:bg-gray-800",
              "border border-gray-200 dark:border-gray-700",
              highlight === 'overassessment' && "ring-4 ring-blue-500 ring-opacity-50"
            )}
            style={{ animationDelay: '100ms' }}
          >
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Overassessment Appeals
                </h2>
              </div>

              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p className="leading-relaxed">
                  Challenge property valuations that exceed fair market value through comprehensive 
                  comparative market analysis and professional appraisal documentation.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Key Evidence Points</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        Recent comparable sales data
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        Professional appraisal reports
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        Market trend analysis
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Assessment Timeline</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Initial Review</span>
                        <span className="text-gray-500">5-7 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Evidence Compilation</span>
                        <span className="text-gray-500">10-14 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Final Submission</span>
                        <span className="text-gray-500">30 days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div 
            id="depreciation"
            ref={depreciationRef}
            className={cn(
              "rounded-2xl shadow-2xl transition-all duration-500 animate-fade-in",
              "bg-white dark:bg-gray-800",
              "border border-gray-200 dark:border-gray-700",
              highlight === 'depreciation' && "ring-4 ring-blue-500 ring-opacity-50"
            )}
            style={{ animationDelay: '200ms' }}
          >
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <TrendingDown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Depreciation Appeals
                </h2>
              </div>

              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p className="leading-relaxed">
                  Document physical deterioration, functional obsolescence, and external factors 
                  affecting property value to support depreciation-based tax adjustments.
                </p>
                
                <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Depreciation Categories</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">Physical</div>
                      <div className="text-sm mt-1">Structural wear & aging</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">Functional</div>
                      <div className="text-sm mt-1">Design obsolescence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">Economic</div>
                      <div className="text-sm mt-1">Market conditions</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900 dark:text-white">Important Notice</p>
                      <p className="mt-1">Depreciation claims require detailed engineering reports and professional assessments.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div 
            id="vacancy"
            ref={vacancyRef}
            className={cn(
              "rounded-2xl shadow-2xl transition-all duration-500 animate-fade-in",
              "bg-white dark:bg-gray-800",
              "border border-gray-200 dark:border-gray-700",
              highlight === 'vacancy' && "ring-4 ring-blue-500 ring-opacity-50"
            )}
            style={{ animationDelay: '300ms' }}
          >
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Building className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Vacancy Appeals
                </h2>
              </div>

              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p className="leading-relaxed">
                  Request assessment adjustments for properties experiencing significant vacancy 
                  periods, demonstrating reduced income-generating capacity and market value.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">Qualifying Criteria</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <Home className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm">Minimum 90-day vacancy period</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm">Documentation of marketing efforts</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <TrendingDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm">Market condition analysis</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">Required Documentation</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">✓</span>
                        Lease termination records
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">✓</span>
                        Marketing campaign evidence
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">✓</span>
                        Utility disconnection notices
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">✓</span>
                        Property inspection reports
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appeals;