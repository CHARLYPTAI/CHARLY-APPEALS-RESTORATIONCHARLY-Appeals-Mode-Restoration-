/**
 * CHARLY 2.0 - Gesture Navigation Provider
 * Swipe-to-navigate between portfolio sections with Apple-quality animations
 * Task 21: Revolutionary Gesture-Based Navigation
 */

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RevolutionaryGestureEngine } from './RevolutionaryGestureEngine';
import { motion, AnimatePresence } from 'framer-motion';

// Navigation routes with gesture support
const NAVIGATION_ROUTES = [
  { path: '/', name: 'Dashboard', gesture: 'dashboard' },
  { path: '/portfolio', name: 'Portfolio', gesture: 'portfolio' },
  { path: '/appeals', name: 'Appeals', gesture: 'appeals' },
  { path: '/analysis', name: 'Analysis', gesture: 'analysis' },
  { path: '/filing', name: 'Filing', gesture: 'filing' },
  { path: '/reports', name: 'Reports', gesture: 'reports' },
  { path: '/analytics', name: 'Analytics', gesture: 'analytics' },
  { path: '/settings', name: 'Settings', gesture: 'settings' }
];

type GestureDirection = 'left' | 'right' | 'up' | 'down';

interface NavigationState {
  currentIndex: number;
  isNavigating: boolean;
  direction: GestureDirection | null;
  previousRoute: string | null;
  nextRoute: string | null;
}

interface GestureNavigationContextType {
  navigationState: NavigationState;
  navigate: (direction: GestureDirection) => void;
  goToRoute: (path: string) => void;
  enableGestureNavigation: boolean;
  setEnableGestureNavigation: (enabled: boolean) => void;
}

const GestureNavigationContext = createContext<GestureNavigationContextType | null>(null);

export const useGestureNavigation = () => {
  const context = useContext(GestureNavigationContext);
  if (!context) {
    throw new Error('useGestureNavigation must be used within a GestureNavigationProvider');
  }
  return context;
};

interface GestureNavigationProviderProps {
  children: React.ReactNode;
  enableGestureNavigation?: boolean;
  swipeThreshold?: number;
  velocityThreshold?: number;
}

export const GestureNavigationProvider: React.FC<GestureNavigationProviderProps> = ({
  children,
  enableGestureNavigation = true,
  swipeThreshold = 50,
  velocityThreshold = 0.3
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentIndex: 0,
    isNavigating: false,
    direction: null,
    previousRoute: null,
    nextRoute: null
  });
  
  const [enableGestures, setEnableGestures] = useState(enableGestureNavigation);
  const [transitionDirection, setTransitionDirection] = useState<GestureDirection | null>(null);

  // Update current index based on current route
  useEffect(() => {
    const currentIndex = NAVIGATION_ROUTES.findIndex(route => route.path === location.pathname);
    if (currentIndex !== -1) {
      setNavigationState(prev => ({
        ...prev,
        currentIndex,
        previousRoute: currentIndex > 0 ? NAVIGATION_ROUTES[currentIndex - 1].path : null,
        nextRoute: currentIndex < NAVIGATION_ROUTES.length - 1 ? NAVIGATION_ROUTES[currentIndex + 1].path : null
      }));
    }
  }, [location.pathname]);

  // Handle swipe navigation
  const handleSwipeNavigation = useCallback((direction: GestureDirection, velocity: number) => {
    if (!enableGestures || velocity < velocityThreshold) return;

    const currentIndex = navigationState.currentIndex;
    let targetIndex = currentIndex;

    // Determine target route based on swipe direction
    switch (direction) {
      case 'left':
        // Swipe left -> go to next route
        targetIndex = Math.min(currentIndex + 1, NAVIGATION_ROUTES.length - 1);
        break;
      case 'right':
        // Swipe right -> go to previous route
        targetIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'up':
        // Swipe up -> go to analytics/reports
        targetIndex = NAVIGATION_ROUTES.findIndex(route => route.gesture === 'analytics');
        break;
      case 'down':
        // Swipe down -> go to dashboard
        targetIndex = 0;
        break;
    }

    // Navigate if target is different from current
    if (targetIndex !== currentIndex && targetIndex >= 0 && targetIndex < NAVIGATION_ROUTES.length) {
      setNavigationState(prev => ({
        ...prev,
        isNavigating: true,
        direction
      }));
      
      setTransitionDirection(direction);
      
      // Animate to new route
      setTimeout(() => {
        navigate(NAVIGATION_ROUTES[targetIndex].path);
        
        // Reset navigation state after animation
        setTimeout(() => {
          setNavigationState(prev => ({
            ...prev,
            isNavigating: false,
            direction: null
          }));
          setTransitionDirection(null);
        }, 300);
      }, 100);
    }
  }, [enableGestures, navigate, navigationState.currentIndex, velocityThreshold]);

  // Navigate to specific route
  const goToRoute = useCallback((path: string) => {
    const targetIndex = NAVIGATION_ROUTES.findIndex(route => route.path === path);
    if (targetIndex !== -1) {
      const currentIndex = navigationState.currentIndex;
      const direction: GestureDirection = targetIndex > currentIndex ? 'left' : 'right';
      
      setNavigationState(prev => ({
        ...prev,
        isNavigating: true,
        direction
      }));
      
      setTransitionDirection(direction);
      navigate(path);
      
      setTimeout(() => {
        setNavigationState(prev => ({
          ...prev,
          isNavigating: false,
          direction: null
        }));
        setTransitionDirection(null);
      }, 300);
    }
  }, [navigate, navigationState.currentIndex]);

  // Context value
  const contextValue: GestureNavigationContextType = {
    navigationState,
    navigate: handleSwipeNavigation,
    goToRoute,
    enableGestureNavigation: enableGestures,
    setEnableGestureNavigation: setEnableGestures
  };

  // Page transition variants
  const pageVariants = {
    initial: (direction: GestureDirection) => ({
      x: direction === 'left' ? '100%' : direction === 'right' ? '-100%' : 0,
      y: direction === 'up' ? '100%' : direction === 'down' ? '-100%' : 0,
      opacity: 0.8,
      scale: 0.95
    }),
    animate: {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 400,
        mass: 0.8
      }
    },
    exit: (direction: GestureDirection) => ({
      x: direction === 'left' ? '-100%' : direction === 'right' ? '100%' : 0,
      y: direction === 'up' ? '-100%' : direction === 'down' ? '100%' : 0,
      opacity: 0.8,
      scale: 0.95,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 400,
        mass: 0.8
      }
    })
  };

  return (
    <GestureNavigationContext.Provider value={contextValue}>
      <RevolutionaryGestureEngine
        onSwipe={handleSwipeNavigation}
        gestureThreshold={swipeThreshold}
        velocityThreshold={velocityThreshold}
        enableHaptics={true}
        className="h-full w-full"
      >
        <AnimatePresence mode="wait" custom={transitionDirection}>
          <motion.div
            key={location.pathname}
            custom={transitionDirection}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-full w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* Navigation breadcrumbs */}
        {navigationState.isNavigating && (
          <motion.div
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-full text-sm font-medium">
              {NAVIGATION_ROUTES[navigationState.currentIndex]?.name}
            </div>
          </motion.div>
        )}

        {/* Gesture guide overlay */}
        {enableGestures && !navigationState.isNavigating && (
          <motion.div
            className="fixed bottom-4 right-4 z-40 pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="bg-blue-500 text-white p-2 rounded-lg text-xs">
              <div className="flex items-center space-x-1">
                <span>👆</span>
                <span>Swipe to navigate</span>
              </div>
            </div>
          </motion.div>
        )}
      </RevolutionaryGestureEngine>
    </GestureNavigationContext.Provider>
  );
};

export default GestureNavigationProvider;