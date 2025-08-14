// 🍎 PricingTiers Component - Jony Ive Invisible Design
// "The best design is no design" - Invisibility through perfection

import React, { useState } from 'react';
import { Button } from './Button';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { TRANSITIONS } from '../design/animations';

interface PricingPlan {
  id: string;
  name: string;
  price: {
    monthly: number;
    annual: number;
  };
  description: string;
  features: {
    packets: number | string;
    predictions: number | string;
    analyses: number | string;
    support: string;
    api: boolean;
    branding: boolean;
    consultation: number;
  };
  popular?: boolean;
  cta: string;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'freemium',
    name: 'Freemium',
    price: { monthly: 0, annual: 0 },
    description: 'Perfect for getting started',
    features: {
      packets: '1',
      predictions: '3',
      analyses: '2',
      support: 'Community',
      api: false,
      branding: false,
      consultation: 0,
    },
    cta: 'Start Free',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: { monthly: 299, annual: 3588 },
    description: 'For small property owners',
    features: {
      packets: '5',
      predictions: '10',
      analyses: '5',
      support: 'Email',
      api: false,
      branding: false,
      consultation: 0,
    },
    cta: 'Start Trial',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: { monthly: 899, annual: 10788 },
    description: 'For property professionals',
    features: {
      packets: '25',
      predictions: '50',
      analyses: '25',
      support: 'Priority',
      api: true,
      branding: true,
      consultation: 0,
    },
    popular: true,
    cta: 'Start Trial',
  },
  {
    id: 'business',
    name: 'Business',
    price: { monthly: 2499, annual: 29988 },
    description: 'For property management firms',
    features: {
      packets: '100',
      predictions: '200',
      analyses: '100',
      support: 'Phone & Email',
      api: true,
      branding: true,
      consultation: 1,
    },
    cta: 'Contact Sales',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: 7500, annual: 90000 },
    description: 'For institutional investors',
    features: {
      packets: 'Unlimited',
      predictions: 'Unlimited',
      analyses: 'Unlimited',
      support: '24/7 Dedicated',
      api: true,
      branding: true,
      consultation: 4,
    },
    cta: 'Contact Sales',
  },
];

export const PricingTiers: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const formatPrice = (plan: PricingPlan) => {
    if (plan.price.monthly === 0) return 'Free';
    const price = isAnnual ? plan.price.annual : plan.price.monthly;
    const period = isAnnual ? 'year' : 'month';
    return `$${price.toLocaleString()}/${period}`;
  };

  const getSavings = (plan: PricingPlan) => {
    if (plan.price.monthly === 0) return null;
    const monthlyTotal = plan.price.monthly * 12;
    const savings = monthlyTotal - plan.price.annual;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return percentage > 0 ? `Save ${percentage}%` : null;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Choose Your Plan</h2>
        <p style={styles.subtitle}>
          Replace $40K CoStar + $200K legal services with CHARLY
        </p>
        
        <div style={styles.billingToggle}>
          <button
            style={{
              ...styles.toggleButton,
              ...(isAnnual ? {} : styles.toggleButtonActive),
            }}
            onClick={() => setIsAnnual(false)}
          >
            Monthly
          </button>
          <button
            style={{
              ...styles.toggleButton,
              ...(isAnnual ? styles.toggleButtonActive : {}),
            }}
            onClick={() => setIsAnnual(true)}
          >
            Annual
            <span style={styles.savingsBadge}>Save up to 20%</span>
          </button>
        </div>
      </div>

      <div style={styles.plansGrid}>
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.id}
            style={{
              ...styles.planCard,
              ...(plan.popular ? styles.planCardPopular : {}),
            }}
          >
            {plan.popular && (
              <div style={styles.popularBadge}>Most Popular</div>
            )}
            
            <div style={styles.planHeader}>
              <h3 style={styles.planName}>{plan.name}</h3>
              <div style={styles.priceContainer}>
                <span style={styles.price}>{formatPrice(plan)}</span>
                {isAnnual && getSavings(plan) && (
                  <span style={styles.savings}>{getSavings(plan)}</span>
                )}
              </div>
              <p style={styles.planDescription}>{plan.description}</p>
            </div>

            <div style={styles.features}>
              <FeatureItem
                label="Appeal Packets"
                value={`${plan.features.packets}/month`}
              />
              <FeatureItem
                label="AI Predictions"
                value={`${plan.features.predictions}/month`}
              />
              <FeatureItem
                label="Property Analyses"
                value={`${plan.features.analyses}/month`}
              />
              <FeatureItem
                label="Support"
                value={plan.features.support}
              />
              {plan.features.api && (
                <FeatureItem label="API Access" value="Included" />
              )}
              {plan.features.branding && (
                <FeatureItem label="Custom Branding" value="Included" />
              )}
              {plan.features.consultation > 0 && (
                <FeatureItem
                  label="Strategy Consultation"
                  value={`${plan.features.consultation}h/month`}
                />
              )}
            </div>

            <div style={styles.planFooter}>
              <Button
                variant={plan.popular ? 'primary' : 'secondary'}
                size="lg"
                fullWidth
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.cta}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.valueProps}>
        <div style={styles.valueProp}>
          <span style={styles.valuePropNumber}>85-95%</span>
          <span style={styles.valuePropText}>cost savings vs attorneys</span>
        </div>
        <div style={styles.valueProp}>
          <span style={styles.valuePropNumber}>25%</span>
          <span style={styles.valuePropText}>higher success rates</span>
        </div>
        <div style={styles.valueProp}>
          <span style={styles.valuePropNumber}>2-3</span>
          <span style={styles.valuePropText}>appeals pay for platform</span>
        </div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div style={styles.featureItem}>
    <span style={styles.featureLabel}>{label}</span>
    <span style={styles.featureValue}>{value}</span>
  </div>
);

const handlePlanSelect = (planId: string) => {
  console.log('Plan selected:', planId);
  // Implementation for plan selection
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },

  header: {
    textAlign: 'center' as const,
    marginBottom: SPACING.XXL,
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
    marginBottom: SPACING.LG,
    fontWeight: 300,
  },

  billingToggle: {
    display: 'inline-flex',
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '8px',
    padding: '4px',
    gap: '4px',
  },

  toggleButton: {
    position: 'relative' as const,
    padding: `${SPACING.XS} ${SPACING.MD}`,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 400,
    color: NEUTRAL_COLORS.GRAY_600,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    transition: TRANSITIONS.STANDARD,
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.XS,
  },

  toggleButtonActive: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    color: APPLE_COLORS.BLUE,
    fontWeight: 500,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },

  savingsBadge: {
    fontSize: '12px',
    backgroundColor: APPLE_COLORS.GREEN,
    color: NEUTRAL_COLORS.WHITE,
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 500,
  },

  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: SPACING.LG,
    marginBottom: SPACING.XXL,
  },

  planCard: {
    position: 'relative' as const,
    backgroundColor: NEUTRAL_COLORS.WHITE,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    borderRadius: '16px',
    padding: SPACING.LG,
    transition: TRANSITIONS.STANDARD,
    ':hover': {
      borderColor: NEUTRAL_COLORS.GRAY_200,
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
    },
  },

  planCardPopular: {
    borderColor: APPLE_COLORS.BLUE,
    transform: 'scale(1.02)',
    boxShadow: '0 8px 32px rgba(0, 122, 255, 0.1)',
  },

  popularBadge: {
    position: 'absolute' as const,
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: APPLE_COLORS.BLUE,
    color: NEUTRAL_COLORS.WHITE,
    fontSize: '12px',
    fontWeight: 500,
    padding: '4px 12px',
    borderRadius: '12px',
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  planHeader: {
    textAlign: 'center' as const,
    marginBottom: SPACING.LG,
    paddingBottom: SPACING.LG,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  planName: {
    fontSize: '20px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    margin: 0,
    marginBottom: SPACING.XS,
  },

  priceContainer: {
    marginBottom: SPACING.XS,
  },

  price: {
    fontSize: '32px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    letterSpacing: '-0.5px',
  },

  savings: {
    marginLeft: SPACING.SM,
    fontSize: '14px',
    color: APPLE_COLORS.GREEN,
    fontWeight: 500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  planDescription: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    margin: 0,
    fontWeight: 300,
  },

  features: {
    marginBottom: SPACING.LG,
  },

  featureItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${SPACING.XS} 0`,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_50}`,
  },

  featureLabel: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    fontWeight: 400,
  },

  featureValue: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    fontWeight: 500,
  },

  planFooter: {
    paddingTop: SPACING.LG,
  },

  valueProps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: SPACING.LG,
    marginTop: SPACING.XXL,
    paddingTop: SPACING.XXL,
    borderTop: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  valueProp: {
    textAlign: 'center' as const,
  },

  valuePropNumber: {
    display: 'block',
    fontSize: '28px',
    fontWeight: 600,
    color: APPLE_COLORS.BLUE,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    marginBottom: SPACING.XS,
    letterSpacing: '-0.5px',
  },

  valuePropText: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    fontWeight: 400,
  },
} as const;