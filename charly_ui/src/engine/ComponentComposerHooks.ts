import React, { useMemo } from 'react';
import { contextEngine } from './ContextEngine';
import { adaptiveState } from './AdaptiveState';
import type { InterfaceComposition, AdaptiveState } from './AdaptiveState';

// ============================================================================
// COMPONENT COMPOSER HOOKS
// ============================================================================

export function useAdaptiveComposition() {
  const [composition, setComposition] = React.useState<InterfaceComposition | null>(null);
  
  React.useEffect(() => {
    const unsubscribe = contextEngine.subscribe(() => {
      setComposition(contextEngine.getInterfaceComposition());
    });
    
    setComposition(contextEngine.getInterfaceComposition());
    
    return unsubscribe;
  }, []);
  
  return composition;
}

export function useAdaptiveState() {
  const [state, setState] = React.useState<AdaptiveState | null>(null);
  
  React.useEffect(() => {
    const unsubscribe = adaptiveState.subscribe(setState);
    setState(adaptiveState.getState());
    
    return unsubscribe;
  }, []);
  
  return state;
}

export function useContextualComponent(componentName: string) {
  const composition = useAdaptiveComposition();
  const state = useAdaptiveState();
  
  const isVisible = useMemo(() => {
    if (!composition) return false;
    
    return composition.primaryComponents.includes(componentName) ||
           composition.secondaryComponents.includes(componentName);
  }, [composition, componentName]);
  
  const props = useMemo(() => {
    if (!composition || !state) return {};
    
    return {
      composition,
      state,
      isVisible
    };
  }, [composition, state, isVisible]);
  
  return {
    isVisible,
    props
  };
}