/**
 * 🍎 CHARLY 2.0 - ADAPTIVE STATE MANAGEMENT
 * 
 * Unified state system that adapts to context and eliminates traditional Redux complexity.
 * State shape changes based on attorney workflow context - no more static global state.
 */

import { contextEngine, type ContextSnapshot, type AttorneyContext } from './ContextEngine';

// ============================================================================
// ADAPTIVE STATE TYPES
// ============================================================================

export interface PropertyData {
  id: string;
  address: string;
  assessedValue: number;
  marketValue: number;
  propertyType: string;
  jurisdiction: string;
  taxYear: number;
  status: 'active' | 'flagged' | 'appealing' | 'won' | 'lost';
  confidence: number;
  lastUpdated: number;
}

export interface AppealData {
  id: string;
  propertyId: string;
  status: 'draft' | 'review' | 'submitted' | 'pending' | 'approved' | 'denied';
  targetValue: number;
  evidence: string[];
  filingDate?: number;
  deadline?: number;
  progress: number;
}

export interface WorkflowState {
  active: boolean;
  step: number;
  totalSteps: number;
  data: Record<string, unknown>;
  completedSteps: number[];
  blockedSteps: number[];
}

// Context-specific state shapes
export interface DiscoveryState {
  searchQuery: string;
  filters: Record<string, unknown>;
  results: PropertyData[];
  savedSearches: string[];
  recentlyViewed: string[];
  marketTrends: unknown[];
}

export interface AnalysisState {
  selectedProperty: PropertyData | null;
  comparisons: PropertyData[];
  insights: unknown[];
  financialMetrics: Record<string, number>;
  riskAssessment: unknown;
}

export interface PreparationState {
  appeal: AppealData | null;
  templates: unknown[];
  documents: string[];
  evidence: unknown[];
  checklist: string[];
}

export interface FilingState {
  submissions: AppealData[];
  deadlines: unknown[];
  requirements: string[];
  contacts: unknown[];
  forms: Record<string, unknown>;
}

export interface MonitoringState {
  appeals: AppealData[];
  notifications: unknown[];
  responses: unknown[];
  timeline: unknown[];
  metrics: Record<string, number>;
}

// Unified adaptive state
export interface AdaptiveState {
  // Core data (always present)
  user: {
    id: string;
    role: string;
    preferences: Record<string, unknown>;
    experience: 'novice' | 'intermediate' | 'expert';
  };
  
  // Context-specific state (dynamically loaded)
  discovery?: DiscoveryState;
  analysis?: AnalysisState;
  preparation?: PreparationState;
  filing?: FilingState;
  monitoring?: MonitoringState;
  
  // Meta state
  loading: Record<string, boolean>;
  errors: Record<string, string>;
  cache: Record<string, unknown>;
  
  // UI state (adapts to context)
  interface: {
    layout: string;
    density: string;
    theme: string;
    components: string[];
  };
  
  lastUpdated: number;
}

// ============================================================================
// STATE ACTIONS
// ============================================================================

export type StateAction = 
  | { type: 'CONTEXT_CHANGED'; payload: ContextSnapshot }
  | { type: 'PROPERTY_SELECTED'; payload: PropertyData }
  | { type: 'SEARCH_QUERY_CHANGED'; payload: string }
  | { type: 'APPEAL_CREATED'; payload: AppealData }
  | { type: 'WORKFLOW_STEP_COMPLETED'; payload: { workflow: string; step: number } }
  | { type: 'DATA_LOADED'; payload: { context: AttorneyContext; data: unknown } }
  | { type: 'ERROR_OCCURRED'; payload: { key: string; message: string } }
  | { type: 'CACHE_SET'; payload: { key: string; data: unknown } }
  | { type: 'INTERFACE_UPDATED'; payload: unknown };

// ============================================================================
// ADAPTIVE STATE MANAGER
// ============================================================================

export class AdaptiveStateManager {
  private state: AdaptiveState;
  private listeners: Set<(state: AdaptiveState) => void> = new Set();
  private contextUnsubscribe: (() => void) | null = null;
  
  constructor() {
    this.state = this.initializeState();
    this.subscribeToContext();
    this.setupPersistence();
  }
  
  private initializeState(): AdaptiveState {
    return {
      user: {
        id: 'user-1',
        role: 'attorney',
        preferences: {},
        experience: 'intermediate'
      },
      loading: {},
      errors: {},
      cache: {},
      interface: {
        layout: 'dashboard',
        density: 'comfortable',
        theme: 'light',
        components: []
      },
      lastUpdated: Date.now()
    };
  }
  
  // ============================================================================
  // CONTEXT-DRIVEN STATE ADAPTATION
  // ============================================================================
  
  private subscribeToContext(): void {
    this.contextUnsubscribe = contextEngine.subscribe((context) => {
      this.handleContextChange(context);
    });
  }
  
  private handleContextChange(context: ContextSnapshot): void {
    // Adapt state shape based on context
    this.loadContextualState(context.context);
    
    // Update interface composition
    const composition = contextEngine.getInterfaceComposition();
    
    this.dispatch({
      type: 'INTERFACE_UPDATED',
      payload: {
        layout: composition.layout,
        density: composition.density,
        components: composition.primaryComponents
      }
    });
    
    this.dispatch({
      type: 'CONTEXT_CHANGED',
      payload: context
    });
  }
  
  private async loadContextualState(context: AttorneyContext): Promise<void> {
    // Only load state sections needed for current context
    switch (context) {
      case 'discovery':
        await this.ensureDiscoveryState();
        this.unloadUnneededState(['preparation', 'filing']);
        break;
        
      case 'analysis':
        await this.ensureAnalysisState();
        this.unloadUnneededState(['filing', 'monitoring']);
        break;
        
      case 'preparation':
        await this.ensurePreparationState();
        this.unloadUnneededState(['discovery', 'monitoring']);
        break;
        
      case 'filing':
        await this.ensureFilingState();
        this.unloadUnneededState(['discovery', 'analysis']);
        break;
        
      case 'monitoring':
        await this.ensureMonitoringState();
        this.unloadUnneededState(['discovery', 'preparation']);
        break;
    }
  }
  
  private async ensureDiscoveryState(): Promise<void> {
    if (!this.state.discovery) {
      this.state.discovery = {
        searchQuery: '',
        filters: {},
        results: [],
        savedSearches: [],
        recentlyViewed: [],
        marketTrends: []
      };
      
      // Load saved searches and recent activity
      await this.loadDiscoveryData();
    }
  }
  
  private async ensureAnalysisState(): Promise<void> {
    if (!this.state.analysis) {
      this.state.analysis = {
        selectedProperty: null,
        comparisons: [],
        insights: [],
        financialMetrics: {},
        riskAssessment: null
      };
    }
  }
  
  private async ensurePreparationState(): Promise<void> {
    if (!this.state.preparation) {
      this.state.preparation = {
        appeal: null,
        templates: [],
        documents: [],
        evidence: [],
        checklist: []
      };
      
      await this.loadPreparationData();
    }
  }
  
  private async ensureFilingState(): Promise<void> {
    if (!this.state.filing) {
      this.state.filing = {
        submissions: [],
        deadlines: [],
        requirements: [],
        contacts: [],
        forms: {}
      };
      
      await this.loadFilingData();
    }
  }
  
  private async ensureMonitoringState(): Promise<void> {
    if (!this.state.monitoring) {
      this.state.monitoring = {
        appeals: [],
        notifications: [],
        responses: [],
        timeline: [],
        metrics: {}
      };
      
      await this.loadMonitoringData();
    }
  }
  
  private unloadUnneededState(contexts: string[]): void {
    // Free memory by removing unneeded state sections
    contexts.forEach(context => {
      if (context in this.state) {
        delete (this.state as Record<string, unknown>)[context];
      }
    });
  }
  
  // ============================================================================
  // DATA LOADING (SIMULATED)
  // ============================================================================
  
  private async loadDiscoveryData(): Promise<void> {
    // Simulate loading saved searches and recent activity
    this.setLoading('discovery', true);
    
    try {
      // Mock data - replace with real API calls
      const savedSearches = ['High-value commercial', 'Residential overassessed'];
      const recentlyViewed = ['prop-1', 'prop-2', 'prop-3'];
      
      this.state.discovery!.savedSearches = savedSearches;
      this.state.discovery!.recentlyViewed = recentlyViewed;
      
    } catch (error) {
      console.error('Failed to load discovery data:', error);
      this.setError('discovery', 'Failed to load discovery data');
    } finally {
      this.setLoading('discovery', false);
    }
  }
  
  private async loadPreparationData(): Promise<void> {
    this.setLoading('preparation', true);
    
    try {
      // Load templates and checklists
      const templates = [
        { id: 't1', name: 'Commercial Appeal Template', category: 'commercial' },
        { id: 't2', name: 'Residential Appeal Template', category: 'residential' }
      ];
      
      this.state.preparation!.templates = templates;
      
    } catch (error) {
      console.error('Failed to load preparation data:', error);
      this.setError('preparation', 'Failed to load preparation data');
    } finally {
      this.setLoading('preparation', false);
    }
  }
  
  private async loadFilingData(): Promise<void> {
    this.setLoading('filing', true);
    
    try {
      // Load jurisdictional requirements and contacts
      const requirements = [
        'Property ownership documentation',
        'Comparable sales evidence',
        'Professional appraisal (if applicable)'
      ];
      
      this.state.filing!.requirements = requirements;
      
    } catch (error) {
      console.error('Failed to load filing data:', error);
      this.setError('filing', 'Failed to load filing data');
    } finally {
      this.setLoading('filing', false);
    }
  }
  
  private async loadMonitoringData(): Promise<void> {
    this.setLoading('monitoring', true);
    
    try {
      // Load active appeals and their status
      const appeals: AppealData[] = [
        {
          id: 'appeal-1',
          propertyId: 'prop-1',
          status: 'pending',
          targetValue: 850000,
          evidence: ['comp1.pdf', 'comp2.pdf'],
          progress: 75
        }
      ];
      
      this.state.monitoring!.appeals = appeals;
      
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      this.setError('monitoring', 'Failed to load monitoring data');
    } finally {
      this.setLoading('monitoring', false);
    }
  }
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  dispatch(action: StateAction): void {
    // const previousState = { ...this.state };
    
    switch (action.type) {
      case 'CONTEXT_CHANGED':
        // Context changes are handled automatically
        break;
        
      case 'PROPERTY_SELECTED':
        if (this.state.analysis) {
          this.state.analysis.selectedProperty = action.payload;
        }
        break;
        
      case 'SEARCH_QUERY_CHANGED':
        if (this.state.discovery) {
          this.state.discovery.searchQuery = action.payload;
        }
        break;
        
      case 'APPEAL_CREATED':
        if (this.state.preparation) {
          this.state.preparation.appeal = action.payload;
        }
        break;
        
      case 'DATA_LOADED':
        this.handleDataLoaded(action.payload);
        break;
        
      case 'ERROR_OCCURRED':
        this.state.errors[action.payload.key] = action.payload.message;
        break;
        
      case 'CACHE_SET':
        this.state.cache[action.payload.key] = action.payload.data;
        break;
        
      case 'INTERFACE_UPDATED':
        this.state.interface = { ...this.state.interface, ...action.payload };
        break;
    }
    
    this.state.lastUpdated = Date.now();
    this.notifyListeners();
    this.persistState();
  }
  
  private handleDataLoaded({ context, data }: { context: AttorneyContext; data: unknown }): void {
    switch (context) {
      case 'discovery':
        if (this.state.discovery) {
          this.state.discovery.results = data.properties || [];
          this.state.discovery.marketTrends = data.trends || [];
        }
        break;
        
      case 'analysis':
        if (this.state.analysis) {
          this.state.analysis.comparisons = data.comparisons || [];
          this.state.analysis.insights = data.insights || [];
        }
        break;
    }
  }
  
  // ============================================================================
  // UTILITIES
  // ============================================================================
  
  private setLoading(key: string, loading: boolean): void {
    this.state.loading[key] = loading;
    this.notifyListeners();
  }
  
  private setError(key: string, message: string): void {
    this.state.errors[key] = message;
    this.notifyListeners();
  }
  
  private clearError(key: string): void {
    delete this.state.errors[key];
    this.notifyListeners();
  }
  
  // ============================================================================
  // PERSISTENCE
  // ============================================================================
  
  private setupPersistence(): void {
    // Auto-save state every 30 seconds
    setInterval(() => {
      this.persistState();
    }, 30000);
    
    // Save on page unload
    window.addEventListener('beforeunload', () => {
      this.persistState();
    });
    
    // Load persisted state
    this.loadPersistedState();
  }
  
  private persistState(): void {
    try {
      // Only persist essential data, not the full state
      const persistData = {
        user: this.state.user,
        discovery: this.state.discovery ? {
          searchQuery: this.state.discovery.searchQuery,
          savedSearches: this.state.discovery.savedSearches,
          recentlyViewed: this.state.discovery.recentlyViewed
        } : undefined,
        analysis: this.state.analysis ? {
          selectedProperty: this.state.analysis.selectedProperty
        } : undefined,
        preparation: this.state.preparation ? {
          appeal: this.state.preparation.appeal
        } : undefined
      };
      
      localStorage.setItem('charly-adaptive-state', JSON.stringify(persistData));
    } catch (error) {
      console.warn('Failed to persist state:', error);
    }
  }
  
  private loadPersistedState(): void {
    try {
      const persistedData = localStorage.getItem('charly-adaptive-state');
      if (persistedData) {
        const data = JSON.parse(persistedData);
        
        // Merge persisted data with current state
        this.state = { ...this.state, ...data };
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
  }
  
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  
  getState(): AdaptiveState {
    return { ...this.state };
  }
  
  subscribe(listener: (state: AdaptiveState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
  
  // Get context-specific state slice
  getContextState<T>(context: AttorneyContext): T | null {
    return (this.state as Record<string, unknown>)[context] as T || null;
  }
  
  // Force a specific state (for testing)
  setState(newState: Partial<AdaptiveState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }
  
  // Clear all data (logout)
  reset(): void {
    this.state = this.initializeState();
    localStorage.removeItem('charly-adaptive-state');
    this.notifyListeners();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const adaptiveState = new AdaptiveStateManager();