/**
 * JurisdictionDropdown Component
 * 
 * Unified jurisdiction dropdown component that replaces all hardcoded jurisdiction lists
 * across the CHARLY platform. Provides consistent jurisdiction selection with enterprise data.
 */

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  getAllJurisdictions, 
  getSimplifiedJurisdictionOptions,
  getVerifiedJurisdictions,
  getJurisdictionsByState 
} from '../services/jurisdictionService';

interface JurisdictionDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  simplified?: boolean;
  verifiedOnly?: boolean;
  stateFilter?: string;
  includeAll?: boolean;
  showStats?: boolean;
  className?: string;
}

/**
 * Main jurisdiction dropdown component with enterprise jurisdiction data
 */
export const JurisdictionDropdown: React.FC<JurisdictionDropdownProps> = ({
  value,
  onValueChange,
  placeholder = "Select jurisdiction",
  disabled = false,
  simplified = false,
  verifiedOnly = false,
  stateFilter,
  includeAll = false,
  showStats = false,
  className
}) => {
  // Get jurisdiction options based on configuration
  const getOptions = () => {
    let jurisdictions = getAllJurisdictions();
    
    if (verifiedOnly) {
      jurisdictions = getVerifiedJurisdictions();
    }
    
    if (stateFilter) {
      jurisdictions = getJurisdictionsByState(stateFilter);
    }
    
    if (simplified) {
      return getSimplifiedJurisdictionOptions();
    }
    
    return jurisdictions.map(jurisdiction => ({
      value: jurisdiction.id,
      label: jurisdiction.fullName,
      state: jurisdiction.state,
      verified: jurisdiction.validationStatus === 'VERIFIED',
      assessedValue: jurisdiction.assessedValue,
      appealVolume: jurisdiction.appealVolume
    }));
  };

  const options = getOptions();

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange} 
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAll && (
          <SelectItem value="all">All Jurisdictions</SelectItem>
        )}
        
        {simplified ? (
          // Simplified view - just the jurisdiction names
          options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))
        ) : (
          // Full view with verification status and stats
          options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex flex-col py-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{option.label}</span>
                  {option.verified && (
                    <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                      VERIFIED
                    </span>
                  )}
                </div>
                {showStats && option.assessedValue && (
                  <span className="text-xs text-gray-500">
                    {option.assessedValue} • {option.appealVolume}
                  </span>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

/**
 * Simplified jurisdiction dropdown for basic use cases
 */
export const SimpleJurisdictionDropdown: React.FC<Omit<JurisdictionDropdownProps, 'simplified'>> = (props) => (
  <JurisdictionDropdown {...props} simplified={true} />
);

/**
 * Verified jurisdictions only dropdown
 */
export const VerifiedJurisdictionDropdown: React.FC<Omit<JurisdictionDropdownProps, 'verifiedOnly'>> = (props) => (
  <JurisdictionDropdown {...props} verifiedOnly={true} />
);

/**
 * State-specific jurisdiction dropdown
 */
interface StateJurisdictionDropdownProps extends JurisdictionDropdownProps {
  state: string;
}

export const StateJurisdictionDropdown: React.FC<StateJurisdictionDropdownProps> = ({ 
  state, 
  ...props 
}) => (
  <JurisdictionDropdown {...props} stateFilter={state} />
);

/**
 * Legacy jurisdiction dropdown for backward compatibility
 * Maps old hardcoded options to new jurisdiction IDs
 */
export const LegacyJurisdictionDropdown: React.FC<JurisdictionDropdownProps> = (props) => {
  const legacyOptions = [
    { value: 'tx-travis', label: 'Travis County' },
    { value: 'tx-harris', label: 'Harris County' },
    { value: 'tx-dallas', label: 'Dallas County' },
    { value: 'tx-tarrant', label: 'Tarrant County' },
    { value: 'tx-collin', label: 'Collin County' },
    { value: 'tx-denton', label: 'Denton County' }
  ];

  return (
    <Select value={props.value} onValueChange={props.onValueChange} disabled={props.disabled}>
      <SelectTrigger className={props.className}>
        <SelectValue placeholder={props.placeholder || "Select jurisdiction"} />
      </SelectTrigger>
      <SelectContent>
        {props.includeAll && (
          <SelectItem value="all">All Jurisdictions</SelectItem>
        )}
        {legacyOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default JurisdictionDropdown;