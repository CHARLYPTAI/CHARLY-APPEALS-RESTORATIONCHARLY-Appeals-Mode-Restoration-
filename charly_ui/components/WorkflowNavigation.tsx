import React, { useEffect, useCallback } from 'react';
import { Briefcase, BarChart, Lightbulb, Gavel, CheckCircle } from 'lucide-react';
import { canvasStore } from '../stores/canvasStore';
import { cn } from '../lib/utils';

type NavigationMode = 'portfolio' | 'analysis' | 'intelligence' | 'appeals' | 'results';

interface NavItem {
  id: NavigationMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'analysis', label: 'Analysis', icon: BarChart },
  { id: 'intelligence', label: 'Intelligence', icon: Lightbulb },
  { id: 'appeals', label: 'Appeals', icon: Gavel },
  { id: 'results', label: 'Results', icon: CheckCircle },
];

export const WorkflowNavigation: React.FC = () => {
  const [activeMode, setActiveMode] = React.useState<NavigationMode>(canvasStore.mode as NavigationMode);
  const [focusedIndex, setFocusedIndex] = React.useState<number>(0);

  useEffect(() => {
    const unsubscribe = canvasStore.subscribe((state) => {
      setActiveMode(state.mode as NavigationMode);
    });
    return unsubscribe;
  }, []);

  const handleTabChange = useCallback((mode: NavigationMode) => {
    canvasStore.setMode(mode);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentIndex = navItems.findIndex(item => item.id === activeMode);
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : navItems.length - 1;
        setFocusedIndex(prevIndex);
        handleTabChange(navItems[prevIndex].id);
        break;
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = currentIndex < navItems.length - 1 ? currentIndex + 1 : 0;
        setFocusedIndex(nextIndex);
        handleTabChange(navItems[nextIndex].id);
        break;
      case 'Enter':
        e.preventDefault();
        handleTabChange(navItems[focusedIndex].id);
        break;
    }
  }, [activeMode, focusedIndex, handleTabChange]);

  return (
    <div 
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-float-in"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <nav className="flex items-center gap-1 p-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeMode === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              onFocus={() => setFocusedIndex(index)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ease-in-out",
                "hover:bg-gray-100/80 dark:hover:bg-gray-800/80",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                isActive && "bg-blue-500 text-white hover:bg-blue-600 dark:hover:bg-blue-600"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 transition-transform duration-300",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "transition-all duration-300",
                isActive ? "opacity-100" : "opacity-80"
              )}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-white/10 animate-pulse-subtle" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// Animation keyframes (add to global CSS or Tailwind config)
// @keyframes float-in {
//   from {
//     opacity: 0;
//     transform: translate(-50%, -10px);
//   }
//   to {
//     opacity: 1;
//     transform: translate(-50%, 0);
//   }
// }
// 
// @keyframes pulse-subtle {
//   0%, 100% {
//     opacity: 0.1;
//   }
//   50% {
//     opacity: 0.2;
//   }
// }