// 🍎 BillingHistory Component - Financial Transparency
// "Clarity through simplicity" - Every transaction matters

import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { TRANSITIONS } from '../design/animations';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  pdf_url?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  expiry?: string;
  is_default: boolean;
}

interface BillingData {
  current_plan: {
    name: string;
    price: number;
    billing_cycle: 'monthly' | 'annual';
    next_billing_date: string;
  };
  payment_methods: PaymentMethod[];
  invoices: Invoice[];
  next_payment: {
    amount: number;
    date: string;
    description: string;
  };
}

export const BillingHistory: React.FC = () => {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'methods'>('invoices');

  useEffect(() => {
    // Simulate API call for billing data
    const mockData: BillingData = {
      current_plan: {
        name: 'Professional',
        price: 899,
        billing_cycle: 'monthly',
        next_billing_date: '2024-09-01',
      },
      payment_methods: [
        {
          id: 'pm_1',
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          expiry: '12/25',
          is_default: true,
        },
        {
          id: 'pm_2',
          type: 'card',
          last4: '5555',
          brand: 'Mastercard',
          expiry: '08/26',
          is_default: false,
        },
      ],
      invoices: [
        {
          id: 'inv_001',
          date: '2024-08-01',
          amount: 899,
          status: 'paid',
          description: 'Professional Plan - August 2024',
          pdf_url: '/invoices/inv_001.pdf',
        },
        {
          id: 'inv_002',
          date: '2024-07-01',
          amount: 899,
          status: 'paid',
          description: 'Professional Plan - July 2024',
          pdf_url: '/invoices/inv_002.pdf',
        },
        {
          id: 'inv_003',
          date: '2024-06-01',
          amount: 449.50,
          status: 'paid',
          description: 'Professional Plan - June 2024 (Pro-rated)',
          pdf_url: '/invoices/inv_003.pdf',
        },
      ],
      next_payment: {
        amount: 899,
        date: '2024-09-01',
        description: 'Professional Plan - September 2024',
      },
    };
    setBillingData(mockData);
  }, []);

  if (!billingData) {
    return <div style={styles.loading}>Loading billing information...</div>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return APPLE_COLORS.GREEN;
      case 'pending':
        return APPLE_COLORS.ORANGE;
      case 'failed':
        return APPLE_COLORS.RED;
      default:
        return NEUTRAL_COLORS.GRAY_500;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Billing & Payments</h2>
      </div>

      <div style={styles.currentPlan}>
        <div style={styles.planCard}>
          <div style={styles.planHeader}>
            <h3 style={styles.planName}>{billingData.current_plan.name} Plan</h3>
            <span style={styles.planPrice}>
              {formatAmount(billingData.current_plan.price)}/
              {billingData.current_plan.billing_cycle === 'monthly' ? 'month' : 'year'}
            </span>
          </div>
          <div style={styles.nextPayment}>
            <span style={styles.nextPaymentLabel}>Next payment:</span>
            <span style={styles.nextPaymentDate}>
              {formatDate(billingData.current_plan.next_billing_date)}
            </span>
            <span style={styles.nextPaymentAmount}>
              {formatAmount(billingData.next_payment.amount)}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'invoices' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('invoices')}
        >
          Invoices & History
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'methods' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('methods')}
        >
          Payment Methods
        </button>
      </div>

      {activeTab === 'invoices' && (
        <div style={styles.invoicesSection}>
          <div style={styles.invoicesList}>
            {billingData.invoices.map((invoice) => (
              <div key={invoice.id} style={styles.invoiceItem}>
                <div style={styles.invoiceIcon}>
                  <InvoiceIcon status={invoice.status} />
                </div>
                <div style={styles.invoiceContent}>
                  <div style={styles.invoiceDescription}>
                    {invoice.description}
                  </div>
                  <div style={styles.invoiceDate}>
                    {formatDate(invoice.date)}
                  </div>
                </div>
                <div style={styles.invoiceStatus}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: `${getStatusColor(invoice.status)}15`,
                      color: getStatusColor(invoice.status),
                    }}
                  >
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>
                <div style={styles.invoiceAmount}>
                  {formatAmount(invoice.amount)}
                </div>
                <div style={styles.invoiceActions}>
                  {invoice.pdf_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(invoice.pdf_url, '_blank')}
                    >
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'methods' && (
        <div style={styles.methodsSection}>
          <div style={styles.methodsHeader}>
            <h3 style={styles.methodsTitle}>Payment Methods</h3>
            <Button variant="secondary" size="sm" onClick={() => {}}>
              Add Method
            </Button>
          </div>
          
          <div style={styles.methodsList}>
            {billingData.payment_methods.map((method) => (
              <div key={method.id} style={styles.methodItem}>
                <div style={styles.methodIcon}>
                  <PaymentIcon type={method.type} brand={method.brand} />
                </div>
                <div style={styles.methodContent}>
                  <div style={styles.methodInfo}>
                    <span style={styles.methodBrand}>
                      {method.brand || 'Bank Account'}
                    </span>
                    <span style={styles.methodLast4}>
                      •••• {method.last4}
                    </span>
                    {method.expiry && (
                      <span style={styles.methodExpiry}>
                        Expires {method.expiry}
                      </span>
                    )}
                  </div>
                  {method.is_default && (
                    <span style={styles.defaultBadge}>Default</span>
                  )}
                </div>
                <div style={styles.methodActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {}}
                  >
                    Edit
                  </Button>
                  {!method.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {}}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.summary}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Total Paid This Year</span>
          <span style={styles.summaryValue}>
            {formatAmount(billingData.invoices.reduce((sum, inv) => sum + inv.amount, 0))}
          </span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Average Monthly</span>
          <span style={styles.summaryValue}>
            {formatAmount(billingData.invoices.reduce((sum, inv) => sum + inv.amount, 0) / billingData.invoices.length)}
          </span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Next Payment</span>
          <span style={styles.summaryValue}>
            {formatAmount(billingData.next_payment.amount)}
          </span>
        </div>
      </div>
    </div>
  );
};

const InvoiceIcon: React.FC<{ status: string }> = ({ status }) => {
  const color = status === 'paid' ? APPLE_COLORS.GREEN : 
               status === 'pending' ? APPLE_COLORS.ORANGE : 
               APPLE_COLORS.RED;
  
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  );
};

const PaymentIcon: React.FC<{ type: string; brand?: string }> = ({ type, brand }) => {
  const color = NEUTRAL_COLORS.GRAY_600;
  
  if (type === 'bank') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4v18" />
        <path d="M19 21V11l-6-4" />
      </svg>
    );
  }
  
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
  },

  loading: {
    textAlign: 'center' as const,
    padding: SPACING.XXL,
    color: NEUTRAL_COLORS.GRAY_500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
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
    letterSpacing: '-0.3px',
  },

  currentPlan: {
    marginBottom: SPACING.XL,
  },

  planCard: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    borderRadius: '16px',
    padding: SPACING.LG,
  },

  planHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
    paddingBottom: SPACING.MD,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  planName: {
    fontSize: '20px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    margin: 0,
  },

  planPrice: {
    fontSize: '24px',
    fontWeight: 600,
    color: APPLE_COLORS.BLUE,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    letterSpacing: '-0.5px',
  },

  nextPayment: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.MD,
  },

  nextPaymentLabel: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  nextPaymentDate: {
    fontSize: '14px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    flex: 1,
    textAlign: 'center' as const,
  },

  nextPaymentAmount: {
    fontSize: '16px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  tabs: {
    display: 'flex',
    justifyContent: 'center',
    gap: SPACING.XS,
    marginBottom: SPACING.XL,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  tab: {
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

  tabActive: {
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

  invoicesSection: {
    marginBottom: SPACING.XXL,
  },

  invoicesList: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    borderRadius: '12px',
    overflow: 'hidden',
  },

  invoiceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.MD,
    padding: SPACING.LG,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_50}`,
    transition: TRANSITIONS.STANDARD,
    ':hover': {
      backgroundColor: NEUTRAL_COLORS.GRAY_25,
    },
    ':last-child': {
      borderBottom: 'none',
    },
  },

  invoiceIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '10px',
    flexShrink: 0,
  },

  invoiceContent: {
    flex: 1,
    minWidth: 0,
  },

  invoiceDescription: {
    fontSize: '15px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    marginBottom: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  invoiceDate: {
    fontSize: '13px',
    color: NEUTRAL_COLORS.GRAY_500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  invoiceStatus: {
    flexShrink: 0,
  },

  statusBadge: {
    fontSize: '12px',
    fontWeight: 500,
    padding: '4px 8px',
    borderRadius: '6px',
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  invoiceAmount: {
    fontSize: '16px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    minWidth: '80px',
    textAlign: 'right' as const,
  },

  invoiceActions: {
    flexShrink: 0,
  },

  methodsSection: {
    marginBottom: SPACING.XXL,
  },

  methodsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },

  methodsTitle: {
    fontSize: '18px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    margin: 0,
  },

  methodsList: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    borderRadius: '12px',
    overflow: 'hidden',
  },

  methodItem: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.MD,
    padding: SPACING.LG,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_50}`,
    ':last-child': {
      borderBottom: 'none',
    },
  },

  methodIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '10px',
    flexShrink: 0,
  },

  methodContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.MD,
  },

  methodInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.SM,
  },

  methodBrand: {
    fontSize: '15px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  methodLast4: {
    fontSize: '15px',
    color: NEUTRAL_COLORS.GRAY_600,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  methodExpiry: {
    fontSize: '13px',
    color: NEUTRAL_COLORS.GRAY_500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  defaultBadge: {
    fontSize: '12px',
    fontWeight: 500,
    color: APPLE_COLORS.BLUE,
    backgroundColor: `${APPLE_COLORS.BLUE}15`,
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  methodActions: {
    display: 'flex',
    gap: SPACING.XS,
  },

  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: SPACING.LG,
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '12px',
    padding: SPACING.LG,
  },

  summaryItem: {
    textAlign: 'center' as const,
  },

  summaryLabel: {
    display: 'block',
    fontSize: '12px',
    color: NEUTRAL_COLORS.GRAY_500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    marginBottom: SPACING.XS,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },

  summaryValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    letterSpacing: '-0.5px',
  },
} as const;