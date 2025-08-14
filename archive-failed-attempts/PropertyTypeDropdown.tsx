/**
 * PropertyTypeDropdown Component
 * 
 * IAAO/MAI compliant property type dropdown with hierarchical selection
 * Replaces all hardcoded property type dropdowns across the platform
 */

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  getAllPropertyTypes, 
  getSimplifiedPropertyTypes
} from '../services/propertyTypeService';

interface PropertyTypeDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  simplified?: boolean;
  categoryFilter?: string;
  includeAll?: boolean;
  className?: string;
}

/**
 * IAAO/MAI compliant property type dropdown component
 */
export const PropertyTypeDropdown: React.FC<PropertyTypeDropdownProps> = ({
  value,
  onValueChange,
  placeholder = "Select property type",
  disabled = false,
  simplified = false,
  categoryFilter,
  includeAll = false,
  className
}) => {
  // Get property types based on configuration
  const getPropertyTypeOptions = () => {
    if (simplified) {
      return getSimplifiedPropertyTypes().map(pt => ({
        value: pt.value,
        label: pt.label,
        iaao_code: pt.iaao_code,
        description: `IAAO: ${pt.iaao_code}`
      }));
    }

    let propertyTypes = getAllPropertyTypes();
    
    if (categoryFilter) {
      propertyTypes = propertyTypes.filter(pt => pt.category === categoryFilter);
    }

    return propertyTypes.map(pt => ({
      value: pt.iaao_code,
      label: pt.display_name,
      iaao_code: pt.iaao_code,
      description: pt.description,
      category: pt.category
    }));
  };

  const options = getPropertyTypeOptions();

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
          <SelectItem value="all">All Property Types</SelectItem>
        )}
        
        {simplified ? (
          // Simplified view - just the main categories
          options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex flex-col">
                <span>{option.label}</span>
                <span className="text-xs text-gray-500">{option.description}</span>
              </div>
            </SelectItem>
          ))
        ) : (
          // Full hierarchical view grouped by category
          (() => {
            const groupedOptions = options.reduce((acc, option) => {
              const category = option.category || 'Other';
              if (!acc[category]) {
                acc[category] = [];
              }
              acc[category].push(option);
              return acc;
            }, {} as Record<string, typeof options>);

            return Object.entries(groupedOptions).map(([category, categoryOptions]) => (
              <React.Fragment key={category}>
                {/* Category header */}
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                  {category.replace('_', ' ')}
                </div>
                
                {/* Category options */}
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col py-1">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-gray-500">
                        {option.iaao_code} | {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </React.Fragment>
            ));
          })()
        )}
      </SelectContent>
    </Select>
  );
};

/**
 * Simplified property type dropdown for basic use cases
 */
export const SimplePropertyTypeDropdown: React.FC<Omit<PropertyTypeDropdownProps, 'simplified'>> = (props) => (
  <PropertyTypeDropdown {...props} simplified={true} />
);

/**
 * Category-specific property type dropdown
 */
interface CategoryPropertyTypeDropdownProps extends PropertyTypeDropdownProps {
  category: string;
}

export const CategoryPropertyTypeDropdown: React.FC<CategoryPropertyTypeDropdownProps> = ({ 
  category, 
  ...props 
}) => (
  <PropertyTypeDropdown {...props} categoryFilter={category} />
);

/**
 * Legacy property type dropdown for backward compatibility
 * Maps old property types to new IAAO codes
 */
export const LegacyPropertyTypeDropdown: React.FC<PropertyTypeDropdownProps> = (props) => {
  const legacyOptions = [
    { value: 'COM-OFF', label: 'Commercial' },
    { value: 'COM-OFF', label: 'Office' },
    { value: 'COM-RET', label: 'Retail' },
    { value: 'COM-IND', label: 'Industrial' },
    { value: 'MF', label: 'Multi-Family' },
    { value: 'LAND', label: 'Land' }
  ];

  return (
    <Select value={props.value} onValueChange={props.onValueChange} disabled={props.disabled}>
      <SelectTrigger className={props.className}>
        <SelectValue placeholder={props.placeholder || "Select property type"} />
      </SelectTrigger>
      <SelectContent>
        {props.includeAll && (
          <SelectItem value="all">All Property Types</SelectItem>
        )}
        {legacyOptions.map((option, index) => (
          <SelectItem key={`${option.value}-${index}`} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default PropertyTypeDropdown;