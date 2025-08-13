/**
 * CHARLY 2.0 - Gesture Accessibility Support
 * WCAG 2.1 AA compliant gesture alternatives and voice commands
 * Task 21: Revolutionary Gesture-Based Navigation - Accessibility
 */

import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// type GestureAlternative = 'keyboard' | 'voice' | 'button' | 'menu';

interface AccessibilitySettings {
  reduceMotion: boolean;
  enableVoiceCommands: boolean;
  enableKeyboardShortcuts: boolean;
  enableGestureAlternatives: boolean;
  enableAudioDescription: boolean;
  largeTextMode: boolean;
  highContrastMode: boolean;
  focusIndicatorSize: 'normal' | 'large' | 'extra-large';
}

interface GestureAccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  announceAction: (message: string) => void;
  isVoiceCommandActive: boolean;
  startVoiceCommand: () => void;
  stopVoiceCommand: () => void;
  registerGestureAlternative: (gesture: string, alternative: () => void, description: string) => void;
  unregisterGestureAlternative: (gesture: string) => void;
  showGestureAlternatives: boolean;
  setShowGestureAlternatives: (show: boolean) => void;
}

const GestureAccessibilityContext = createContext<GestureAccessibilityContextType | null>(null);

export const useGestureAccessibility = () => {
  const context = useContext(GestureAccessibilityContext);
  if (!context) {
    throw new Error('useGestureAccessibility must be used within a GestureAccessibilityProvider');
  }
  return context;
};

interface GestureAccessibilityProviderProps {
  children: React.ReactNode;
  className?: string;
}

export const GestureAccessibilityProvider: React.FC<GestureAccessibilityProviderProps> = ({
  children,
  className = ''
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    enableVoiceCommands: false,
    enableKeyboardShortcuts: true,
    enableGestureAlternatives: true,
    enableAudioDescription: false,
    largeTextMode: false,
    highContrastMode: window.matchMedia('(prefers-contrast: high)').matches,
    focusIndicatorSize: 'normal'
  });

  const [isVoiceCommandActive, setIsVoiceCommandActive] = useState(false);
  const [showGestureAlternatives, setShowGestureAlternatives] = useState(false);
  const [gestureAlternatives, setGestureAlternatives] = useState<Map<string, {
    action: () => void;
    description: string;
  }>>(new Map());

  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (!settings.enableVoiceCommands) return;

    const SpeechRecognition = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = true;
      speechRecognitionRef.current.interimResults = true;
      speechRecognitionRef.current.lang = 'en-US';

      speechRecognitionRef.current.onresult = (event) => {
        const transcript = event.results[event.resultIndex][0].transcript.toLowerCase().trim();
        handleVoiceCommand(transcript);
      };

      speechRecognitionRef.current.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsVoiceCommandActive(false);
      };

      speechRecognitionRef.current.onend = () => {
        setIsVoiceCommandActive(false);
      };
    }
  }, [settings.enableVoiceCommands, handleVoiceCommand]);

  // Handle voice commands
  const handleVoiceCommand = useCallback((transcript: string) => {
    // Navigation commands
    if (transcript.includes('go to dashboard') || transcript.includes('dashboard')) {
      window.location.hash = '/dashboard';
      announceAction('Navigated to dashboard');
    } else if (transcript.includes('go to portfolio') || transcript.includes('portfolio')) {
      window.location.hash = '/portfolio';
      announceAction('Navigated to portfolio');
    } else if (transcript.includes('go to appeals') || transcript.includes('appeals')) {
      window.location.hash = '/appeals';
      announceAction('Navigated to appeals');
    } else if (transcript.includes('go to reports') || transcript.includes('reports')) {
      window.location.hash = '/reports';
      announceAction('Navigated to reports');
    } else if (transcript.includes('go to settings') || transcript.includes('settings')) {
      window.location.hash = '/settings';
      announceAction('Navigated to settings');
    }
    
    // Action commands
    else if (transcript.includes('refresh') || transcript.includes('reload')) {
      window.location.reload();
      announceAction('Page refreshed');
    } else if (transcript.includes('go back') || transcript.includes('back')) {
      window.history.back();
      announceAction('Went back');
    } else if (transcript.includes('scroll up')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      announceAction('Scrolled to top');
    } else if (transcript.includes('scroll down')) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      announceAction('Scrolled to bottom');
    }
    
    // Gesture alternatives
    else if (transcript.includes('show alternatives') || transcript.includes('alternatives')) {
      setShowGestureAlternatives(true);
      announceAction('Showing gesture alternatives');
    } else if (transcript.includes('hide alternatives')) {
      setShowGestureAlternatives(false);
      announceAction('Hiding gesture alternatives');
    }
    
    // Help commands
    else if (transcript.includes('help') || transcript.includes('what can i say')) {
      announceAction('Voice commands: go to dashboard, portfolio, appeals, reports, settings. Say refresh, go back, scroll up, scroll down, show alternatives, or help.');
    }
  }, [announceAction]);

  // Update accessibility settings
  const updateSettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Announce actions for screen readers
  const announceAction = useCallback((message: string) => {
    if (!settings.enableAudioDescription) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }

    // Also announce to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [settings.enableAudioDescription]);

  // Start voice command recognition
  const startVoiceCommand = useCallback(() => {
    if (speechRecognitionRef.current && !isVoiceCommandActive) {
      setIsVoiceCommandActive(true);
      speechRecognitionRef.current.start();
      announceAction('Voice commands activated. Say help for available commands.');
    }
  }, [isVoiceCommandActive, announceAction]);

  // Stop voice command recognition
  const stopVoiceCommand = useCallback(() => {
    if (speechRecognitionRef.current && isVoiceCommandActive) {
      speechRecognitionRef.current.stop();
      setIsVoiceCommandActive(false);
      announceAction('Voice commands deactivated.');
    }
  }, [isVoiceCommandActive, announceAction]);

  // Register gesture alternative
  const registerGestureAlternative = useCallback((gesture: string, alternative: () => void, description: string) => {
    setGestureAlternatives(prev => new Map(prev).set(gesture, { action: alternative, description }));
  }, []);

  // Unregister gesture alternative
  const unregisterGestureAlternative = useCallback((gesture: string) => {
    setGestureAlternatives(prev => {
      const newMap = new Map(prev);
      newMap.delete(gesture);
      return newMap;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!settings.enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Navigation shortcuts
      if (event.altKey) {
        switch (event.key) {
          case '1':
            window.location.hash = '/dashboard';
            announceAction('Navigated to dashboard');
            event.preventDefault();
            break;
          case '2':
            window.location.hash = '/portfolio';
            announceAction('Navigated to portfolio');
            event.preventDefault();
            break;
          case '3':
            window.location.hash = '/appeals';
            announceAction('Navigated to appeals');
            event.preventDefault();
            break;
          case '4':
            window.location.hash = '/reports';
            announceAction('Navigated to reports');
            event.preventDefault();
            break;
          case '5':
            window.location.hash = '/settings';
            announceAction('Navigated to settings');
            event.preventDefault();
            break;
        }
      }

      // Voice command shortcut
      if (event.ctrlKey && event.key === 'k') {
        if (isVoiceCommandActive) {
          stopVoiceCommand();
        } else {
          startVoiceCommand();
        }
        event.preventDefault();
      }

      // Gesture alternatives shortcut
      if (event.ctrlKey && event.key === 'g') {
        setShowGestureAlternatives(prev => !prev);
        announceAction(showGestureAlternatives ? 'Hiding gesture alternatives' : 'Showing gesture alternatives');
        event.preventDefault();
      }

      // Refresh shortcut
      if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        announceAction('Page refreshed');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings.enableKeyboardShortcuts, isVoiceCommandActive, showGestureAlternatives, announceAction, startVoiceCommand, stopVoiceCommand]);

  // Apply accessibility styles
  useEffect(() => {
    const root = document.documentElement;
    
    if (settings.largeTextMode) {
      root.style.fontSize = '120%';
    } else {
      root.style.fontSize = '';
    }

    if (settings.highContrastMode) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [settings.largeTextMode, settings.highContrastMode, settings.reduceMotion]);

  // Context value
  const contextValue: GestureAccessibilityContextType = {
    settings,
    updateSettings,
    announceAction,
    isVoiceCommandActive,
    startVoiceCommand,
    stopVoiceCommand,
    registerGestureAlternative,
    unregisterGestureAlternative,
    showGestureAlternatives,
    setShowGestureAlternatives
  };

  return (
    <GestureAccessibilityContext.Provider value={contextValue}>
      <div ref={containerRef} className={`relative ${className}`}>
        {children}
        
        {/* Accessibility controls */}
        <div className="fixed top-4 left-4 z-50 flex flex-col space-y-2">
          {/* Voice command toggle */}
          <motion.button
            onClick={isVoiceCommandActive ? stopVoiceCommand : startVoiceCommand}
            className={`
              p-2 rounded-full text-white transition-colors
              ${isVoiceCommandActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}
              ${settings.focusIndicatorSize === 'large' ? 'ring-4' : settings.focusIndicatorSize === 'extra-large' ? 'ring-8' : 'ring-2'}
              focus:ring-blue-300 focus:outline-none
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={isVoiceCommandActive ? 'Stop voice commands' : 'Start voice commands'}
          >
            {isVoiceCommandActive ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </motion.button>

          {/* Gesture alternatives toggle */}
          <motion.button
            onClick={() => setShowGestureAlternatives(!showGestureAlternatives)}
            className={`
              p-2 rounded-full text-white transition-colors
              ${showGestureAlternatives ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'}
              ${settings.focusIndicatorSize === 'large' ? 'ring-4' : settings.focusIndicatorSize === 'extra-large' ? 'ring-8' : 'ring-2'}
              focus:ring-blue-300 focus:outline-none
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={showGestureAlternatives ? 'Hide gesture alternatives' : 'Show gesture alternatives'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </motion.button>
        </div>

        {/* Voice command status */}
        <AnimatePresence>
          {isVoiceCommandActive && (
            <motion.div
              className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span>Listening...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gesture alternatives panel */}
        <AnimatePresence>
          {showGestureAlternatives && (
            <motion.div
              className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 p-4 w-80"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Gesture Alternatives</h3>
                <button
                  onClick={() => setShowGestureAlternatives(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close gesture alternatives"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {Array.from(gestureAlternatives.entries()).map(([gesture, { action, description }]) => (
                  <div key={gesture} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{gesture}</div>
                        <div className="text-sm text-gray-600">{description}</div>
                      </div>
                      <button
                        onClick={action}
                        className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
                        aria-label={`Execute ${gesture}`}
                      >
                        Execute
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Keyboard Shortcuts</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Alt + 1-5: Navigate between sections</div>
                  <div>Ctrl + K: Toggle voice commands</div>
                  <div>Ctrl + G: Toggle this panel</div>
                  <div>F5: Refresh page</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip to main content link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-1/2 focus:transform focus:-translate-x-1/2 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:font-medium"
        >
          Skip to main content
        </a>
      </div>
    </GestureAccessibilityContext.Provider>
  );
};

export default GestureAccessibilityProvider;