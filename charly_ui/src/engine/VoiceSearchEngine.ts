/**
 * 🍎 CHARLY 2.0 - VOICE SEARCH ENGINE
 * 
 * Advanced voice recognition and natural language processing for hands-free
 * attorney workflow. Optimized for legal terminology and property tax context.
 */

// ============================================================================
// VOICE SEARCH TYPES
// ============================================================================

export interface VoiceSearchConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  confidenceThreshold: number;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  alternatives: VoiceAlternative[];
  isFinal: boolean;
  timestamp: number;
}

export interface VoiceAlternative {
  transcript: string;
  confidence: number;
}

export interface VoiceCommand {
  pattern: RegExp;
  action: string;
  context?: string;
  confidence: number;
}

// ============================================================================
// VOICE SEARCH ENGINE
// ============================================================================

export class VoiceSearchEngine {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private config: VoiceSearchConfig;
  private voiceCommands: Map<string, VoiceCommand> = new Map();
  private legalTerms: Set<string> = new Set();
  
  constructor(config: Partial<VoiceSearchConfig> = {}) {
    this.config = {
      language: 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      confidenceThreshold: 0.7,
      ...config
    };
    
    this.initializeLegalTerms();
    this.initializeVoiceCommands();
    this.setupSpeechRecognition();
  }
  
  private initializeLegalTerms(): void {
    // Property tax specific terms
    const terms = [
      'assessment', 'assessed value', 'market value', 'appeal', 'petition',
      'jurisdiction', 'county', 'parcel', 'property', 'commercial', 'residential',
      'cap rate', 'net operating income', 'NOI', 'expense ratio',
      'Los Angeles', 'Orange County', 'San Francisco', 'Sacramento',
      'overassessed', 'underassessed', 'comparable', 'appraisal',
      'deadline', 'filing', 'submission', 'evidence', 'documentation'
    ];
    
    terms.forEach(term => this.legalTerms.add(term.toLowerCase()));
  }
  
  private initializeVoiceCommands(): void {
    // Quick action commands
    this.voiceCommands.set('find_properties', {
      pattern: /find|search|show|display.*properties/i,
      action: 'search_properties',
      confidence: 0.8
    });
    
    this.voiceCommands.set('analyze_property', {
      pattern: /analyze|examine|review.*property/i,
      action: 'analyze_property',
      context: 'analysis',
      confidence: 0.8
    });
    
    this.voiceCommands.set('create_appeal', {
      pattern: /create|build|generate.*appeal/i,
      action: 'create_appeal',
      context: 'preparation',
      confidence: 0.85
    });
    
    this.voiceCommands.set('check_status', {
      pattern: /check|track|monitor.*status/i,
      action: 'check_status',
      context: 'monitoring',
      confidence: 0.8
    });
    
    this.voiceCommands.set('file_appeal', {
      pattern: /file|submit.*appeal/i,
      action: 'file_appeal',
      context: 'filing',
      confidence: 0.85
    });
    
    // Navigation commands
    this.voiceCommands.set('go_dashboard', {
      pattern: /go to dashboard|show dashboard|dashboard/i,
      action: 'navigate_dashboard',
      confidence: 0.9
    });
    
    this.voiceCommands.set('go_portfolio', {
      pattern: /go to portfolio|show portfolio|portfolio/i,
      action: 'navigate_portfolio',
      confidence: 0.9
    });
    
    // System commands
    this.voiceCommands.set('help', {
      pattern: /help|assist|support/i,
      action: 'show_help',
      confidence: 0.9
    });
    
    this.voiceCommands.set('stop_listening', {
      pattern: /stop|cancel|never mind/i,
      action: 'stop_listening',
      confidence: 0.95
    });
  }
  
  private setupSpeechRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
    
    this.recognition.onstart = () => {
      this.isListening = true;
      this.onListeningStart?.();
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      this.onListeningEnd?.();
    };
    
    this.recognition.onresult = (event) => {
      this.handleSpeechResult(event);
    };
    
    this.recognition.onerror = (event) => {
      this.onError?.(event.error);
    };
  }
  
  private handleSpeechResult(event: SpeechRecognitionEvent): void {
    const results: VoiceRecognitionResult[] = [];
    
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      
      if (result.isFinal || this.config.interimResults) {
        const alternatives: VoiceAlternative[] = [];
        
        for (let j = 0; j < result.length; j++) {
          alternatives.push({
            transcript: result[j].transcript,
            confidence: result[j].confidence
          });
        }
        
        const enhancedTranscript = this.enhanceTranscript(result[0].transcript);
        
        results.push({
          transcript: enhancedTranscript,
          confidence: result[0].confidence,
          alternatives,
          isFinal: result.isFinal,
          timestamp: Date.now()
        });
      }
    }
    
    results.forEach(result => {
      if (result.confidence >= this.config.confidenceThreshold) {
        this.processVoiceResult(result);
      }
    });
  }
  
  private enhanceTranscript(transcript: string): string {
    let enhanced = transcript.toLowerCase();
    
    // Legal term corrections
    const corrections = new Map([
      ['assess value', 'assessed value'],
      ['cap right', 'cap rate'],
      ['los angelous', 'los angeles'],
      ['orange county', 'orange county'],
      ['real estate', 'real estate'],
      ['noi', 'NOI'],
      ['over assessed', 'overassessed']
    ]);
    
    for (const [wrong, correct] of corrections) {
      enhanced = enhanced.replace(new RegExp(wrong, 'gi'), correct);
    }
    
    // Capitalize proper nouns
    enhanced = enhanced.replace(/\blos angeles\b/gi, 'Los Angeles');
    enhanced = enhanced.replace(/\borange county\b/gi, 'Orange County');
    enhanced = enhanced.replace(/\bsan francisco\b/gi, 'San Francisco');
    
    return enhanced;
  }
  
  private processVoiceResult(result: VoiceRecognitionResult): void {
    // Check for voice commands
    const command = this.detectVoiceCommand(result.transcript);
    
    if (command) {
      this.onCommand?.(command, result);
    } else {
      // Treat as search query
      this.onQuery?.(result.transcript, result);
    }
    
    this.onResult?.(result);
  }
  
  private detectVoiceCommand(transcript: string): VoiceCommand | null {
    for (const command of this.voiceCommands.values()) {
      if (command.pattern.test(transcript)) {
        return command;
      }
    }
    
    return null;
  }
  
  public startListening(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not available'));
        return;
      }
      
      if (this.isListening) {
        resolve();
        return;
      }
      
      try {
        this.recognition.start();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }
  
  public isCurrentlyListening(): boolean {
    return this.isListening;
  }
  
  public getAvailableCommands(): string[] {
    return Array.from(this.voiceCommands.keys());
  }
  
  public addCustomCommand(id: string, command: VoiceCommand): void {
    this.voiceCommands.set(id, command);
  }
  
  // Event handlers
  public onListeningStart?: () => void;
  public onListeningEnd?: () => void;
  public onResult?: (result: VoiceRecognitionResult) => void;
  public onQuery?: (query: string, result: VoiceRecognitionResult) => void;
  public onCommand?: (command: VoiceCommand, result: VoiceRecognitionResult) => void;
  public onError?: (error: string) => void;
}

// ============================================================================
// VOICE SEARCH HOOK
// ============================================================================

export const useVoiceSearch = (config?: Partial<VoiceSearchConfig>) => {
  const [isListening, setIsListening] = React.useState(false);
  const [isSupported, setIsSupported] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [transcript, setTranscript] = React.useState('');
  
  const voiceEngine = React.useMemo(() => {
    const engine = new VoiceSearchEngine(config);
    
    engine.onListeningStart = () => setIsListening(true);
    engine.onListeningEnd = () => setIsListening(false);
    engine.onError = (error) => setError(error);
    engine.onResult = (result) => {
      if (result.isFinal) {
        setTranscript(result.transcript);
      }
    };
    
    return engine;
  }, [config]);
  
  React.useEffect(() => {
    setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);
  
  const startListening = React.useCallback(async () => {
    try {
      setError(null);
      await voiceEngine.startListening();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start voice recognition');
    }
  }, [voiceEngine]);
  
  const stopListening = React.useCallback(() => {
    voiceEngine.stopListening();
  }, [voiceEngine]);
  
  const clearTranscript = React.useCallback(() => {
    setTranscript('');
  }, []);
  
  return {
    isListening,
    isSupported,
    error,
    transcript,
    startListening,
    stopListening,
    clearTranscript,
    voiceEngine
  };
};

// Type augmentation for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default VoiceSearchEngine;