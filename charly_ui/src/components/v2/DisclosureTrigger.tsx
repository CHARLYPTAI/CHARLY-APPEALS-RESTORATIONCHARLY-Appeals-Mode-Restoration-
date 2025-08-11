// charly_ui/src/components/v2/DisclosureTrigger.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface DisclosureTriggerProps {
  isOpen: boolean;
  onToggle: () => void;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  variant?: 'subtle' | 'prominent' | 'minimal';
  disabled?: boolean;
  className?: string;
}

export const DisclosureTrigger: React.FC<DisclosureTriggerProps> = ({
  isOpen,
  onToggle,
  label,
  sublabel,
  icon,
  variant = 'subtle',
  disabled = false,
  className = '',
}) => {
  const variants = {
    subtle: 'hover:bg-gray-50 border border-gray-200/50',
    prominent: 'hover:bg-primary-50 border border-primary-200/50 hover:border-primary-300',
    minimal: 'hover:bg-gray-50 border-none',
  };

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'w-full p-4 rounded-apple-lg transition-all duration-300 ease-in-out',
        'flex items-center justify-between text-left',
        'focus:outline-none focus:shadow-md',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
    >
      <div className="flex items-center space-x-3">
        {icon && (
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
            {icon}
          </div>
        )}
        <div>
          <p className="text-base font-medium text-gray-900">{label}</p>
          {sublabel && <p className="text-sm text-gray-600">{sublabel}</p>}
        </div>
      </div>
      <div className={cn('transition-transform duration-300', isOpen ? 'rotate-180' : 'rotate-0')}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </button>
  );
};

export default DisclosureTrigger;
