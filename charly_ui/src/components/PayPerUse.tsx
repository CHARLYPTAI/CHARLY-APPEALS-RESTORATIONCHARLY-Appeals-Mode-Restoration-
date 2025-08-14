// 🍎 PayPerUse Component - One-off Services Pricing
// "Excellence without subscription" - Freedom through choice

import React, { useState } from 'react';
import { Button } from './Button';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { TRANSITIONS } from '../design/animations';

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  services: Service[];
}

interface Service {
  id: string;
  name: string;
  description: string;
  pricing: {
    min?: number;
    max?: number;
    fixed?: number;
  };
  features: string[];
  popular?: boolean;
  turnaround: string;
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'documents',
    name: 'Document Generation',
    description: 'Professional appeal packets and legal documents',
    services: [
      {
        id: 'professional_packet',
        name: 'Professional Appeal Packet',
        description: 'County-specific templates with legal compliance',
        pricing: { min: 150, max: 250 },
        features: [
          'County-specific templates',
          'Legal compliance review',
          'Professional formatting',
          'Digital delivery',
        ],
        turnaround: '2-3 business days',
        popular: true,
      },
      {
        id: 'premium_packet',
        name: 'Premium Appeal Packet',
        description: 'Enhanced with custom branding and expedited processing',
        pricing: { min: 350, max: 500 },
        features: [
          'Everything in Professional',
          'Custom branding',
          'Expedited processing (24h)',
          'Priority support',
          'Enhanced legal review',
        ],
        turnaround: '24 hours',
      },
    ],
  },
  {
    id: 'analysis',
    name: 'AI-Powered Analysis',
    description: 'Success predictions and strategic recommendations',
    services: [
      {
        id: 'basic_prediction',
        name: 'Basic Success Prediction',
        description: 'AI probability score with confidence intervals',
        pricing: { fixed: 75 },
        features: [
          'AI probability score',
          'Confidence intervals',
          'Basic factor analysis',
          'Success recommendations',
        ],
        turnaround: 'Instant',
        popular: true,
      },
      {
        id: 'comprehensive_analysis',
        name: 'Comprehensive Analysis',
        description: 'Detailed breakdown with strategic recommendations',
        pricing: { fixed: 150 },
        features: [
          'Everything in Basic',
          'Detailed factor breakdown',
          'Market timing recommendations',
          'Comparable property analysis',
          'Strategic optimization',
        ],
        turnaround: '1-2 hours',
      },
      {
        id: 'portfolio_optimization',
        name: 'Portfolio Optimization',
        description: 'Cross-portfolio analysis and prioritization',
        pricing: { min: 500, max: 2000 },
        features: [
          'Multi-property analysis',
          'ROI optimization',
          'Timing strategies',
          'Risk assessment',
          'Priority ranking',
        ],
        turnaround: '1-2 business days',
      },
    ],
  },
  {
    id: 'intelligence',
    name: 'Market Intelligence',
    description: 'Professional reports and market insights',
    services: [
      {
        id: 'property_analysis',
        name: 'Individual Property Analysis',
        description: 'Comprehensive financial and market analysis',
        pricing: { min: 200, max: 400 },
        features: [
          'Financial analysis (NOI, cap rates)',
          'Market positioning',
          'Comparable properties',
          'Investment recommendations',
          'Risk assessment',
        ],
        turnaround: '2-3 business days',
      },
      {
        id: 'market_report',
        name: 'Neighborhood Market Report',
        description: '25-100 property market analysis with trends',
        pricing: { min: 1500, max: 3500 },
        features: [
          'Market trend analysis',
          'Opportunity identification',
          'Competitive landscape',
          'Investment timing insights',
          'Executive summary',
        ],
        turnaround: '5-7 business days',
      },
      {
        id: 'custom_intelligence',
        name: 'Custom Market Intelligence',
        description: 'Bespoke research and predictive modeling',
        pricing: { min: 5000, max: 15000 },
        features: [
          'Custom research scope',
          'Predictive modeling',
          'Strategic consulting',
          'Presentation materials',
          'Follow-up consultation',
        ],
        turnaround: '2-3 weeks',
      },
    ],
  },
];

export const PayPerUse: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('documents');
  const [cartItems, setCartItems] = useState<string[]>([]);

  const formatPrice = (pricing: Service['pricing']) => {
    if (pricing.fixed) {
      return `$${pricing.fixed.toLocaleString()}`;
    }
    return `$${pricing.min!.toLocaleString()} - $${pricing.max!.toLocaleString()}`;
  };

  const getBulkDiscount = (quantity: number) => {
    if (quantity >= 50) return 40;
    if (quantity >= 25) return 30;
    if (quantity >= 10) return 20;
    return 0;
  };

  const addToCart = (serviceId: string) => {
    setCartItems([...cartItems, serviceId]);
  };

  const selectedCategoryData = SERVICE_CATEGORIES.find(
    (cat) => cat.id === selectedCategory
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Pay-Per-Use Services</h2>
        <p style={styles.subtitle}>
          Professional services without subscription commitment
        </p>
      </div>

      <div style={styles.categories}>
        {SERVICE_CATEGORIES.map((category) => (
          <button
            key={category.id}
            style={{
              ...styles.categoryTab,
              ...(selectedCategory === category.id
                ? styles.categoryTabActive
                : {}),
            }}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {selectedCategoryData && (
        <div style={styles.categoryContent}>
          <div style={styles.categoryHeader}>
            <h3 style={styles.categoryTitle}>{selectedCategoryData.name}</h3>
            <p style={styles.categoryDescription}>
              {selectedCategoryData.description}
            </p>
          </div>

          <div style={styles.servicesGrid}>
            {selectedCategoryData.services.map((service) => (
              <div
                key={service.id}
                style={{
                  ...styles.serviceCard,
                  ...(service.popular ? styles.serviceCardPopular : {}),
                }}
              >
                {service.popular && (
                  <div style={styles.popularBadge}>Popular</div>
                )}

                <div style={styles.serviceHeader}>
                  <h4 style={styles.serviceName}>{service.name}</h4>
                  <div style={styles.priceContainer}>
                    <span style={styles.price}>{formatPrice(service.pricing)}</span>
                    <span style={styles.turnaround}>{service.turnaround}</span>
                  </div>
                  <p style={styles.serviceDescription}>{service.description}</p>
                </div>

                <div style={styles.features}>
                  {service.features.map((feature, index) => (
                    <div key={index} style={styles.feature}>
                      <CheckIcon />
                      <span style={styles.featureText}>{feature}</span>
                    </div>
                  ))}
                </div>

                <div style={styles.serviceFooter}>
                  <Button
                    variant={service.popular ? 'primary' : 'secondary'}
                    size="md"
                    fullWidth
                    onClick={() => addToCart(service.id)}
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.bulkDiscounts}>
        <h3 style={styles.bulkTitle}>Bulk Discounts</h3>
        <div style={styles.discountTiers}>
          <div style={styles.discountTier}>
            <span style={styles.discountQuantity}>10+</span>
            <span style={styles.discountPercentage}>20% off</span>
          </div>
          <div style={styles.discountTier}>
            <span style={styles.discountQuantity}>25+</span>
            <span style={styles.discountPercentage}>30% off</span>
          </div>
          <div style={styles.discountTier}>
            <span style={styles.discountQuantity}>50+</span>
            <span style={styles.discountPercentage}>40% off</span>
          </div>
        </div>
      </div>

      <div style={styles.comparison}>
        <div style={styles.comparisonItem}>
          <span style={styles.comparisonLabel}>CHARLY Professional Packet</span>
          <span style={styles.comparisonPrice}>$150-$250</span>
        </div>
        <div style={styles.comparisonVs}>vs.</div>
        <div style={styles.comparisonItem}>
          <span style={styles.comparisonLabel}>Traditional Attorney Packet</span>
          <span style={styles.comparisonPrice}>$3,000-$10,000</span>
        </div>
        <div style={styles.savings}>
          Save 85-95% with superior AI-powered results
        </div>
      </div>
    </div>
  );
};

const CheckIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={APPLE_COLORS.GREEN}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },

  header: {
    textAlign: 'center' as const,
    marginBottom: SPACING.XL,
  },

  title: {
    fontSize: '24px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    margin: 0,
    marginBottom: SPACING.SM,
    letterSpacing: '-0.3px',
  },

  subtitle: {
    fontSize: '15px',
    color: NEUTRAL_COLORS.GRAY_500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    margin: 0,
    fontWeight: 300,
  },

  categories: {
    display: 'flex',
    justifyContent: 'center',
    gap: SPACING.XS,
    marginBottom: SPACING.XL,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  categoryTab: {
    padding: `${SPACING.MD} ${SPACING.LG}`,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 400,
    color: NEUTRAL_COLORS.GRAY_500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    transition: TRANSITIONS.STANDARD,
    position: 'relative' as const,
  },

  categoryTabActive: {
    color: APPLE_COLORS.BLUE,
    fontWeight: 500,
    '::after': {
      content: '""',
      position: 'absolute' as const,
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '24px',
      height: '2px',
      backgroundColor: APPLE_COLORS.BLUE,
      borderRadius: '1px',
    },
  },

  categoryContent: {
    marginBottom: SPACING.XXL,
  },

  categoryHeader: {
    textAlign: 'center' as const,
    marginBottom: SPACING.LG,
  },

  categoryTitle: {
    fontSize: '20px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    margin: 0,
    marginBottom: SPACING.XS,
  },

  categoryDescription: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    margin: 0,
    fontWeight: 300,
  },

  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: SPACING.LG,
  },

  serviceCard: {
    position: 'relative' as const,
    backgroundColor: NEUTRAL_COLORS.WHITE,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    borderRadius: '16px',
    padding: SPACING.LG,
    transition: TRANSITIONS.STANDARD,
  },

  serviceCardPopular: {
    borderColor: APPLE_COLORS.BLUE,
    boxShadow: '0 4px 20px rgba(0, 122, 255, 0.1)',
  },

  popularBadge: {
    position: 'absolute' as const,
    top: '-8px',
    right: SPACING.LG,
    backgroundColor: APPLE_COLORS.BLUE,
    color: NEUTRAL_COLORS.WHITE,
    fontSize: '12px',
    fontWeight: 500,
    padding: '4px 8px',
    borderRadius: '8px',
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  serviceHeader: {
    marginBottom: SPACING.LG,
    paddingBottom: SPACING.LG,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  serviceName: {
    fontSize: '18px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    margin: 0,
    marginBottom: SPACING.XS,
  },

  priceContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },

  price: {
    fontSize: '24px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  turnaround: {
    fontSize: '12px',
    color: APPLE_COLORS.GREEN,
    fontWeight: 500,
    backgroundColor: `${APPLE_COLORS.GREEN}10`,
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  serviceDescription: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    margin: 0,
    fontWeight: 300,
    lineHeight: 1.4,
  },

  features: {
    marginBottom: SPACING.LG,
  },

  feature: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: SPACING.XS,
    padding: `${SPACING.XS} 0`,
  },

  featureText: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    fontWeight: 400,
    lineHeight: 1.4,
  },

  serviceFooter: {
    paddingTop: SPACING.MD,
  },

  bulkDiscounts: {
    textAlign: 'center' as const,
    marginBottom: SPACING.XXL,
    padding: SPACING.LG,
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '16px',
  },

  bulkTitle: {
    fontSize: '18px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    margin: 0,
    marginBottom: SPACING.LG,
  },

  discountTiers: {
    display: 'flex',
    justifyContent: 'center',
    gap: SPACING.LG,
    flexWrap: 'wrap' as const,
  },

  discountTier: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: SPACING.XS,
  },

  discountQuantity: {
    fontSize: '20px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  discountPercentage: {
    fontSize: '14px',
    color: APPLE_COLORS.GREEN,
    fontWeight: 500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  comparison: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.LG,
    padding: SPACING.LG,
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '16px',
    flexWrap: 'wrap' as const,
  },

  comparisonItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: SPACING.XS,
  },

  comparisonLabel: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    fontWeight: 400,
  },

  comparisonPrice: {
    fontSize: '18px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  comparisonVs: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_400,
    fontWeight: 500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  savings: {
    fontSize: '16px',
    color: APPLE_COLORS.GREEN,
    fontWeight: 500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    textAlign: 'center' as const,
    width: '100%',
    marginTop: SPACING.SM,
  },
} as const;