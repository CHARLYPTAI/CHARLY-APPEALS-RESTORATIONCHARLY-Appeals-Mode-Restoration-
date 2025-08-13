/**
 * CHARLY 2.0 - Long Press Context Menu
 * Apple-quality contextual menus triggered by long press gestures
 * Task 21: Revolutionary Gesture-Based Navigation
 */

import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { RevolutionaryGestureEngine } from './RevolutionaryGestureEngine';

interface MenuAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  disabled?: boolean;
  onAction: () => void;
}

interface ContextMenuState {
  isVisible: boolean;
  position: { x: number; y: number };
  actions: MenuAction[];
  targetElement: HTMLElement | null;
  showPreview: boolean;
}

interface LongPressContextMenuContextType {
  menuState: ContextMenuState;
  showMenu: (position: { x: number; y: number }, actions: MenuAction[], targetElement?: HTMLElement) => void;
  hideMenu: () => void;
  isMenuVisible: boolean;
  registerContextActions: (actions: MenuAction[]) => void;
  unregisterContextActions: () => void;
}

const LongPressContextMenuContext = createContext<LongPressContextMenuContextType | null>(null);

export const useLongPressContextMenu = () => {
  const context = useContext(LongPressContextMenuContext);
  if (!context) {
    throw new Error('useLongPressContextMenu must be used within a LongPressContextMenuProvider');
  }
  return context;
};

interface LongPressContextMenuProviderProps {
  children: React.ReactNode;
  longPressDelay?: number;
  enableHapticFeedback?: boolean;
  showPreview?: boolean;
  className?: string;
}

export const LongPressContextMenuProvider: React.FC<LongPressContextMenuProviderProps> = ({
  children,
  longPressDelay = 500,
  enableHapticFeedback = true,
  showPreview = true,
  className = ''
}) => {
  const [menuState, setMenuState] = useState<ContextMenuState>({
    isVisible: false,
    position: { x: 0, y: 0 },
    actions: [],
    targetElement: null,
    showPreview
  });

  const [registeredActions, setRegisteredActions] = useState<MenuAction[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout>();

  // Motion values for smooth animations
  const menuScale = useMotionValue(0);
  const menuOpacity = useMotionValue(0);
  const springScale = useSpring(menuScale, { damping: 20, stiffness: 300 });
  const springOpacity = useSpring(menuOpacity, { damping: 20, stiffness: 300 });

  // Show context menu
  const showMenu = useCallback((
    position: { x: number; y: number },
    actions: MenuAction[],
    targetElement?: HTMLElement
  ) => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    
    // Adjust position to keep menu within bounds
    const adjustedPosition = {
      x: Math.min(Math.max(position.x, 50), containerRect.width - 200),
      y: Math.min(Math.max(position.y, 50), containerRect.height - 300)
    };

    setMenuState({
      isVisible: true,
      position: adjustedPosition,
      actions,
      targetElement: targetElement || null,
      showPreview
    });

    // Animate menu appearance
    menuScale.set(1);
    menuOpacity.set(1);

    // Haptic feedback
    if (enableHapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate([20, 10, 20]);
    }
  }, [showPreview, enableHapticFeedback, menuScale, menuOpacity]);

  // Hide context menu
  const hideMenu = useCallback(() => {
    menuScale.set(0);
    menuOpacity.set(0);

    setTimeout(() => {
      setMenuState(prev => ({
        ...prev,
        isVisible: false,
        actions: [],
        targetElement: null
      }));
    }, 200);

    // Clear preview timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
  }, [menuScale, menuOpacity]);

  // Register context actions for automatic menu generation
  const registerContextActions = useCallback((actions: MenuAction[]) => {
    setRegisteredActions(actions);
  }, []);

  // Unregister context actions
  const unregisterContextActions = useCallback(() => {
    setRegisteredActions([]);
  }, []);

  // Handle long press gesture
  const handleLongPress = useCallback((point: { x: number; y: number }) => {
    if (registeredActions.length > 0) {
      const element = document.elementFromPoint(point.x, point.y) as HTMLElement;
      showMenu(point, registeredActions, element);
    }
  }, [registeredActions, showMenu]);

  // Handle click outside to hide menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuState.isVisible && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        hideMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuState.isVisible, hideMenu]);

  // Context value
  const contextValue: LongPressContextMenuContextType = {
    menuState,
    showMenu,
    hideMenu,
    isMenuVisible: menuState.isVisible,
    registerContextActions,
    unregisterContextActions
  };

  // Menu action colors (removed unused function)

  // Context menu component
  const ContextMenu = () => (
    <AnimatePresence>
      {menuState.isVisible && (
        <motion.div
          className="absolute z-50 pointer-events-none"
          style={{
            left: menuState.position.x,
            top: menuState.position.y,
            scale: springScale,
            opacity: springOpacity
          }}
        >
          <motion.div
            className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 overflow-hidden min-w-48 pointer-events-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Menu header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Actions</h3>
                <button
                  onClick={hideMenu}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Menu actions */}
            <div className="py-2">
              {menuState.actions.map((action, index) => (
                <motion.button
                  key={action.id}
                  onClick={() => {
                    action.onAction();
                    hideMenu();
                  }}
                  disabled={action.disabled}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 text-left transition-all duration-200
                    ${action.disabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-gray-50 active:bg-gray-100 cursor-pointer'
                    }
                  `}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: action.disabled ? 1 : 1.02 }}
                  whileTap={{ scale: action.disabled ? 1 : 0.98 }}
                >
                  {action.icon && (
                    <div className="flex-shrink-0 w-5 h-5 text-gray-500">
                      {action.icon}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900 flex-1">
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Menu footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-center text-xs text-gray-500">
                Long press to show menu
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <LongPressContextMenuContext.Provider value={contextValue}>
      <div ref={containerRef} className={`relative ${className}`}>
        <RevolutionaryGestureEngine
          onLongPress={handleLongPress}
          longPressDelay={longPressDelay}
          enableHaptics={enableHapticFeedback}
          className="h-full w-full"
        >
          {children}
        </RevolutionaryGestureEngine>
        
        {/* Context menu overlay */}
        <ContextMenu />
      </div>
    </LongPressContextMenuContext.Provider>
  );
};

export default LongPressContextMenuProvider;