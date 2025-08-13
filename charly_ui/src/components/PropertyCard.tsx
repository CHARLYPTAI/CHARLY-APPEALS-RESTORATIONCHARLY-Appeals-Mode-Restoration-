// 🍎 PropertyCard Component - Apple Real Estate Excellence
// "Every property deserves beautiful presentation" - Steve Jobs (probably)

import React, { useState } from 'react';
import { APPLE_COLORS, NEUTRAL_COLORS, getColorForStatus } from '../design/colors';
import { SPACING } from '../design/spacing';
import { TRANSITIONS, SHADOWS } from '../design/animations';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  property_type: 'Residential' | 'Commercial' | 'Industrial' | 'Mixed Use' | 'Vacant Land';
  current_assessment: number;
  assessed_value: number;
  proposed_value?: number;
  potential_savings?: number;
  status: 'Under Review' | 'Appeal Filed' | 'Won' | 'Lost' | 'Pending';
  square_footage?: number;
  year_built?: number;
  created_date: string;
}

interface PropertyCardProps {
  property: Property;
  onEdit?: (property: Property) => void;
  onDelete?: (propertyId: string) => void;
  onCreateAppeal?: (propertyId: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onEdit,
  onDelete,
  onCreateAppeal,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: Property['status']) => {
    switch (status) {
      case 'Won': return APPLE_COLORS.GREEN;
      case 'Appeal Filed': return APPLE_COLORS.ORANGE;
      case 'Lost': return APPLE_COLORS.RED;
      case 'Under Review': return APPLE_COLORS.BLUE;
      default: return NEUTRAL_COLORS.GRAY_600;
    }
  };

  const calculateSavings = () => {
    if (property.proposed_value && property.current_assessment) {
      return property.current_assessment - property.proposed_value;
    }
    return property.potential_savings || 0;
  };

  const cardStyle = {
    ...styles.card,
    boxShadow: isHovered ? SHADOWS.HOVER : SHADOWS.MD,
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.addressSection}>
          <h3 style={styles.address}>{property.address}</h3>
          <p style={styles.location}>
            {property.city}, {property.state} {property.zip_code}
          </p>
        </div>
        
        <div style={styles.statusBadge}>
          <span 
            style={{
              ...styles.statusText,
              backgroundColor: `${getStatusColor(property.status)}15`,
              color: getStatusColor(property.status),
            }}
          >
            {property.status}
          </span>
        </div>
      </div>

      {/* Property Details */}
      <div style={styles.details}>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Type:</span>
          <span style={styles.detailValue}>{property.property_type}</span>
        </div>
        
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>County:</span>
          <span style={styles.detailValue}>{property.county}</span>
        </div>
        
        {property.square_footage && (
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Sq Ft:</span>
            <span style={styles.detailValue}>{property.square_footage.toLocaleString()}</span>
          </div>
        )}
        
        {property.year_built && (
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Built:</span>
            <span style={styles.detailValue}>{property.year_built}</span>
          </div>
        )}
      </div>

      {/* Financial Info */}
      <div style={styles.financials}>
        <div style={styles.financialItem}>
          <span style={styles.financialLabel}>Current Assessment</span>
          <span style={styles.financialValue}>
            {formatCurrency(property.current_assessment)}
          </span>
        </div>
        
        <div style={styles.financialItem}>
          <span style={styles.financialLabel}>Assessed Value</span>
          <span style={styles.financialValue}>
            {formatCurrency(property.assessed_value)}
          </span>
        </div>
        
        {calculateSavings() > 0 && (
          <div style={styles.financialItem}>
            <span style={styles.financialLabel}>Potential Savings</span>
            <span style={{
              ...styles.financialValue,
              color: APPLE_COLORS.GREEN,
              fontWeight: 600,
            }}>
              {formatCurrency(calculateSavings())}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        {onCreateAppeal && (
          <button
            style={styles.primaryAction}
            onClick={() => onCreateAppeal(property.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0056D6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = APPLE_COLORS.BLUE;
            }}
          >
            Create Appeal
          </button>
        )}
        
        <div style={styles.secondaryActions}>
          {onEdit && (
            <button
              style={styles.iconButton}
              onClick={() => onEdit(property)}
              title="Edit Property"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = NEUTRAL_COLORS.GRAY_100;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          
          {onDelete && (
            <button
              style={styles.iconButton}
              onClick={() => onDelete(property.id)}
              title="Delete Property"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${APPLE_COLORS.RED}15`;
                e.currentTarget.style.color = APPLE_COLORS.RED;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = NEUTRAL_COLORS.GRAY_600;
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '12px',
    padding: SPACING.LG,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    transition: TRANSITIONS.STANDARD,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.LG,
    cursor: 'default',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.SM,
  },

  addressSection: {
    flex: 1,
    minWidth: 0, // Allow text truncation
  },

  address: {
    fontSize: '18px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: '4px',
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    lineHeight: 1.2,
  },

  location: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    fontWeight: 500,
  },

  statusBadge: {
    flexShrink: 0,
  },

  statusText: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },

  details: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: `${SPACING.XS} ${SPACING.SM}`,
    paddingBottom: SPACING.SM,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  detailLabel: {
    fontSize: '13px',
    color: NEUTRAL_COLORS.GRAY_600,
    fontWeight: 500,
  },

  detailValue: {
    fontSize: '13px',
    color: NEUTRAL_COLORS.GRAY_900,
    fontWeight: 600,
  },

  financials: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.XS,
    paddingBottom: SPACING.SM,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  financialItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  financialLabel: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    fontWeight: 500,
  },

  financialValue: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_900,
    fontWeight: 700,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.SM,
  },

  primaryAction: {
    backgroundColor: APPLE_COLORS.BLUE,
    color: NEUTRAL_COLORS.WHITE,
    border: 'none',
    borderRadius: '8px',
    padding: `${SPACING.SM} ${SPACING.LG}`,
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: TRANSITIONS.STANDARD,
    flex: 1,
    maxWidth: '150px',
  },

  secondaryActions: {
    display: 'flex',
    gap: SPACING.XS,
  },

  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    backgroundColor: 'transparent',
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    borderRadius: '8px',
    color: NEUTRAL_COLORS.GRAY_600,
    cursor: 'pointer',
    transition: TRANSITIONS.STANDARD,
  },
} as const;