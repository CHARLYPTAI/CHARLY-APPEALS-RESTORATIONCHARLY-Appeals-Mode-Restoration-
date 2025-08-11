/**
 * CHARLY 2.0 - Mobile Accessibility Features
 * Comprehensive accessibility utilities for mobile interfaces
 */

import React from 'react';

interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  voiceOverEnabled: boolean;
  screenReaderEnabled: boolean;
  colorBlindnessMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  focusIndicators: boolean;
  soundEnabled: boolean;
  hapticFeedback: boolean;
}

interface GestureDescription {
  action: string;
  gesture: string;
  description: string;
}

class MobileAccessibilityManager {
  private settings: AccessibilitySettings;
  private announcements: string[] = [];
  private focusHistory: HTMLElement[] = [];
  private currentAnnouncement: string | null = null;

  constructor() {
    this.settings = this.detectAccessibilitySettings();
    this.setupAccessibilityFeatures();
    this.setupKeyboardNavigation();
  }

  private detectAccessibilitySettings(): AccessibilitySettings {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const prefersLargeText = window.matchMedia('(prefers-reduced-data: reduce)').matches;
    
    // Detect screen readers (simplified detection)
    const hasScreenReader = !!(
      (navigator as unknown as { userAgent: string }).userAgent.match(/\b(JAWS|NVDA|SAPI|Dragon|ZoomText|Magic|SuperNova|System Access|Window-Eyes|ReadPlease|Hal|Kurzweil|Supernova|Thunder|MAGic|ZoomText)\b/i) ||
      window.speechSynthesis ||
      (window as unknown as { speechSynthesis?: SpeechSynthesis }).speechSynthesis
    );

    return {
      reduceMotion: prefersReducedMotion,
      highContrast: prefersHighContrast,
      largeText: prefersLargeText,
      voiceOverEnabled: hasScreenReader,
      screenReaderEnabled: hasScreenReader,
      colorBlindnessMode: 'none',
      focusIndicators: true,
      soundEnabled: true,
      hapticFeedback: 'vibrate' in navigator
    };
  }

  private setupAccessibilityFeatures(): void {
    // Apply accessibility CSS classes
    this.applyAccessibilityStyles();
    
    // Setup screen reader announcements
    this.setupScreenReaderSupport();
    
    // Setup focus management
    this.setupFocusManagement();
    
    // Setup gesture descriptions
    this.setupGestureDescriptions();
  }

  private applyAccessibilityStyles(): void {
    const root = document.documentElement;
    
    if (this.settings.reduceMotion) {
      root.classList.add('reduce-motion');
    }
    
    if (this.settings.highContrast) {
      root.classList.add('high-contrast');
    }
    
    if (this.settings.largeText) {
      root.classList.add('large-text');
    }
    
    if (this.settings.colorBlindnessMode !== 'none') {
      root.classList.add(`colorblind-${this.settings.colorBlindnessMode}`);
    }

    // Add custom CSS for accessibility
    this.addAccessibilityCSS();
  }

  private addAccessibilityCSS(): void {
    const style = document.createElement('style');
    style.id = 'mobile-accessibility-styles';
    style.textContent = `
      /* Reduced motion */
      .reduce-motion *,
      .reduce-motion *::before,
      .reduce-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }

      /* High contrast mode */
      .high-contrast {
        filter: contrast(1.5);
      }
      
      .high-contrast button {
        border: 2px solid currentColor !important;
      }
      
      .high-contrast .bg-gray-100 {
        background-color: #000 !important;
        color: #fff !important;
      }

      /* Large text */
      .large-text {
        font-size: 1.25em;
        line-height: 1.6;
      }
      
      .large-text button {
        min-height: 44px;
        min-width: 44px;
        padding: 12px 16px;
      }

      /* Focus indicators */
      .focus-visible {
        outline: 3px solid #0066cc !important;
        outline-offset: 2px !important;
      }
      
      .touch-target {
        min-height: 44px;
        min-width: 44px;
      }

      /* Color blindness support */
      .colorblind-protanopia {
        filter: 
          url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><defs><filter id="protanopia"><feColorMatrix in="SourceGraphic" type="matrix" values="0.567, 0.433, 0, 0, 0 0.558, 0.442, 0, 0, 0 0, 0.242, 0.758, 0, 0 0, 0, 0, 1, 0"/></filter></defs></svg>#protanopia');
      }
      
      .colorblind-deuteranopia {
        filter: 
          url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><defs><filter id="deuteranopia"><feColorMatrix in="SourceGraphic" type="matrix" values="0.625, 0.375, 0, 0, 0 0.7, 0.3, 0, 0, 0 0, 0.3, 0.7, 0, 0 0, 0, 0, 1, 0"/></filter></defs></svg>#deuteranopia');
      }
      
      .colorblind-tritanopia {
        filter: 
          url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><defs><filter id="tritanopia"><feColorMatrix in="SourceGraphic" type="matrix" values="0.95, 0.05, 0, 0, 0 0, 0.433, 0.567, 0, 0 0, 0.475, 0.525, 0, 0 0, 0, 0, 1, 0"/></filter></defs></svg>#tritanopia');
      }

      /* Screen reader only content */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      .sr-only-focusable:active,
      .sr-only-focusable:focus {
        position: static;
        width: auto;
        height: auto;
        overflow: visible;
        clip: auto;
        white-space: normal;
      }

      /* Skip links */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        z-index: 9999;
      }
      
      .skip-link:focus {
        top: 6px;
      }
    `;
    
    if (document.getElementById('mobile-accessibility-styles')) {
      document.getElementById('mobile-accessibility-styles')?.remove();
    }
    
    document.head.appendChild(style);
  }

  private setupScreenReaderSupport(): void {
    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'live-region';
    document.body.appendChild(liveRegion);

    // Create assertive live region for important announcements
    const assertiveLiveRegion = document.createElement('div');
    assertiveLiveRegion.setAttribute('aria-live', 'assertive');
    assertiveLiveRegion.setAttribute('aria-atomic', 'true');
    assertiveLiveRegion.className = 'sr-only';
    assertiveLiveRegion.id = 'assertive-live-region';
    document.body.appendChild(assertiveLiveRegion);
  }

  private setupFocusManagement(): void {
    // Track focus history
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target && target !== document.body) {
        this.focusHistory.push(target);
        // Keep only last 10 focused elements
        if (this.focusHistory.length > 10) {
          this.focusHistory.shift();
        }
      }
    });

    // Add focus-visible polyfill behavior
    document.addEventListener('keydown', () => {
      document.body.classList.add('using-keyboard');
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('using-keyboard');
    });
  }

  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (event) => {
      // Handle escape key to close modals/overlays
      if (event.key === 'Escape') {
        this.handleEscapeKey();
      }
      
      // Handle tab navigation improvements
      if (event.key === 'Tab') {
        this.handleTabNavigation(event);
      }
      
      // Handle arrow key navigation for custom components
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        this.handleArrowNavigation(event);
      }
    });
  }

  private setupGestureDescriptions(): void {
    const gestureDescriptions: GestureDescription[] = [
      { action: 'Navigate', gesture: 'Swipe left/right', description: 'Swipe left or right to navigate between pages' },
      { action: 'Open menu', gesture: 'Swipe up', description: 'Swipe up from bottom to open navigation menu' },
      { action: 'Refresh', gesture: 'Pull down', description: 'Pull down from top to refresh content' },
      { action: 'Go back', gesture: 'Swipe right', description: 'Swipe right to go back to previous page' },
      { action: 'Open options', gesture: 'Long press', description: 'Long press on items to see more options' },
      { action: 'Zoom', gesture: 'Pinch', description: 'Pinch to zoom in or out on content' }
    ];

    // Store gesture descriptions for screen readers
    (window as unknown as { charlyGestureDescriptions: GestureDescription[] }).charlyGestureDescriptions = gestureDescriptions;
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const regionId = priority === 'assertive' ? 'assertive-live-region' : 'live-region';
    const liveRegion = document.getElementById(regionId);
    
    if (liveRegion) {
      // Clear previous announcement
      liveRegion.textContent = '';
      
      // Add slight delay to ensure screen readers notice the change
      setTimeout(() => {
        liveRegion.textContent = message;
        this.currentAnnouncement = message;
        
        // Clear after announcement is likely read
        setTimeout(() => {
          liveRegion.textContent = '';
          this.currentAnnouncement = null;
        }, 5000);
      }, 100);
    }

    // Also use speech synthesis if available
    if (this.settings.soundEnabled && 'speechSynthesis' in window) {
      this.speak(message);
    }
  }

  public speak(text: string): void {
    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    // Try to use a more natural voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && voice.name.includes('Enhanced')
    ) || voices.find(voice => voice.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    speechSynthesis.speak(utterance);
  }

  public setFocus(element: HTMLElement, announceChange: boolean = true): void {
    if (!element) return;

    element.focus();
    
    if (announceChange) {
      const label = this.getElementLabel(element);
      if (label) {
        this.announce(`Focused on ${label}`);
      }
    }
  }

  public moveFocusToFirst(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      this.setFocus(focusableElements[0]);
    }
  }

  public moveFocusToLast(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      this.setFocus(focusableElements[focusableElements.length - 1]);
    }
  }

  public trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }

  private getElementLabel(element: HTMLElement): string {
    // Try different methods to get element label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement) return labelElement.textContent || '';
    }

    const label = element.closest('label');
    if (label) return label.textContent || '';

    return element.textContent || element.tagName;
  }

  private handleEscapeKey(): void {
    // Find and close the topmost modal or overlay
    const modals = document.querySelectorAll('[role="dialog"], .modal, .overlay');
    const topModal = modals[modals.length - 1] as HTMLElement;
    
    if (topModal) {
      // Try to find close button
      const closeButton = topModal.querySelector('[aria-label*="close"], .close-button, .modal-close') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      } else {
        // Hide modal directly
        topModal.style.display = 'none';
        topModal.setAttribute('aria-hidden', 'true');
      }
    }
  }

  private handleTabNavigation(event: KeyboardEvent): void {
    // Improve tab navigation for complex components
    const activeElement = document.activeElement as HTMLElement;
    
    if (activeElement && activeElement.getAttribute('role') === 'tablist') {
      event.preventDefault();
      // Handle tab navigation within tab lists
      this.handleTabListNavigation(event, activeElement);
    }
  }

  private handleArrowNavigation(event: KeyboardEvent): void {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) return;

    const role = activeElement.getAttribute('role');
    
    switch (role) {
      case 'tab':
        this.handleTabListNavigation(event, activeElement);
        break;
      case 'menuitem':
        this.handleMenuNavigation(event, activeElement);
        break;
      case 'option':
        this.handleListboxNavigation(event, activeElement);
        break;
    }
  }

  private handleTabListNavigation(event: KeyboardEvent, element: HTMLElement): void {
    const tabList = element.closest('[role="tablist"]') as HTMLElement;
    if (!tabList) return;

    const tabs = Array.from(tabList.querySelectorAll('[role="tab"]')) as HTMLElement[];
    const currentIndex = tabs.indexOf(element);

    let nextIndex: number;
    
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
    } else {
      return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (nextTab) {
      nextTab.focus();
      nextTab.click(); // Activate the tab
    }
  }

  private handleMenuNavigation(event: KeyboardEvent, element: HTMLElement): void {
    const menu = element.closest('[role="menu"]') as HTMLElement;
    if (!menu) return;

    const items = Array.from(menu.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
    const currentIndex = items.indexOf(element);

    let nextIndex: number;
    
    if (event.key === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    } else if (event.key === 'ArrowDown') {
      nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    } else {
      return;
    }

    event.preventDefault();
    const nextItem = items[nextIndex];
    if (nextItem) {
      nextItem.focus();
    }
  }

  private handleListboxNavigation(event: KeyboardEvent, element: HTMLElement): void {
    const listbox = element.closest('[role="listbox"]') as HTMLElement;
    if (!listbox) return;

    const options = Array.from(listbox.querySelectorAll('[role="option"]')) as HTMLElement[];
    const currentIndex = options.indexOf(element);

    let nextIndex: number;
    
    if (event.key === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
    } else if (event.key === 'ArrowDown') {
      nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
    } else {
      return;
    }

    event.preventDefault();
    const nextOption = options[nextIndex];
    if (nextOption) {
      nextOption.focus();
      // Update selection
      options.forEach(option => option.setAttribute('aria-selected', 'false'));
      nextOption.setAttribute('aria-selected', 'true');
    }
  }

  public getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.applyAccessibilityStyles();
  }
}

// React hooks for accessibility
export const useAccessibility = () => {
  const [manager] = React.useState(() => new MobileAccessibilityManager());
  const [settings, setSettings] = React.useState(manager.getSettings());

  const updateSettings = React.useCallback((newSettings: Partial<AccessibilitySettings>) => {
    manager.updateSettings(newSettings);
    setSettings(manager.getSettings());
  }, [manager]);

  return {
    settings,
    updateSettings,
    announce: manager.announce.bind(manager),
    speak: manager.speak.bind(manager),
    setFocus: manager.setFocus.bind(manager),
    trapFocus: manager.trapFocus.bind(manager),
    moveFocusToFirst: manager.moveFocusToFirst.bind(manager),
    moveFocusToLast: manager.moveFocusToLast.bind(manager)
  };
};

// Announcement hook
export const useAnnouncement = () => {
  const { announce } = useAccessibility();
  
  return React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announce(message, priority);
  }, [announce]);
};

// Focus management hook
export const useFocusManagement = (containerRef: React.RefObject<HTMLElement>) => {
  const { trapFocus, moveFocusToFirst, moveFocusToLast } = useAccessibility();
  
  const trapFocusInContainer = React.useCallback(() => {
    if (containerRef.current) {
      return trapFocus(containerRef.current);
    }
    return () => {};
  }, [containerRef, trapFocus]);

  const focusFirst = React.useCallback(() => {
    if (containerRef.current) {
      moveFocusToFirst(containerRef.current);
    }
  }, [containerRef, moveFocusToFirst]);

  const focusLast = React.useCallback(() => {
    if (containerRef.current) {
      moveFocusToLast(containerRef.current);
    }
  }, [containerRef, moveFocusToLast]);

  return {
    trapFocus: trapFocusInContainer,
    focusFirst,
    focusLast
  };
};

export default MobileAccessibilityManager;