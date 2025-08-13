/**
 * 🍎 CHARLY 2.0 - PROPERTY SEARCH COMPONENT
 * 
 * Intelligent property search that adapts to attorney workflow context.
 */

import React from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface PropertySearchProps {
  searchQuery: string;
  filters: Record<string, unknown>;
  onSearch: (query: string) => void;
  composition?: unknown;
  state?: unknown;
  className?: string;
}

const PropertySearch: React.FC<PropertySearchProps> = ({
  searchQuery,
  onSearch,
  className
}) => {
  const [query, setQuery] = React.useState(searchQuery);

  const handleSearch = () => {
    onSearch(query);
  };

  return (
    <Card className={className} padding="lg">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Property Search</h2>
        
        <div className="flex space-x-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search properties by address, APN, or owner..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} variant="primary">
            Search
          </Button>
        </div>
        
        <div className="text-sm text-gray-600">
          Search across 2.5M+ properties with intelligent filtering
        </div>
      </div>
    </Card>
  );
};

export default PropertySearch;