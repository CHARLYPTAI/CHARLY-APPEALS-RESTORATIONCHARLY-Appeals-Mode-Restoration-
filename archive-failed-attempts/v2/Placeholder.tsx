/**
 * 🍎 CHARLY 2.0 - PLACEHOLDER COMPONENT
 * 
 * Fallback component for missing components in the registry.
 */

import React from 'react';
import { Card } from './Card';

interface PlaceholderProps {
  componentName?: string;
  composition?: unknown;
  state?: unknown;
  className?: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({
  componentName = 'Unknown Component',
  className
}) => {
  return (
    <Card className={className} padding="lg">
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {componentName}
        </h3>
        <p className="text-gray-600 text-sm">
          This component will be implemented in the adaptive architecture phase.
        </p>
      </div>
    </Card>
  );
};

export default Placeholder;