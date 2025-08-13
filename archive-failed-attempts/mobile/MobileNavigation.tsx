/**
 * CHARLY 2.0 - Mobile Navigation System
 * Adaptive navigation with gesture integration and context awareness
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from '../../hooks/useFramerMotionLite';
import { useLocation, useNavigate } from 'react-router-dom';
import { MobileGestureHandler, SwipeGesture } from './MobileGestureHandler';
import { TouchOptimizedButton } from './TouchOptimizedButton';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  priority: 'high' | 'medium' | 'low';
  contextual?: boolean;
  badgeCount?: number;
}

interface MobileNavigationProps {
  className?: string;
  adaptiveMode?: boolean;
  compactMode?: boolean;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  className = '',
  adaptiveMode = true,
  compactMode = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adaptiveItems, setAdaptiveItems] = useState<NavigationItem[]>([]);
  const [recentPaths, setRecentPaths] = useState<string[]>([]);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Core navigation items
  const coreNavItems: NavigationItem[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
      path: '/dashboard',
      priority: 'high'
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      path: '/portfolio',
      priority: 'high'
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      path: '/analysis',
      priority: 'high'
    },
    {
      id: 'appeals',
      label: 'Appeals',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      path: '/appeals',
      priority: 'medium'
    },
    {
      id: 'market',
      label: 'Market',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      path: '/market-intelligence',
      priority: 'medium'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      path: '/analytics',
      priority: 'low',
      contextual: true
    }
  ], []);

  // Update active tab based on current location
  useEffect(() => {
    const currentPath = location.pathname;
    const activeItem = coreNavItems.find(item => currentPath.startsWith(item.path));
    if (activeItem) {
      setActiveTab(activeItem.id);
    }

    // Track recent paths for adaptive navigation
    setRecentPaths(prev => {
      const updated = [currentPath, ...prev.filter(p => p !== currentPath)].slice(0, 5);
      return updated;
    });
  }, [location.pathname, coreNavItems]);

  // Adaptive navigation items based on usage patterns
  useEffect(() => {
    if (!adaptiveMode) return;

    const adaptiveNavItems = coreNavItems.map(item => {
      const recentUsage = recentPaths.filter(path => path.startsWith(item.path)).length;
      const adjustedPriority = recentUsage > 2 ? 'high' : item.priority;
      
      return {
        ...item,
        priority: adjustedPriority
      };
    }).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    setAdaptiveItems(adaptiveNavItems);
  }, [adaptiveMode, recentPaths, coreNavItems]);

  const displayItems = adaptiveMode ? adaptiveItems : coreNavItems;
  const visibleItems = compactMode ? displayItems.slice(0, 4) : displayItems;

  // Handle navigation
  const handleNavigation = useCallback((path: string, itemId: string) => {
    setActiveTab(itemId);
    navigate(path);
    setIsExpanded(false);
  }, [navigate]);

  // Handle swipe gestures
  const handleSwipe = useCallback((gesture: SwipeGesture) => {
    if (gesture.direction === 'up' && gesture.velocity > 800) {
      setIsExpanded(true);
    } else if (gesture.direction === 'down' && gesture.velocity > 800) {
      setIsExpanded(false);
    } else if (gesture.direction === 'left' || gesture.direction === 'right') {
      // Swipe between tabs
      const currentIndex = displayItems.findIndex(item => item.id === activeTab);
      const nextIndex = gesture.direction === 'left' 
        ? (currentIndex + 1) % displayItems.length
        : (currentIndex - 1 + displayItems.length) % displayItems.length;
      
      const nextItem = displayItems[nextIndex];
      if (nextItem) {
        handleNavigation(nextItem.path, nextItem.id);
      }
    }
  }, [activeTab, displayItems, handleNavigation]);

  return (
    <MobileGestureHandler onSwipe={handleSwipe} className={className}>
      <motion.div className="relative">
        {/* Main Navigation Bar */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-padding-bottom"
          initial="slideOutDown"
          animate="slideInUp"
        >
          {/* Navigation Items */}
          <div className="flex items-center justify-around px-2 py-1">
            {visibleItems.map((item) => {
              const isActive = activeTab === item.id;
              
              return (
                <TouchOptimizedButton
                  key={item.id}
                  onClick={() => handleNavigation(item.path, item.id)}
                  className={`flex-1 flex flex-col items-center py-2 px-1 relative ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}
                  hapticFeedback={true}
                >
                  {/* Badge */}
                  {item.badgeCount && item.badgeCount > 0 && (
                    <motion.div
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      initial="scaleOut"
                      animate="scaleIn"
                    >
                      {item.badgeCount > 99 ? '99+' : item.badgeCount}
                    </motion.div>
                  )}
                  
                  {/* Icon */}
                  <motion.div
                    animate={isActive ? "scaleIn" : "scaleOut"}
                  >
                    {item.icon}
                  </motion.div>
                  
                  {/* Label */}
                  <motion.span
                    className="text-xs mt-1 font-medium"
                    animate={isActive ? "fadeIn" : "fadeOut"}
                  >
                    {item.label}
                  </motion.span>
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute top-0 left-1/2 w-1 h-1 bg-blue-600 rounded-full"
                      animate="scaleIn"
                    />
                  )}
                </TouchOptimizedButton>
              );
            })}
            
            {/* More Button (if compact mode) */}
            {compactMode && displayItems.length > 4 && (
              <TouchOptimizedButton
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex-1 flex flex-col items-center py-2 px-1 text-gray-500"
                hapticFeedback={true}
              >
                <motion.div
                  animate={isExpanded ? "scaleIn" : "scaleOut"}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </motion.div>
                <span className="text-xs mt-1 font-medium">More</span>
              </TouchOptimizedButton>
            )}
          </div>
          
          {/* Swipe Indicator */}
          <motion.div
            className="h-1 bg-gray-200 mx-8 rounded-full overflow-hidden"
            initial="scaleOut"
            animate="scaleIn"
          >
            <motion.div
              className="h-full bg-blue-600 rounded-full"
              animate="scaleIn"
            />
          </motion.div>
        </motion.div>

        {/* Expanded Navigation */}
        {isExpanded && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial="fadeOut"
            animate="fadeIn"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-6 safe-area-padding-bottom"
              initial="slideOutDown"
              animate="slideInUp"
              onClick={(e) => e.stopPropagation()}
            >
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
                
                <h3 className="text-lg font-semibold mb-4">Quick Navigation</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  {displayItems.map((item) => (
                    <TouchOptimizedButton
                      key={item.id}
                      onClick={() => handleNavigation(item.path, item.id)}
                      className={`flex flex-col items-center p-4 rounded-xl border-2 ${
                        activeTab === item.id
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-200 text-gray-700'
                      }`}
                      hapticFeedback={true}
                    >
                      <div className="mb-2">{item.icon}</div>
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.priority === 'high' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1" />
                      )}
                    </TouchOptimizedButton>
                  ))}
                </div>
                
                {/* Recent Paths */}
                {recentPaths.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-600 mb-3">Recent</h4>
                    <div className="flex flex-wrap gap-2">
                      {recentPaths.slice(0, 3).map((path, index) => {
                        const item = displayItems.find(item => path.startsWith(item.path));
                        if (!item) return null;
                        
                        return (
                          <TouchOptimizedButton
                            key={`recent-${index}`}
                            onClick={() => handleNavigation(path, item.id)}
                            className="flex items-center px-3 py-2 bg-gray-100 rounded-lg"
                            hapticFeedback={true}
                          >
                            <div className="w-4 h-4 mr-2">{item.icon}</div>
                            <span className="text-sm">{item.label}</span>
                          </TouchOptimizedButton>
                        );
                      })}
                    </div>
                  </div>
                )}
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </MobileGestureHandler>
  );
};

export default MobileNavigation;