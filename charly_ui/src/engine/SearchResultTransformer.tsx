/**
 * 🍎 CHARLY 2.0 - SEARCH RESULT TRANSFORMER
 * 
 * Dynamically transforms search result interfaces based on attorney context,
 * intent, and emotional state. Each search becomes a tailored experience.
 */

import React, { useMemo } from 'react';
import { AttorneyContext, AttorneyIntent, EmotionalState } from './ContextEngine';
import { IntentParse } from './SearchDrivenInterface';

// ============================================================================
// TRANSFORMATION TYPES
// ============================================================================

export interface SearchResult {
  id: string;
  type: 'property' | 'case' | 'document' | 'jurisdiction' | 'template';
  title: string;
  subtitle?: string;
  data: Record<string, unknown>;
  relevanceScore: number;
  metadata: {
    lastUpdated: number;
    source: string;
    jurisdiction?: string;
    status?: string;
  };
}

export interface TransformationRule {
  context: AttorneyContext;
  intent: AttorneyIntent;
  emotionalState?: EmotionalState;
  layout: 'list' | 'grid' | 'cards' | 'table' | 'timeline' | 'map';
  density: 'minimal' | 'comfortable' | 'dense';
  primaryFields: string[];
  secondaryFields: string[];
  actions: ActionConfig[];
  grouping?: GroupingConfig;
  sorting?: SortingConfig;
  filters?: FilterConfig[];
}

export interface ActionConfig {
  id: string;
  label: string;
  icon: string;
  action: string;
  primary?: boolean;
  condition?: (result: SearchResult) => boolean;
}

export interface GroupingConfig {
  field: string;
  label: string;
  collapsible: boolean;
}

export interface SortingConfig {
  field: string;
  direction: 'asc' | 'desc';
  label: string;
}

export interface FilterConfig {
  field: string;
  label: string;
  type: 'select' | 'range' | 'date' | 'boolean';
  options?: string[];
}

// ============================================================================
// SEARCH RESULT TRANSFORMER
// ============================================================================

export class SearchResultTransformer {
  private transformationRules: Map<string, TransformationRule> = new Map();
  
  constructor() {
    this.initializeTransformationRules();
  }
  
  private initializeTransformationRules(): void {
    // Discovery + Explore = Property Grid View
    this.transformationRules.set('discovery_explore', {
      context: 'discovery',
      intent: 'explore',
      layout: 'grid',
      density: 'comfortable',
      primaryFields: ['address', 'assessedValue', 'jurisdiction'],
      secondaryFields: ['propertyType', 'yearBuilt', 'sqft'],
      actions: [
        { id: 'view', label: 'View Details', icon: 'eye', action: 'view_property', primary: true },
        { id: 'analyze', label: 'Quick Analysis', icon: 'chart', action: 'analyze_property' },
        { id: 'compare', label: 'Add to Compare', icon: 'plus', action: 'add_to_compare' }
      ],
      grouping: { field: 'jurisdiction', label: 'County', collapsible: true },
      sorting: { field: 'assessedValue', direction: 'desc', label: 'Assessment Value' },
      filters: [
        { field: 'jurisdiction', label: 'Jurisdiction', type: 'select' },
        { field: 'assessedValue', label: 'Value Range', type: 'range' },
        { field: 'propertyType', label: 'Property Type', type: 'select' }
      ]
    });
    
    // Analysis + Analyze = Property Comparison Table
    this.transformationRules.set('analysis_analyze', {
      context: 'analysis',
      intent: 'analyze',
      layout: 'table',
      density: 'dense',
      primaryFields: ['address', 'assessedValue', 'marketValue', 'variance'],
      secondaryFields: ['capRate', 'noi', 'expenseRatio', 'appealPotential'],
      actions: [
        { id: 'deep_analyze', label: 'Deep Analysis', icon: 'microscope', action: 'deep_analysis', primary: true },
        { id: 'compare_comps', label: 'Find Comps', icon: 'search', action: 'find_comparables' },
        { id: 'create_appeal', label: 'Create Appeal', icon: 'document', action: 'create_appeal', 
          condition: (result) => result.data.appealPotential > 0.7 }
      ],
      grouping: { field: 'appealPotential', label: 'Appeal Strength', collapsible: false },
      sorting: { field: 'variance', direction: 'desc', label: 'Overassessment %' }
    });
    
    // Preparation + Create = Document Template Cards
    this.transformationRules.set('preparation_create', {
      context: 'preparation',
      intent: 'create',
      layout: 'cards',
      density: 'comfortable',
      primaryFields: ['templateName', 'jurisdiction', 'propertyType'],
      secondaryFields: ['lastUsed', 'successRate', 'averageReduction'],
      actions: [
        { id: 'use_template', label: 'Use Template', icon: 'document-add', action: 'use_template', primary: true },
        { id: 'customize', label: 'Customize', icon: 'pencil', action: 'customize_template' },
        { id: 'preview', label: 'Preview', icon: 'eye', action: 'preview_template' }
      ],
      grouping: { field: 'jurisdiction', label: 'Jurisdiction', collapsible: true },
      sorting: { field: 'successRate', direction: 'desc', label: 'Success Rate' }
    });
    
    // Filing + Submit = Deadline Timeline
    this.transformationRules.set('filing_submit', {
      context: 'filing',
      intent: 'submit',
      layout: 'timeline',
      density: 'comfortable',
      primaryFields: ['caseNumber', 'property', 'deadline', 'status'],
      secondaryFields: ['submittedDate', 'jurisdiction', 'attorney'],
      actions: [
        { id: 'submit_now', label: 'Submit Now', icon: 'upload', action: 'submit_filing', primary: true,
          condition: (result) => result.data.status === 'ready' },
        { id: 'review', label: 'Final Review', icon: 'check', action: 'review_filing' },
        { id: 'track', label: 'Set Tracking', icon: 'bell', action: 'set_tracking' }
      ],
      sorting: { field: 'deadline', direction: 'asc', label: 'Deadline' }
    });
    
    // Monitoring + Track = Status Dashboard
    this.transformationRules.set('monitoring_track', {
      context: 'monitoring',
      intent: 'track',
      layout: 'cards',
      density: 'comfortable',
      primaryFields: ['caseNumber', 'property', 'status', 'nextAction'],
      secondaryFields: ['filedDate', 'estimatedDecision', 'currentValue'],
      actions: [
        { id: 'view_status', label: 'View Status', icon: 'chart-line', action: 'view_case_status', primary: true },
        { id: 'follow_up', label: 'Follow Up', icon: 'mail', action: 'send_follow_up' },
        { id: 'update', label: 'Update Case', icon: 'edit', action: 'update_case' }
      ],
      grouping: { field: 'status', label: 'Status', collapsible: false },
      sorting: { field: 'estimatedDecision', direction: 'asc', label: 'Expected Decision' }
    });
    
    // Stressed state modifications
    this.transformationRules.set('discovery_explore_stressed', {
      ...this.transformationRules.get('discovery_explore')!,
      emotionalState: 'stressed',
      layout: 'list',
      density: 'minimal',
      primaryFields: ['address', 'assessedValue'],
      secondaryFields: ['appealPotential'],
      actions: [
        { id: 'quick_start', label: 'Quick Start Appeal', icon: 'lightning', action: 'quick_appeal', primary: true }
      ]
    });
  }
  
  public transformResults(
    results: SearchResult[], 
    parse: IntentParse, 
    emotionalState?: EmotionalState
  ): {
    transformedResults: SearchResult[];
    layout: TransformationRule['layout'];
    config: TransformationRule;
    insights: TransformationInsight[];
  } {
    const ruleKey = emotionalState 
      ? `${parse.context}_${parse.intent}_${emotionalState}`
      : `${parse.context}_${parse.intent}`;
    
    const rule = this.transformationRules.get(ruleKey) || 
               this.transformationRules.get(`${parse.context}_${parse.intent}`) ||
               this.getDefaultRule();
    
    const transformedResults = this.applyTransformation(results, rule, parse);
    const insights = this.generateInsights(results, transformedResults);
    
    return {
      transformedResults,
      layout: rule.layout,
      config: rule,
      insights
    };
  }
  
  private applyTransformation(
    results: SearchResult[], 
    rule: TransformationRule,
    parse: IntentParse
  ): SearchResult[] {
    let transformed = [...results];
    
    // Apply relevance boosting based on entities
    transformed = this.boostRelevance(transformed, parse);
    
    // Apply sorting
    if (rule.sorting) {
      transformed.sort((a, b) => {
        const aValue = a.data[rule.sorting!.field] || 0;
        const bValue = b.data[rule.sorting!.field] || 0;
        
        return rule.sorting!.direction === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }
    
    // Apply filtering for stressed users (show only top results)
    if (rule.emotionalState === 'stressed') {
      transformed = transformed.slice(0, 5);
    }
    
    // Apply confidence-based filtering
    transformed = transformed.filter(result => result.relevanceScore > 0.3);
    
    return transformed;
  }
  
  private boostRelevance(results: SearchResult[], parse: IntentParse): SearchResult[] {
    return results.map(result => {
      let boost = 0;
      
      // Boost based on entities found in query
      parse.entities.forEach(entity => {
        if (entity.type === 'jurisdiction' && 
            result.metadata.jurisdiction?.toLowerCase().includes(entity.value.toLowerCase())) {
          boost += 0.3;
        }
        
        if (entity.type === 'property' && 
            result.title.toLowerCase().includes(entity.value.toLowerCase())) {
          boost += 0.4;
        }
        
        if (entity.type === 'value' && result.data.assessedValue) {
          const queryValue = this.parseValue(entity.value);
          const resultValue = result.data.assessedValue;
          if (queryValue && Math.abs(resultValue - queryValue) / queryValue < 0.2) {
            boost += 0.2;
          }
        }
      });
      
      return {
        ...result,
        relevanceScore: Math.min(result.relevanceScore + boost, 1.0)
      };
    });
  }
  
  private parseValue(valueString: string): number | null {
    const cleanValue = valueString.replace(/[,$]/g, '');
    if (cleanValue.includes('k')) {
      return parseFloat(cleanValue) * 1000;
    }
    if (cleanValue.includes('million')) {
      return parseFloat(cleanValue) * 1000000;
    }
    return parseFloat(cleanValue) || null;
  }
  
  private generateInsights(
    original: SearchResult[], 
    transformed: SearchResult[]
  ): TransformationInsight[] {
    const insights: TransformationInsight[] = [];
    
    if (transformed.length < original.length) {
      insights.push({
        type: 'filtering',
        message: `Showing ${transformed.length} of ${original.length} results based on relevance`,
        severity: 'info'
      });
    }
    
    const highValueResults = transformed.filter(r => r.data.assessedValue > 1000000).length;
    if (highValueResults > 0) {
      insights.push({
        type: 'opportunity',
        message: `${highValueResults} high-value properties found - potential for significant savings`,
        severity: 'success'
      });
    }
    
    const urgentDeadlines = transformed.filter(r => 
      r.data.deadline && new Date(r.data.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    if (urgentDeadlines > 0) {
      insights.push({
        type: 'warning',
        message: `${urgentDeadlines} items have deadlines within 7 days`,
        severity: 'warning'
      });
    }
    
    return insights;
  }
  
  private getDefaultRule(): TransformationRule {
    return {
      context: 'discovery',
      intent: 'explore',
      layout: 'list',
      density: 'comfortable',
      primaryFields: ['title', 'subtitle'],
      secondaryFields: [],
      actions: [
        { id: 'view', label: 'View', icon: 'eye', action: 'view', primary: true }
      ]
    };
  }
}

export interface TransformationInsight {
  type: 'filtering' | 'opportunity' | 'warning' | 'suggestion';
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

// ============================================================================
// RESULT DISPLAY COMPONENTS
// ============================================================================

interface SearchResultsDisplayProps {
  results: SearchResult[];
  rule: TransformationRule;
  insights: TransformationInsight[];
  onAction: (action: string, result: SearchResult) => void;
  className?: string;
}

export const SearchResultsDisplay: React.FC<SearchResultsDisplayProps> = ({
  results,
  rule,
  insights,
  onAction,
  className = ''
}) => {
  const groupedResults = useMemo(() => {
    if (!rule.grouping) return { ungrouped: results };
    
    return results.reduce((groups, result) => {
      const groupKey = result.data[rule.grouping!.field] || 'Other';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(result);
      return groups;
    }, {} as Record<string, SearchResult[]>);
  }, [results, rule.grouping]);
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border-l-4 ${
                insight.severity === 'success' ? 'bg-green-50 border-green-400 text-green-700' :
                insight.severity === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' :
                insight.severity === 'error' ? 'bg-red-50 border-red-400 text-red-700' :
                'bg-blue-50 border-blue-400 text-blue-700'
              }`}
            >
              {insight.message}
            </div>
          ))}
        </div>
      )}
      
      {/* Results by layout */}
      {rule.layout === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedResults).map(([groupName, groupResults]) => (
            <div key={groupName} className="space-y-4">
              {rule.grouping && (
                <h3 className="font-semibold text-gray-900 border-b pb-2">
                  {groupName}
                </h3>
              )}
              {groupResults.map(result => (
                <ResultCard
                  key={result.id}
                  result={result}
                  rule={rule}
                  onAction={onAction}
                />
              ))}
            </div>
          ))}
        </div>
      )}
      
      {rule.layout === 'list' && (
        <div className="space-y-4">
          {Object.entries(groupedResults).map(([groupName, groupResults]) => (
            <div key={groupName}>
              {rule.grouping && (
                <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">
                  {groupName}
                </h3>
              )}
              <div className="space-y-2">
                {groupResults.map(result => (
                  <ResultListItem
                    key={result.id}
                    result={result}
                    rule={rule}
                    onAction={onAction}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {rule.layout === 'table' && (
        <ResultTable
          results={results}
          rule={rule}
          onAction={onAction}
        />
      )}
      
      {rule.layout === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {results.map(result => (
            <ResultCard
              key={result.id}
              result={result}
              rule={rule}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Component implementations would continue here...
const ResultCard: React.FC<{
  result: SearchResult;
  rule: TransformationRule;
  onAction: (action: string, result: SearchResult) => void;
}> = ({ result, rule, onAction }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="space-y-2">
      {rule.primaryFields.map(field => (
        <div key={field} className="font-medium text-gray-900">
          {result.data[field] || result[field] || '-'}
        </div>
      ))}
      {rule.secondaryFields.map(field => (
        <div key={field} className="text-sm text-gray-600">
          {result.data[field] || '-'}
        </div>
      ))}
    </div>
    <div className="mt-4 flex space-x-2">
      {rule.actions
        .filter(action => !action.condition || action.condition(result))
        .map(action => (
          <button
            key={action.id}
            onClick={() => onAction(action.action, result)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              action.primary 
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {action.label}
          </button>
        ))}
    </div>
  </div>
);

const ResultListItem: React.FC<{
  result: SearchResult;
  rule: TransformationRule;
  onAction: (action: string, result: SearchResult) => void;
}> = ({ result, rule, onAction }) => (
  <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
    <div className="flex-1">
      <div className="flex items-center space-x-4">
        {rule.primaryFields.map(field => (
          <span key={field} className="font-medium text-gray-900">
            {result.data[field] || result[field] || '-'}
          </span>
        ))}
      </div>
      <div className="flex items-center space-x-4 mt-1">
        {rule.secondaryFields.map(field => (
          <span key={field} className="text-sm text-gray-600">
            {result.data[field] || '-'}
          </span>
        ))}
      </div>
    </div>
    <div className="flex space-x-2">
      {rule.actions
        .filter(action => !action.condition || action.condition(result))
        .map(action => (
          <button
            key={action.id}
            onClick={() => onAction(action.action, result)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              action.primary 
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {action.label}
          </button>
        ))}
    </div>
  </div>
);

const ResultTable: React.FC<{
  results: SearchResult[];
  rule: TransformationRule;
  onAction: (action: string, result: SearchResult) => void;
}> = ({ results, rule, onAction }) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          {[...rule.primaryFields, ...rule.secondaryFields].map(field => (
            <th key={field} className="px-4 py-3 text-left text-sm font-medium text-gray-900">
              {field}
            </th>
          ))}
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
        </tr>
      </thead>
      <tbody>
        {results.map((result, index) => (
          <tr key={result.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            {[...rule.primaryFields, ...rule.secondaryFields].map(field => (
              <td key={field} className="px-4 py-3 text-sm text-gray-900">
                {result.data[field] || result[field] || '-'}
              </td>
            ))}
            <td className="px-4 py-3">
              <div className="flex space-x-2">
                {rule.actions
                  .filter(action => !action.condition || action.condition(result))
                  .map(action => (
                    <button
                      key={action.id}
                      onClick={() => onAction(action.action, result)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {action.label}
                    </button>
                  ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Export singleton instance
// eslint-disable-next-line react-refresh/only-export-components
export const searchResultTransformer = new SearchResultTransformer();