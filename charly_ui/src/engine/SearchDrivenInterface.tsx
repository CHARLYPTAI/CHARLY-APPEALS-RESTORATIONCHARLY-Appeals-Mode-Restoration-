/**
 * 🍎 CHARLY 2.0 - SEARCH-DRIVEN INTERFACE ASSEMBLY
 * 
 * Revolutionary search system that transforms natural language queries into 
 * adaptive interface compositions. No more navigation - just express intent.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { contextEngine, type AttorneyContext, type AttorneyIntent } from './ContextEngine';
import { adaptiveState } from './AdaptiveState';
import { AdaptiveComposer } from './ComponentComposer';
import { intentPredictionEngine, type WorkflowPrediction } from './IntentPredictionEngine';
// import { searchResultTransformer, SearchResultsDisplay, type SearchResult } from './SearchResultTransformer';
import { useVoiceSearch } from './VoiceSearchEngine';
// Example queries moved to constants
// import { EXAMPLE_QUERIES } from './SearchDrivenInterfaceConstants';

// ============================================================================
// SEARCH INTENT TYPES
// ============================================================================

export interface SearchQuery {
  query: string;
  timestamp: number;
  context?: AttorneyContext;
  intent?: AttorneyIntent;
  confidence?: number;
}

export interface IntentParse {
  context: AttorneyContext;
  intent: AttorneyIntent;
  entities: SearchEntity[];
  confidence: number;
  suggestions?: string[];
}

export interface SearchEntity {
  type: 'property' | 'jurisdiction' | 'value' | 'date' | 'action' | 'person';
  value: string;
  confidence: number;
}

export interface InterfaceAction {
  type: 'navigate' | 'filter' | 'select' | 'create' | 'analyze' | 'help';
  target: string;
  parameters: Record<string, unknown>;
  confidence: number;
}

// ============================================================================
// ENHANCED NATURAL LANGUAGE PROCESSOR
// ============================================================================

export class EnhancedNLProcessor {
  private contextPatterns: Map<AttorneyContext, RegExp[]> = new Map();
  private intentPatterns: Map<AttorneyIntent, RegExp[]> = new Map();
  private entityPatterns: Map<string, RegExp> = new Map();
  private semanticWeights: Map<string, number> = new Map();
  private queryHistory: SearchQuery[] = [];
  private behavioralPatterns: Map<string, number> = new Map();
  
  constructor() {
    this.initializePatterns();
    this.initializeSemanticWeights();
    this.loadQueryHistory();
  }
  
  private initializePatterns(): void {
    // Context patterns
    this.contextPatterns.set('discovery', [
      /find|search|look|discover|browse|explore/i,
      /properties|real estate|buildings/i,
      /market|area|neighborhood/i
    ]);
    
    this.contextPatterns.set('analysis', [
      /analyze|examine|review|evaluate|assess/i,
      /property|building|parcel/i,
      /value|assessment|worth|price/i,
      /compare|comparison|versus/i
    ]);
    
    this.contextPatterns.set('preparation', [
      /create|build|generate|prepare|draft/i,
      /appeal|petition|application/i,
      /document|form|packet/i
    ]);
    
    this.contextPatterns.set('filing', [
      /file|submit|send|deliver/i,
      /appeal|petition|application/i,
      /deadline|due|required/i
    ]);
    
    this.contextPatterns.set('monitoring', [
      /track|monitor|check|status|progress/i,
      /appeal|case|petition/i,
      /response|decision|outcome/i
    ]);
    
    // Intent patterns
    this.intentPatterns.set('explore', [
      /show|display|list|browse/i,
      /find|search|discover/i,
      /what|where|which/i
    ]);
    
    this.intentPatterns.set('analyze', [
      /analyze|calculate|evaluate/i,
      /how much|value|worth/i,
      /compare|difference/i
    ]);
    
    this.intentPatterns.set('create', [
      /create|make|build|generate/i,
      /new|draft|prepare/i
    ]);
    
    this.intentPatterns.set('submit', [
      /submit|file|send|deliver/i,
      /complete|finish|done/i
    ]);
    
    this.intentPatterns.set('track', [
      /track|monitor|check|follow/i,
      /status|progress|update/i
    ]);
    
    this.intentPatterns.set('learn', [
      /help|how|tutorial|guide/i,
      /learn|teach|explain/i,
      /what is|how to|why/i
    ]);
    
    // Entity patterns
    this.entityPatterns.set('property', /\d+\s+[A-Za-z\s]+(?:st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ct|court|ln|lane|way|pl|place)/i);
    this.entityPatterns.set('jurisdiction', /los angeles|orange county|san francisco|sacramento|riverside|san diego|ventura|fresno|kern|santa clara/i);
    this.entityPatterns.set('value', /\$[\d,]+|\d+\s*million|\d+\s*thousand|\d+k/i);
    this.entityPatterns.set('date', /\d{1,2}\/\d{1,2}\/\d{4}|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\s+days?|\d{1,2}\s+weeks?|\d{1,2}\s+months?/i);
    this.entityPatterns.set('action', /appeal|petition|assessment|reduction|challenge|protest/i);
  }
  
  private initializeSemanticWeights(): void {
    // High-value semantic indicators
    this.semanticWeights.set('overassessed', 2.0);
    this.semanticWeights.set('high value', 1.8);
    this.semanticWeights.set('commercial', 1.6);
    this.semanticWeights.set('deadline', 1.9);
    this.semanticWeights.set('urgent', 1.7);
    this.semanticWeights.set('potential savings', 1.5);
    
    // Intent reinforcement
    this.semanticWeights.set('similar properties', 1.4);
    this.semanticWeights.set('market analysis', 1.3);
    this.semanticWeights.set('evidence package', 1.6);
    this.semanticWeights.set('filing requirements', 1.5);
    this.semanticWeights.set('case status', 1.4);
  }
  
  private loadQueryHistory(): void {
    try {
      const saved = localStorage.getItem('charly_query_history');
      if (saved) {
        this.queryHistory = JSON.parse(saved).slice(-50); // Keep last 50 queries
      }
    } catch (error) {
      console.warn('Failed to load query history:', error);
    }
  }
  
  private saveQueryHistory(): void {
    try {
      localStorage.setItem('charly_query_history', JSON.stringify(this.queryHistory));
    } catch (error) {
      console.warn('Failed to save query history:', error);
    }
  }
  
  public recordQuery(query: SearchQuery): void {
    this.queryHistory.push(query);
    if (this.queryHistory.length > 50) {
      this.queryHistory.shift();
    }
    this.saveQueryHistory();
    this.updateBehavioralPatterns(query);
  }
  
  private updateBehavioralPatterns(query: SearchQuery): void {
    const key = `${query.context}_${query.intent}`;
    this.behavioralPatterns.set(key, (this.behavioralPatterns.get(key) || 0) + 1);
  }
  
  public predictNextIntent(currentContext: AttorneyContext): AttorneyIntent[] {
    const contextHistory = this.queryHistory
      .filter(q => q.context === currentContext)
      .slice(-10);
    
    const intentCounts = new Map<AttorneyIntent, number>();
    contextHistory.forEach(q => {
      if (q.intent) {
        intentCounts.set(q.intent, (intentCounts.get(q.intent) || 0) + 1);
      }
    });
    
    return Array.from(intentCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([intent]) => intent)
      .slice(0, 3);
  }
  
  public getContextualSuggestions(query: string, context: AttorneyContext): string[] {
    // Analyze recent queries for contextual suggestions
    
    const suggestions = this.generateSuggestions(query, context);
    
    // Add personalized suggestions based on history
    const personalizedSuggestions = this.generatePersonalizedSuggestions(context);
    
    return [...new Set([...suggestions, ...personalizedSuggestions])].slice(0, 5);
  }
  
  private generatePersonalizedSuggestions(context: AttorneyContext): string[] {
    const recent = this.queryHistory.slice(-10);
    const frequentEntities = new Map<string, number>();
    
    recent.forEach(q => {
      const parse = this.parseQuery(q.query);
      parse.entities.forEach(entity => {
        if (entity.type === 'jurisdiction' || entity.type === 'value') {
          frequentEntities.set(entity.value, (frequentEntities.get(entity.value) || 0) + 1);
        }
      });
    });
    
    const topEntity = Array.from(frequentEntities.entries())
      .sort(([, a], [, b]) => b - a)[0];
    
    if (!topEntity) return [];
    
    const [entityValue] = topEntity;
    
    switch (context) {
      case 'discovery':
        return [`Find more properties in ${entityValue}`, `Show recent sales in ${entityValue}`];
      case 'analysis':
        return [`Compare properties in ${entityValue}`, `Market trends for ${entityValue}`];
      default:
        return [];
    }
  }
  
  parseQuery(query: string): IntentParse {
    const entities = this.extractEntities(query);
    const context = this.detectContextEnhanced(query, entities);
    const intent = this.detectIntentEnhanced(query, context);
    const confidence = this.calculateEnhancedConfidence(query, context, intent, entities);
    const suggestions = this.generateContextualSuggestions(query, context);
    
    // Record query for learning
    const queryRecord: SearchQuery = {
      query,
      timestamp: Date.now(),
      context,
      intent,
      confidence
    };
    this.recordQuery(queryRecord);
    
    return {
      context,
      intent,
      entities,
      confidence,
      suggestions
    };
  }
  
  private detectContextEnhanced(query: string, entities: SearchEntity[]): AttorneyContext {
    const contextScores = new Map<AttorneyContext, number>();
    
    // Initialize scores
    for (const context of this.contextPatterns.keys()) {
      contextScores.set(context, 0);
    }
    
    // Pattern matching with weights
    for (const [context, patterns] of this.contextPatterns) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          score += 1;
        }
      }
      contextScores.set(context, score);
    }
    
    // Semantic enhancement
    for (const [phrase, weight] of this.semanticWeights) {
      if (query.toLowerCase().includes(phrase)) {
        // Apply semantic weights to relevant contexts
        if (phrase.includes('deadline') || phrase.includes('urgent')) {
          contextScores.set('filing', (contextScores.get('filing') || 0) + weight);
        }
        if (phrase.includes('analysis') || phrase.includes('compare')) {
          contextScores.set('analysis', (contextScores.get('analysis') || 0) + weight);
        }
        if (phrase.includes('overassessed') || phrase.includes('potential')) {
          contextScores.set('discovery', (contextScores.get('discovery') || 0) + weight);
        }
        if (phrase.includes('evidence') || phrase.includes('package')) {
          contextScores.set('preparation', (contextScores.get('preparation') || 0) + weight);
        }
        if (phrase.includes('status') || phrase.includes('case')) {
          contextScores.set('monitoring', (contextScores.get('monitoring') || 0) + weight);
        }
      }
    }
    
    // Entity-based context inference
    entities.forEach(entity => {
      if (entity.type === 'property' && entity.confidence > 0.7) {
        contextScores.set('analysis', (contextScores.get('analysis') || 0) + 1.5);
      }
      if (entity.type === 'value' && entity.confidence > 0.7) {
        contextScores.set('discovery', (contextScores.get('discovery') || 0) + 1.2);
      }
      if (entity.type === 'date' && entity.confidence > 0.7) {
        contextScores.set('filing', (contextScores.get('filing') || 0) + 1.3);
      }
    });
    
    // Historical pattern reinforcement
    const recentContexts = this.queryHistory.slice(-5).map(q => q.context);
    recentContexts.forEach(context => {
      if (context) {
        contextScores.set(context, (contextScores.get(context) || 0) + 0.3);
      }
    });
    
    // Find best context
    let bestContext: AttorneyContext = 'discovery';
    let bestScore = 0;
    
    for (const [context, score] of contextScores) {
      if (score > bestScore) {
        bestScore = score;
        bestContext = context;
      }
    }
    
    return bestContext;
  }
  
  private detectIntentEnhanced(query: string, context: AttorneyContext): AttorneyIntent {
    const intentScores = new Map<AttorneyIntent, number>();
    
    // Initialize scores
    for (const intent of this.intentPatterns.keys()) {
      intentScores.set(intent, 0);
    }
    
    // Pattern matching
    for (const [intent, patterns] of this.intentPatterns) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          score += 1;
        }
      }
      intentScores.set(intent, score);
    }
    
    // Context-intent correlation
    const contextIntentWeights = {
      discovery: { explore: 1.5, analyze: 0.8, create: 0.3 },
      analysis: { analyze: 1.8, explore: 0.7, create: 1.0 },
      preparation: { create: 1.9, analyze: 0.6, submit: 0.8 },
      filing: { submit: 1.7, track: 0.5, create: 0.4 },
      monitoring: { track: 1.6, explore: 0.4, learn: 0.7 }
    };
    
    const weights = contextIntentWeights[context] || {};
    for (const [intent, weight] of Object.entries(weights)) {
      intentScores.set(intent as AttorneyIntent, (intentScores.get(intent as AttorneyIntent) || 0) + weight);
    }
    
    // Predictive intent based on history
    const predictedIntents = this.predictNextIntent(context);
    predictedIntents.forEach((intent, index) => {
      const boost = (3 - index) * 0.4; // Decreasing boost for lower-ranked predictions
      intentScores.set(intent, (intentScores.get(intent) || 0) + boost);
    });
    
    // Find best intent
    let bestIntent: AttorneyIntent = 'explore';
    let bestScore = 0;
    
    for (const [intent, score] of intentScores) {
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }
    
    return bestIntent;
  }
  
  private calculateEnhancedConfidence(query: string, context: AttorneyContext, intent: AttorneyIntent, entities: SearchEntity[]): number {
    let confidence = 0.4; // Lower base confidence, earn it through signals
    
    // Entity quality boost
    const highConfidenceEntities = entities.filter(e => e.confidence > 0.8);
    confidence += highConfidenceEntities.length * 0.15;
    
    // Pattern strength
    const contextPatterns = this.contextPatterns.get(context) || [];
    const intentPatterns = this.intentPatterns.get(intent) || [];
    
    let strongPatternMatches = 0;
    for (const pattern of [...contextPatterns, ...intentPatterns]) {
      if (pattern.test(query)) {
        strongPatternMatches++;
      }
    }
    confidence += strongPatternMatches * 0.12;
    
    // Semantic richness
    for (const [phrase, weight] of this.semanticWeights) {
      if (query.toLowerCase().includes(phrase)) {
        confidence += 0.08 * (weight / 2.0); // Normalize semantic weights
      }
    }
    
    // Query complexity (longer, more specific queries are more confident)
    const wordCount = query.trim().split(/\s+/).length;
    if (wordCount > 3) {
      confidence += Math.min(wordCount - 3, 5) * 0.05;
    }
    
    // Historical consistency
    const recentSimilarQueries = this.queryHistory
      .filter(q => q.context === context && q.intent === intent)
      .slice(-3);
    
    if (recentSimilarQueries.length > 0) {
      const avgHistoricalConfidence = recentSimilarQueries.reduce((sum, q) => sum + (q.confidence || 0), 0) / recentSimilarQueries.length;
      confidence += avgHistoricalConfidence * 0.1; // Small boost from history
    }
    
    // Normalize to 0-1
    return Math.min(confidence, 1);
  }
  
  private extractEntities(query: string): SearchEntity[] {
    const entities: SearchEntity[] = [];
    
    for (const [type, pattern] of this.entityPatterns) {
      const matches = query.match(pattern);
      if (matches) {
        entities.push({
          type: type as SearchEntity['type'],
          value: matches[0],
          confidence: 0.8
        });
      }
    }
    
    return entities;
  }
  
  private detectContext(query: string): AttorneyContext {
    let bestContext: AttorneyContext = 'discovery';
    let bestScore = 0;
    
    for (const [context, patterns] of this.contextPatterns) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          score += 1;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestContext = context;
      }
    }
    
    return bestContext;
  }
  
  private detectIntent(query: string): AttorneyIntent {
    let bestIntent: AttorneyIntent = 'explore';
    let bestScore = 0;
    
    for (const [intent, patterns] of this.intentPatterns) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          score += 1;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }
    
    return bestIntent;
  }
  
  private calculateConfidence(query: string, context: AttorneyContext, intent: AttorneyIntent, entities: SearchEntity[]): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence for specific entities
    confidence += entities.length * 0.1;
    
    // Boost confidence for clear patterns
    const contextPatterns = this.contextPatterns.get(context) || [];
    const intentPatterns = this.intentPatterns.get(intent) || [];
    
    let patternMatches = 0;
    for (const pattern of [...contextPatterns, ...intentPatterns]) {
      if (pattern.test(query)) {
        patternMatches++;
      }
    }
    
    confidence += patternMatches * 0.15;
    
    // Normalize to 0-1
    return Math.min(confidence, 1);
  }
  
  private generateSuggestions(query: string, context: AttorneyContext): string[] {
    const suggestions: string[] = [];
    
    // Context-specific suggestions
    switch (context) {
      case 'discovery':
        suggestions.push(
          'Show me properties in Los Angeles over $1M',
          'Find commercial properties with high assessments',
          'Search properties by owner name'
        );
        break;
      case 'analysis':
        suggestions.push(
          'Analyze this property for appeal potential',
          'Compare property values in this area',
          'Calculate potential tax savings'
        );
        break;
      case 'preparation':
        suggestions.push(
          'Create an appeal for this property',
          'Generate evidence package',
          'Build residential appeal using template'
        );
        break;
      case 'filing':
        suggestions.push(
          'Submit appeal to Los Angeles County',
          'Check filing requirements',
          'Review appeal before submission'
        );
        break;
      case 'monitoring':
        suggestions.push(
          'Check status of my appeals',
          'Show recent appeal responses',
          'Track deadline for Case #12345'
        );
        break;
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }
}

// ============================================================================
// SEARCH INTERFACE COMPONENT
// ============================================================================

interface SearchDrivenInterfaceProps {
  className?: string;
  placeholder?: string;
  onQueryChange?: (query: string) => void;
}

export const SearchDrivenInterface: React.FC<SearchDrivenInterfaceProps> = ({
  className = '',
  placeholder = 'What would you like to do? (e.g., "find properties over $1M in LA")',
  onQueryChange
}) => {
  const [query, setQuery] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentParse, setCurrentParse] = useState<IntentParse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [workflowPrediction, setWorkflowPrediction] = useState<WorkflowPrediction | null>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  
  const processor = React.useMemo(() => new EnhancedNLProcessor(), []);
  const voice = useVoiceSearch({
    confidenceThreshold: 0.7,
    continuous: false
  });
  
  // Process query changes
  const processQuery = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setCurrentParse(null);
      setSuggestions([]);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Parse the natural language query
      const parse = processor.parseQuery(searchQuery);
      setCurrentParse(parse);
      setSuggestions(parse.suggestions || []);
      
      // Record query for prediction engine
      intentPredictionEngine.recordQuery({
        query: searchQuery,
        timestamp: Date.now(),
        context: parse.context,
        intent: parse.intent,
        confidence: parse.confidence
      });
      
      // Get workflow prediction
      const prediction = intentPredictionEngine.predictNextAction(parse.context, parse.intent);
      setWorkflowPrediction(prediction);
      setSmartSuggestions(prediction.suggestedActions);
      
      // Execute the interface transformation
      if (parse.confidence > 0.6) {
        await executeInterfaceAction(parse);
      }
      
      // Notify parent
      onQueryChange?.(searchQuery);
      
    } catch (error) {
      console.error('Query processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [processor, onQueryChange]);
  
  // Execute interface actions based on parsed intent
  const executeInterfaceAction = async (parse: IntentParse): Promise<void> => {
    // Update context engine with detected context and intent
    contextEngine.forceContext({
      context: parse.context,
      intent: parse.intent
    });
    
    // Update adaptive state based on entities
    const propertyEntity = parse.entities.find(e => e.type === 'property');
    if (propertyEntity && parse.context === 'analysis') {
      // Search for and select the property
      adaptiveState.dispatch({
        type: 'SEARCH_QUERY_CHANGED',
        payload: propertyEntity.value
      });
    }
    
    const valueEntity = parse.entities.find(e => e.type === 'value');
    if (valueEntity && parse.context === 'discovery') {
      // Apply value filter
      adaptiveState.dispatch({
        type: 'DATA_LOADED',
        payload: {
          context: 'discovery',
          data: { filters: { minValue: valueEntity.value } }
        }
      });
    }
    
    // Trigger context evolution
    contextEngine.evolveContext('search_query_executed', {
      query: parse,
      confidence: parse.confidence
    });
  };
  
  // Handle input changes with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      processQuery(query);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, processQuery]);
  
  // Handle voice search results
  useEffect(() => {
    if (voice.transcript && voice.transcript !== query) {
      setQuery(voice.transcript);
      voice.clearTranscript();
    }
  }, [voice, query, setQuery]);
  
  // Handle voice search commands
  useEffect(() => {
    if (voice.voiceEngine) {
      voice.voiceEngine.onQuery = (voiceQuery) => {
        setQuery(voiceQuery);
      };
      
      voice.voiceEngine.onCommand = (command) => {
        // Handle voice commands
        switch (command.action) {
          case 'search_properties':
            setQuery('find properties');
            break;
          case 'show_help':
            setQuery('help');
            break;
          default:
            console.log('Voice command:', command.action);
        }
      };
    }
  }, [voice, setQuery]);
  
  // Handle suggestion selection
  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setIsActive(false);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      processQuery(query);
      setIsActive(false);
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsActive(true)}
            onBlur={() => setTimeout(() => setIsActive(false), 200)}
            placeholder={placeholder}
            className="w-full px-6 py-4 text-lg bg-white border-2 border-gray-200 rounded-2xl shadow-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
          />
          
          {/* Loading indicator */}
          {isProcessing && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Voice & Search controls */}
          {!isProcessing && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              {/* Voice search button */}
              {voice.isSupported && (
                <button
                  onClick={voice.isListening ? voice.stopListening : voice.startListening}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    voice.isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  title={voice.isListening ? 'Stop listening' : 'Start voice search'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}
              
              {/* Search icon */}
              <div className="text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}
        </div>
        
        {/* Confidence indicator */}
        {currentParse && currentParse.confidence > 0.6 && (
          <div className="absolute left-6 -bottom-8 flex items-center space-x-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Understanding: {Math.round(currentParse.confidence * 100)}%</span>
          </div>
        )}
      </form>
      
      {/* Enhanced Suggestions Dropdown */}
      {isActive && (suggestions.length > 0 || smartSuggestions.length > 0) && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Contextual Suggestions */}
          {suggestions.length > 0 && (
            <>
              <div className="p-3 border-b border-gray-100 bg-gray-50">
                <span className="text-sm font-medium text-gray-600">Query Suggestions</span>
              </div>
              
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => selectSuggestion(suggestion)}
                  className="w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 border-b border-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>{suggestion}</span>
                  </div>
                </button>
              ))}
            </>
          )}
          
          {/* Smart Workflow Predictions */}
          {smartSuggestions.length > 0 && workflowPrediction && (
            <>
              <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-700">Smart Predictions</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-purple-600">
                      {Math.round(workflowPrediction.confidence * 100)}% confident
                    </span>
                  </div>
                </div>
                {workflowPrediction.urgencyLevel !== 'low' && (
                  <div className="mt-1 text-xs text-orange-600">
                    Urgency: {workflowPrediction.urgencyLevel}
                  </div>
                )}
              </div>
              
              {smartSuggestions.map((suggestion, index) => (
                <button
                  key={`smart-${index}`}
                  onClick={() => selectSuggestion(suggestion)}
                  className="w-full px-4 py-3 text-left text-purple-700 hover:bg-purple-50 hover:text-purple-800 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></div>
                    <div>
                      <div className="font-medium">{suggestion}</div>
                      {index === 0 && workflowPrediction.timeToNext && (
                        <div className="text-xs text-purple-500 mt-1">
                          Predicted in ~{workflowPrediction.timeToNext} minutes
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
      
      {/* Current Parse Display (Debug) */}
      {currentParse && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-full mt-16 w-full bg-black/90 text-white p-4 rounded-lg text-xs z-40">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Context:</strong> {currentParse.context}<br/>
              <strong>Intent:</strong> {currentParse.intent}<br/>
              <strong>Confidence:</strong> {Math.round(currentParse.confidence * 100)}%
            </div>
            <div>
              <strong>Entities:</strong>
              {currentParse.entities.map((entity, i) => (
                <div key={i} className="ml-2">
                  {entity.type}: {entity.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// INTEGRATED SEARCH-DRIVEN COMPOSER
// ============================================================================

interface SearchDrivenComposerProps {
  className?: string;
}

export const SearchDrivenComposer: React.FC<SearchDrivenComposerProps> = ({
  className = ''
}) => {
  const [currentQuery, setCurrentQuery] = useState('');
  
  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 ${className}`}>
      {/* Search Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <SearchDrivenInterface
              placeholder="Ask CHARLY anything... (e.g., 'show me overassessed properties in LA')"
              onQueryChange={setCurrentQuery}
            />
          </div>
        </div>
      </div>
      
      {/* Adaptive Interface */}
      <div className="relative">
        <AdaptiveComposer className="pb-20" />
      </div>
      
      {/* Query Display */}
      {currentQuery && (
        <div className="fixed bottom-6 left-6 bg-black/80 text-white px-4 py-2 rounded-lg text-sm z-40">
          Last query: "{currentQuery}"
        </div>
      )}
    </div>
  );
};


export default SearchDrivenInterface;