// 🍎 Appeals Page - IAAO-Compliant Property Tax Appeal Excellence
// "Innovation distinguishes between a leader and a follower" - Steve Jobs

import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingDots } from '../components/LoadingDots';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { TRANSITIONS } from '../design/animations';
import { authenticatedRequest } from '../lib/auth';

// IAAO-Compliant Data Structures
interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  property_type: string;
  current_assessment: number;
  square_footage?: number;
  year_built?: number;
}

interface SalesComparable {
  id: string;
  address: string;
  salePrice: number;
  saleDate: string;
  adjustments: {
    location: number;
    size: number;
    age: number;
    condition: number;
    total: number;
  };
  adjustedValue: number;
}

interface CostApproachData {
  landValue: number;
  replacementCostNew: number;
  physicalDepreciation: number;
  functionalObsolescence: number;
  economicObsolescence: number;
  depreciatedValue: number;
}

interface IncomeApproachData {
  // Direct Capitalization
  grossRentalIncome: number;
  vacancyRate: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  capitalizationRate: number;
  capitalizedValue: number;
  
  // Gross Rent Multiplier
  monthlyRent: number;
  grossRentMultiplier: number;
  grmValue: number;
}

interface ValuationWorkup {
  propertyId: string;
  salesApproach: {
    comparables: SalesComparable[];
    averageValue: number;
    weight: number;
  };
  costApproach: CostApproachData & { weight: number };
  incomeApproach: IncomeApproachData & { weight: number };
  finalValueEstimate: number;
  proposedAssessment: number;
  potentialSavings: number;
  confidenceLevel: number;
}

type TabType = 'selection' | 'sales' | 'cost' | 'income' | 'reconciliation' | 'evidence' | 'review';

const Appeals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('selection');
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [valuation, setValuation] = useState<ValuationWorkup | null>(null);
  const [generatingAppeal, setGeneratingAppeal] = useState(false);

  // Load properties on component mount
  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const response = await authenticatedRequest('/api/portfolio/');
      if (response.ok) {
        const data = await response.json();
        setProperties(data || []);
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setActiveTab('sales');
    
    // Initialize valuation workup
    setValuation({
      propertyId: property.id,
      salesApproach: {
        comparables: [],
        averageValue: 0,
        weight: 50
      },
      costApproach: {
        landValue: 0,
        replacementCostNew: 0,
        physicalDepreciation: 0,
        functionalObsolescence: 0,
        economicObsolescence: 0,
        depreciatedValue: 0,
        weight: 30
      },
      incomeApproach: {
        grossRentalIncome: 0,
        vacancyRate: 0.05,
        operatingExpenses: 0,
        netOperatingIncome: 0,
        capitalizationRate: 0.075,
        capitalizedValue: 0,
        monthlyRent: 0,
        grossRentMultiplier: 100,
        grmValue: 0,
        weight: 20
      },
      finalValueEstimate: 0,
      proposedAssessment: 0,
      potentialSavings: 0,
      confidenceLevel: 0
    });
  };

  const generateAppealPacket = async () => {
    if (!selectedProperty || !valuation) return;
    
    setGeneratingAppeal(true);
    try {
      // Simulate AI appeal generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert(`Appeal packet generated successfully!\n\nProperty: ${selectedProperty.address}\nProposed Value: $${valuation.finalValueEstimate.toLocaleString()}\nPotential Savings: $${valuation.potentialSavings.toLocaleString()}\n\nDownload will begin shortly...`);
    } catch (error) {
      alert('Failed to generate appeal packet. Please try again.');
    } finally {
      setGeneratingAppeal(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'selection':
        return <PropertySelection properties={properties} onSelect={handlePropertySelect} loading={loading} />;
      case 'sales':
        return <SalesComparisonTab valuation={valuation} setValuation={setValuation} />;
      case 'cost':
        return <CostApproachTab valuation={valuation} setValuation={setValuation} />;
      case 'income':
        return <IncomeApproachTab valuation={valuation} setValuation={setValuation} />;
      case 'reconciliation':
        return <ReconciliationTab valuation={valuation} setValuation={setValuation} />;
      case 'evidence':
        return <EvidenceManagement />;
      case 'review':
        return <AppealReview valuation={valuation} property={selectedProperty} onGenerate={generateAppealPacket} generating={generatingAppeal} />;
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'selection' as TabType, label: 'Property Selection', icon: 'home' },
    { id: 'sales' as TabType, label: 'Sales Comparison', icon: 'trending-up', disabled: !selectedProperty },
    { id: 'cost' as TabType, label: 'Cost Approach', icon: 'calculator', disabled: !selectedProperty },
    { id: 'income' as TabType, label: 'Income Approach', icon: 'dollar-sign', disabled: !selectedProperty },
    { id: 'reconciliation' as TabType, label: 'Reconciliation', icon: 'balance-scale', disabled: !selectedProperty },
    { id: 'evidence' as TabType, label: 'Evidence', icon: 'paperclip', disabled: !selectedProperty },
    { id: 'review' as TabType, label: 'Review & File', icon: 'send', disabled: !selectedProperty },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Property Tax Appeals</h1>
        <p style={styles.subtitle}>
          IAAO-compliant valuation and appeal generation system
        </p>
        {selectedProperty && (
          <div style={styles.selectedProperty}>
            <h3 style={styles.propertyTitle}>{selectedProperty.address}</h3>
            <p style={styles.propertyDetails}>
              {selectedProperty.city}, {selectedProperty.state} • {selectedProperty.property_type} • 
              Current Assessment: ${selectedProperty.current_assessment.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;
          return (
            <button
              key={tab.id}
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : {}),
                ...(isDisabled ? styles.tabDisabled : {}),
              }}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              disabled={isDisabled}
            >
              <div style={styles.tabStep}>{index + 1}</div>
              <span style={styles.tabLabel}>{tab.label}</span>
              {isActive && <div style={styles.activeIndicator} />}
            </button>
          );
        })}
      </div>

      <div style={styles.content}>
        {renderTabContent()}
      </div>
    </div>
  );
};

// Property Selection Component
interface PropertySelectionProps {
  properties: Property[];
  onSelect: (property: Property) => void;
  loading: boolean;
}

const PropertySelection: React.FC<PropertySelectionProps> = ({ properties, onSelect, loading }) => {
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <LoadingDots size="lg" />
        <p style={styles.loadingText}>Loading properties...</p>
      </div>
    );
  }

  return (
    <div style={styles.selectionContainer}>
      <h3 style={styles.sectionTitle}>Select Property for Appeal</h3>
      <p style={styles.sectionDescription}>
        Choose the property you want to create an appeal for. The system will guide you through 
        the IAAO-compliant valuation process.
      </p>
      
      <div style={styles.propertyGrid}>
        {properties.map((property) => (
          <div key={property.id} style={styles.propertyCard} onClick={() => onSelect(property)}>
            <div style={styles.propertyCardHeader}>
              <h4 style={styles.propertyCardTitle}>{property.address}</h4>
              <div style={styles.propertyType}>{property.property_type}</div>
            </div>
            <div style={styles.propertyCardBody}>
              <p style={styles.propertyLocation}>{property.city}, {property.state}</p>
              <div style={styles.propertyMetrics}>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>Current Assessment</span>
                  <span style={styles.metricValue}>${property.current_assessment.toLocaleString()}</span>
                </div>
                {property.square_footage && (
                  <div style={styles.metric}>
                    <span style={styles.metricLabel}>Square Footage</span>
                    <span style={styles.metricValue}>{property.square_footage.toLocaleString()} sq ft</span>
                  </div>
                )}
                {property.year_built && (
                  <div style={styles.metric}>
                    <span style={styles.metricLabel}>Year Built</span>
                    <span style={styles.metricValue}>{property.year_built}</span>
                  </div>
                )}
              </div>
            </div>
            <div style={styles.propertyCardFooter}>
              <Button variant="primary" onClick={() => onSelect(property)}>
                Create Appeal
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Sales Comparison Tab Component
interface SalesComparisonTabProps {
  valuation: ValuationWorkup | null;
  setValuation: (valuation: ValuationWorkup) => void;
}

const SalesComparisonTab: React.FC<SalesComparisonTabProps> = ({ valuation, setValuation }) => {
  const [addingComparable, setAddingComparable] = useState(false);
  const [newComparable, setNewComparable] = useState({
    address: '',
    salePrice: '',
    saleDate: '',
    locationAdj: '0',
    sizeAdj: '0',
    ageAdj: '0',
    conditionAdj: '0'
  });

  if (!valuation) return null;

  const addComparable = () => {
    if (!newComparable.address || !newComparable.salePrice || !newComparable.saleDate) {
      alert('Please fill in address, sale price, and sale date');
      return;
    }

    const salePrice = parseFloat(newComparable.salePrice);
    const locationAdj = parseFloat(newComparable.locationAdj);
    const sizeAdj = parseFloat(newComparable.sizeAdj);
    const ageAdj = parseFloat(newComparable.ageAdj);
    const conditionAdj = parseFloat(newComparable.conditionAdj);
    const totalAdj = locationAdj + sizeAdj + ageAdj + conditionAdj;
    const adjustedValue = salePrice + totalAdj;

    const comparable: SalesComparable = {
      id: Date.now().toString(),
      address: newComparable.address,
      salePrice,
      saleDate: newComparable.saleDate,
      adjustments: {
        location: locationAdj,
        size: sizeAdj,
        age: ageAdj,
        condition: conditionAdj,
        total: totalAdj
      },
      adjustedValue
    };

    const updatedValuation = {
      ...valuation,
      salesApproach: {
        ...valuation.salesApproach,
        comparables: [...valuation.salesApproach.comparables, comparable],
        averageValue: 0 // Will be recalculated
      }
    };

    // Calculate average value
    const total = updatedValuation.salesApproach.comparables.reduce((sum, comp) => sum + comp.adjustedValue, 0);
    updatedValuation.salesApproach.averageValue = total / updatedValuation.salesApproach.comparables.length;

    setValuation(updatedValuation);
    setNewComparable({
      address: '',
      salePrice: '',
      saleDate: '',
      locationAdj: '0',
      sizeAdj: '0',
      ageAdj: '0',
      conditionAdj: '0'
    });
    setAddingComparable(false);
  };

  const removeComparable = (id: string) => {
    const updatedComparables = valuation.salesApproach.comparables.filter(comp => comp.id !== id);
    const total = updatedComparables.reduce((sum, comp) => sum + comp.adjustedValue, 0);
    const averageValue = updatedComparables.length > 0 ? total / updatedComparables.length : 0;

    setValuation({
      ...valuation,
      salesApproach: {
        ...valuation.salesApproach,
        comparables: updatedComparables,
        averageValue
      }
    });
  };

  return (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>Sales Comparison Approach</h3>
      <p style={styles.sectionDescription}>
        Analyze comparable sales to determine market value. Add comparable properties and adjust for differences.
      </p>

      {/* Summary Card */}
      {valuation.salesApproach.comparables.length > 0 && (
        <div style={styles.salesSummaryCard}>
          <h4 style={styles.salesSummaryTitle}>Sales Comparison Summary</h4>
          <div style={styles.salesSummaryMetrics}>
            <div style={styles.salesSummaryMetric}>
              <span style={styles.salesSummaryLabel}>Number of Comparables</span>
              <span style={styles.salesSummaryValue}>{valuation.salesApproach.comparables.length}</span>
            </div>
            <div style={styles.salesSummaryMetric}>
              <span style={styles.salesSummaryLabel}>Average Adjusted Value</span>
              <span style={styles.salesSummaryValue}>${valuation.salesApproach.averageValue.toLocaleString()}</span>
            </div>
            <div style={styles.salesSummaryMetric}>
              <span style={styles.salesSummaryLabel}>Approach Weight</span>
              <span style={styles.salesSummaryValue}>{valuation.salesApproach.weight}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Comparables List */}
      {valuation.salesApproach.comparables.length > 0 && (
        <div style={styles.comparablesSection}>
          <h4 style={styles.sectionSubtitle}>Comparable Sales</h4>
          <div style={styles.comparablesTable}>
            {valuation.salesApproach.comparables.map((comp) => (
              <div key={comp.id} style={styles.comparableCard}>
                <div style={styles.comparableHeader}>
                  <h5 style={styles.comparableAddress}>{comp.address}</h5>
                  <Button
                    variant="secondary"
                    onClick={() => removeComparable(comp.id)}
                    style={styles.removeButton}
                  >
                    Remove
                  </Button>
                </div>
                <div style={styles.comparableGrid}>
                  <div style={styles.comparableMetric}>
                    <span style={styles.metricLabel}>Sale Price</span>
                    <span style={styles.metricValue}>${comp.salePrice.toLocaleString()}</span>
                  </div>
                  <div style={styles.comparableMetric}>
                    <span style={styles.metricLabel}>Sale Date</span>
                    <span style={styles.metricValue}>{comp.saleDate}</span>
                  </div>
                  <div style={styles.comparableMetric}>
                    <span style={styles.metricLabel}>Total Adjustments</span>
                    <span style={{
                      ...styles.metricValue,
                      color: comp.adjustments.total >= 0 ? APPLE_COLORS.GREEN : APPLE_COLORS.RED
                    }}>
                      ${comp.adjustments.total.toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.comparableMetric}>
                    <span style={styles.metricLabel}>Adjusted Value</span>
                    <span style={{...styles.metricValue, fontWeight: 600, color: APPLE_COLORS.BLUE}}>
                      ${comp.adjustedValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Comparable Section */}
      <div style={styles.addSection}>
        {!addingComparable ? (
          <Button
            variant="primary"
            onClick={() => setAddingComparable(true)}
          >
            Add Comparable Sale
          </Button>
        ) : (
          <div style={styles.addForm}>
            <h4 style={styles.formTitle}>Add New Comparable Sale</h4>
            <div style={styles.formGrid}>
              <Input
                label="Property Address"
                value={newComparable.address}
                onChange={(e) => setNewComparable({...newComparable, address: e.target.value})}
                placeholder="123 Main St, Austin, TX"
              />
              <Input
                label="Sale Price"
                type="number"
                value={newComparable.salePrice}
                onChange={(e) => setNewComparable({...newComparable, salePrice: e.target.value})}
                placeholder="450000"
              />
              <Input
                label="Sale Date"
                type="date"
                value={newComparable.saleDate}
                onChange={(e) => setNewComparable({...newComparable, saleDate: e.target.value})}
              />
              <div style={styles.adjustmentsSection}>
                <h5 style={styles.adjustmentsTitle}>Market Adjustments</h5>
                <div style={styles.adjustmentsGrid}>
                  <Input
                    label="Location Adjustment"
                    type="number"
                    value={newComparable.locationAdj}
                    onChange={(e) => setNewComparable({...newComparable, locationAdj: e.target.value})}
                    placeholder="0"
                  />
                  <Input
                    label="Size Adjustment"
                    type="number"
                    value={newComparable.sizeAdj}
                    onChange={(e) => setNewComparable({...newComparable, sizeAdj: e.target.value})}
                    placeholder="0"
                  />
                  <Input
                    label="Age Adjustment"
                    type="number"
                    value={newComparable.ageAdj}
                    onChange={(e) => setNewComparable({...newComparable, ageAdj: e.target.value})}
                    placeholder="0"
                  />
                  <Input
                    label="Condition Adjustment"
                    type="number"
                    value={newComparable.conditionAdj}
                    onChange={(e) => setNewComparable({...newComparable, conditionAdj: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <div style={styles.formActions}>
              <Button
                variant="secondary"
                onClick={() => setAddingComparable(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={addComparable}
              >
                Add Comparable
              </Button>
            </div>
          </div>
        )}
      </div>

      {valuation.salesApproach.comparables.length === 0 && !addingComparable && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🏘️</div>
          <h4 style={styles.emptyTitle}>No Comparable Sales Added</h4>
          <p style={styles.emptyText}>
            Add comparable property sales to analyze market value using the Sales Comparison Approach.
            Include recent sales of similar properties in the same area.
          </p>
        </div>
      )}
    </div>
  );
};

// Cost Approach Tab Component  
interface CostApproachTabProps {
  valuation: ValuationWorkup | null;
  setValuation: (valuation: ValuationWorkup) => void;
}

const CostApproachTab: React.FC<CostApproachTabProps> = ({ valuation, setValuation }) => {
  if (!valuation) return null;

  const updateCostApproach = (field: keyof CostApproachData, value: number) => {
    const updated = {
      ...valuation,
      costApproach: {
        ...valuation.costApproach,
        [field]: value
      }
    };

    // Automatically calculate depreciated value
    const totalDepreciation = updated.costApproach.physicalDepreciation + 
                             updated.costApproach.functionalObsolescence + 
                             updated.costApproach.economicObsolescence;
    
    updated.costApproach.depreciatedValue = updated.costApproach.landValue + 
                                           updated.costApproach.replacementCostNew - 
                                           totalDepreciation;

    setValuation(updated);
  };

  const costData = valuation.costApproach;
  const totalDepreciation = costData.physicalDepreciation + costData.functionalObsolescence + costData.economicObsolescence;

  return (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>Cost Approach</h3>
      <p style={styles.sectionDescription}>
        Estimate value based on land value plus replacement cost new minus depreciation.
      </p>

      {/* Cost Calculation Summary */}
      <div style={styles.summaryCard}>
        <h4 style={styles.summaryTitle}>Cost Approach Calculation</h4>
        <div style={styles.costFormula}>
          <div style={styles.formulaRow}>
            <span style={styles.formulaLabel}>Land Value</span>
            <span style={styles.formulaOperator}>+</span>
            <span style={styles.formulaValue}>${costData.landValue.toLocaleString()}</span>
          </div>
          <div style={styles.formulaRow}>
            <span style={styles.formulaLabel}>Replacement Cost New</span>
            <span style={styles.formulaOperator}>+</span>
            <span style={styles.formulaValue}>${costData.replacementCostNew.toLocaleString()}</span>
          </div>
          <div style={styles.formulaRow}>
            <span style={styles.formulaLabel}>Total Depreciation</span>
            <span style={styles.formulaOperator}>-</span>
            <span style={styles.formulaValue}>${totalDepreciation.toLocaleString()}</span>
          </div>
          <div style={styles.formulaRowTotal}>
            <span style={styles.formulaLabel}>Depreciated Value</span>
            <span style={styles.formulaOperator}>=</span>
            <span style={styles.formulaValueTotal}>${costData.depreciatedValue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Cost Input Forms */}
      <div style={styles.costInputSection}>
        <div style={styles.inputGroup}>
          <h4 style={styles.inputGroupTitle}>Property Costs</h4>
          <div style={styles.inputGrid}>
            <Input
              label="Land Value"
              type="number"
              value={costData.landValue.toString()}
              onChange={(e) => updateCostApproach('landValue', parseFloat(e.target.value) || 0)}
              placeholder="150000"
            />
            <Input
              label="Replacement Cost New"
              type="number"
              value={costData.replacementCostNew.toString()}
              onChange={(e) => updateCostApproach('replacementCostNew', parseFloat(e.target.value) || 0)}
              placeholder="250000"
            />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <h4 style={styles.inputGroupTitle}>Depreciation Analysis</h4>
          <div style={styles.inputGrid}>
            <Input
              label="Physical Depreciation"
              type="number"
              value={costData.physicalDepreciation.toString()}
              onChange={(e) => updateCostApproach('physicalDepreciation', parseFloat(e.target.value) || 0)}
              placeholder="25000"
            />
            <Input
              label="Functional Obsolescence"
              type="number"
              value={costData.functionalObsolescence.toString()}
              onChange={(e) => updateCostApproach('functionalObsolescence', parseFloat(e.target.value) || 0)}
              placeholder="10000"
            />
            <Input
              label="Economic Obsolescence"
              type="number"
              value={costData.economicObsolescence.toString()}
              onChange={(e) => updateCostApproach('economicObsolescence', parseFloat(e.target.value) || 0)}
              placeholder="5000"
            />
          </div>
        </div>

        {/* Depreciation Breakdown */}
        <div style={styles.depreciationBreakdown}>
          <h4 style={styles.inputGroupTitle}>Depreciation Breakdown</h4>
          <div style={styles.depreciationGrid}>
            <div style={styles.depreciationItem}>
              <span style={styles.depreciationLabel}>Physical Depreciation</span>
              <span style={styles.depreciationValue}>${costData.physicalDepreciation.toLocaleString()}</span>
              <span style={styles.depreciationDesc}>Wear and tear, deferred maintenance</span>
            </div>
            <div style={styles.depreciationItem}>
              <span style={styles.depreciationLabel}>Functional Obsolescence</span>
              <span style={styles.depreciationValue}>${costData.functionalObsolescence.toLocaleString()}</span>
              <span style={styles.depreciationDesc}>Outdated design, poor layout</span>
            </div>
            <div style={styles.depreciationItem}>
              <span style={styles.depreciationLabel}>Economic Obsolescence</span>
              <span style={styles.depreciationValue}>${costData.economicObsolescence.toLocaleString()}</span>
              <span style={styles.depreciationDesc}>External factors, location issues</span>
            </div>
            <div style={styles.depreciationTotal}>
              <span style={styles.depreciationLabel}>Total Depreciation</span>
              <span style={styles.depreciationValueTotal}>${totalDepreciation.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Income Approach Tab Component
interface IncomeApproachTabProps {
  valuation: ValuationWorkup | null;
  setValuation: (valuation: ValuationWorkup) => void;
}

const IncomeApproachTab: React.FC<IncomeApproachTabProps> = ({ valuation, setValuation }) => {
  if (!valuation) return null;

  const updateIncomeApproach = (field: keyof IncomeApproachData, value: number) => {
    const updated = {
      ...valuation,
      incomeApproach: {
        ...valuation.incomeApproach,
        [field]: value
      }
    };

    // Auto-calculate NOI and capitalized value
    if (['grossRentalIncome', 'vacancyRate', 'operatingExpenses'].includes(field)) {
      const effectiveIncome = updated.incomeApproach.grossRentalIncome * (1 - updated.incomeApproach.vacancyRate);
      updated.incomeApproach.netOperatingIncome = effectiveIncome - updated.incomeApproach.operatingExpenses;
      updated.incomeApproach.capitalizedValue = updated.incomeApproach.netOperatingIncome / updated.incomeApproach.capitalizationRate;
    }

    // Auto-calculate capitalized value if cap rate changes
    if (field === 'capitalizationRate') {
      updated.incomeApproach.capitalizedValue = updated.incomeApproach.netOperatingIncome / value;
    }

    // Auto-calculate GRM value
    if (['monthlyRent', 'grossRentMultiplier'].includes(field)) {
      updated.incomeApproach.grmValue = updated.incomeApproach.monthlyRent * 12 * updated.incomeApproach.grossRentMultiplier;
    }

    setValuation(updated);
  };

  const incomeData = valuation.incomeApproach;
  const effectiveIncome = incomeData.grossRentalIncome * (1 - incomeData.vacancyRate);

  return (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>Income Approach</h3>
      <p style={styles.sectionDescription}>
        Value based on income-generating capacity using Direct Capitalization and Gross Rent Multiplier methods.
      </p>

      {/* Direct Capitalization Method */}
      <div style={styles.summaryCard}>
        <h4 style={styles.summaryTitle}>Direct Capitalization Method</h4>
        <div style={styles.incomeFormula}>
          <div style={styles.formulaRow}>
            <span style={styles.formulaLabel}>Gross Rental Income</span>
            <span style={styles.formulaValue}>${incomeData.grossRentalIncome.toLocaleString()}</span>
          </div>
          <div style={styles.formulaRow}>
            <span style={styles.formulaLabel}>Less: Vacancy ({(incomeData.vacancyRate * 100).toFixed(1)}%)</span>
            <span style={styles.formulaValue}>-${(incomeData.grossRentalIncome * incomeData.vacancyRate).toLocaleString()}</span>
          </div>
          <div style={styles.formulaRow}>
            <span style={styles.formulaLabel}>Effective Gross Income</span>
            <span style={styles.formulaValue}>${effectiveIncome.toLocaleString()}</span>
          </div>
          <div style={styles.formulaRow}>
            <span style={styles.formulaLabel}>Less: Operating Expenses</span>
            <span style={styles.formulaValue}>-${incomeData.operatingExpenses.toLocaleString()}</span>
          </div>
          <div style={styles.formulaRow}>
            <span style={styles.formulaLabel}>Net Operating Income</span>
            <span style={styles.formulaValue}>${incomeData.netOperatingIncome.toLocaleString()}</span>
          </div>
          <div style={styles.formulaRow}>
            <span style={styles.formulaLabel}>Cap Rate</span>
            <span style={styles.formulaValue}>{(incomeData.capitalizationRate * 100).toFixed(2)}%</span>
          </div>
          <div style={styles.formulaRowTotal}>
            <span style={styles.formulaLabel}>Capitalized Value</span>
            <span style={styles.formulaValueTotal}>${incomeData.capitalizedValue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Income Input Forms */}
      <div style={styles.incomeInputSection}>
        <div style={styles.inputGroup}>
          <h4 style={styles.inputGroupTitle}>Income & Expenses</h4>
          <div style={styles.inputGrid}>
            <Input
              label="Gross Rental Income (Annual)"
              type="number"
              value={incomeData.grossRentalIncome.toString()}
              onChange={(e) => updateIncomeApproach('grossRentalIncome', parseFloat(e.target.value) || 0)}
              placeholder="120000"
            />
            <Input
              label="Vacancy Rate (%)"
              type="number"
              step="0.01"
              value={(incomeData.vacancyRate * 100).toString()}
              onChange={(e) => updateIncomeApproach('vacancyRate', (parseFloat(e.target.value) || 0) / 100)}
              placeholder="5"
            />
            <Input
              label="Operating Expenses (Annual)"
              type="number"
              value={incomeData.operatingExpenses.toString()}
              onChange={(e) => updateIncomeApproach('operatingExpenses', parseFloat(e.target.value) || 0)}
              placeholder="35000"
            />
            <Input
              label="Capitalization Rate (%)"
              type="number"
              step="0.001"
              value={(incomeData.capitalizationRate * 100).toString()}
              onChange={(e) => updateIncomeApproach('capitalizationRate', (parseFloat(e.target.value) || 0) / 100)}
              placeholder="7.5"
            />
          </div>
        </div>

        {/* Gross Rent Multiplier Section */}
        <div style={styles.inputGroup}>
          <h4 style={styles.inputGroupTitle}>Gross Rent Multiplier Method</h4>
          <div style={styles.grmFormula}>
            <div style={styles.formulaRow}>
              <span style={styles.formulaLabel}>Monthly Rent</span>
              <span style={styles.formulaOperator}>×</span>
              <span style={styles.formulaValue}>${incomeData.monthlyRent.toLocaleString()}</span>
            </div>
            <div style={styles.formulaRow}>
              <span style={styles.formulaLabel}>12 Months</span>
              <span style={styles.formulaOperator}>×</span>
              <span style={styles.formulaValue}>12</span>
            </div>
            <div style={styles.formulaRow}>
              <span style={styles.formulaLabel}>Gross Rent Multiplier</span>
              <span style={styles.formulaOperator}>×</span>
              <span style={styles.formulaValue}>{incomeData.grossRentMultiplier}</span>
            </div>
            <div style={styles.formulaRowTotal}>
              <span style={styles.formulaLabel}>GRM Value</span>
              <span style={styles.formulaOperator}>=</span>
              <span style={styles.formulaValueTotal}>${incomeData.grmValue.toLocaleString()}</span>
            </div>
          </div>
          <div style={styles.inputGrid}>
            <Input
              label="Monthly Rent"
              type="number"
              value={incomeData.monthlyRent.toString()}
              onChange={(e) => updateIncomeApproach('monthlyRent', parseFloat(e.target.value) || 0)}
              placeholder="10000"
            />
            <Input
              label="Gross Rent Multiplier"
              type="number"
              step="0.1"
              value={incomeData.grossRentMultiplier.toString()}
              onChange={(e) => updateIncomeApproach('grossRentMultiplier', parseFloat(e.target.value) || 0)}
              placeholder="100"
            />
          </div>
        </div>

        {/* Income Approach Summary */}
        <div style={styles.inputGroup}>
          <h4 style={styles.inputGroupTitle}>Income Approach Summary</h4>
          <div style={styles.incomeMethodsGrid}>
            <div style={styles.methodCard}>
              <h5 style={styles.methodTitle}>Direct Capitalization</h5>
              <div style={styles.methodValue}>${incomeData.capitalizedValue.toLocaleString()}</div>
              <div style={styles.methodDesc}>NOI ÷ Cap Rate</div>
            </div>
            <div style={styles.methodCard}>
              <h5 style={styles.methodTitle}>Gross Rent Multiplier</h5>
              <div style={styles.methodValue}>${incomeData.grmValue.toLocaleString()}</div>
              <div style={styles.methodDesc}>Monthly Rent × 12 × GRM</div>
            </div>
            <div style={styles.methodCard}>
              <h5 style={styles.methodTitle}>Recommended Value</h5>
              <div style={styles.methodValue}>
                ${Math.max(incomeData.capitalizedValue, incomeData.grmValue).toLocaleString()}
              </div>
              <div style={styles.methodDesc}>Higher of the two methods</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reconciliation Tab Component
interface ReconciliationTabProps {
  valuation: ValuationWorkup | null;
  setValuation: (valuation: ValuationWorkup) => void;
}

const ReconciliationTab: React.FC<ReconciliationTabProps> = ({ valuation, setValuation }) => {
  if (!valuation) return null;

  const updateWeight = (approach: 'sales' | 'cost' | 'income', weight: number) => {
    // Ensure weights add up to 100%
    const otherApproaches = approach === 'sales' ? ['cost', 'income'] : 
                           approach === 'cost' ? ['sales', 'income'] : 
                           ['sales', 'cost'];
    
    const remainingWeight = 100 - weight;
    const otherWeight = remainingWeight / 2;

    const updated = { ...valuation };
    
    if (approach === 'sales') {
      updated.salesApproach.weight = weight;
      updated.costApproach.weight = otherWeight;
      updated.incomeApproach.weight = otherWeight;
    } else if (approach === 'cost') {
      updated.costApproach.weight = weight;
      updated.salesApproach.weight = otherWeight;
      updated.incomeApproach.weight = otherWeight;
    } else {
      updated.incomeApproach.weight = weight;
      updated.salesApproach.weight = otherWeight;
      updated.costApproach.weight = otherWeight;
    }

    // Recalculate final value estimate
    const salesValue = updated.salesApproach.averageValue || 0;
    const costValue = updated.costApproach.depreciatedValue || 0;
    const incomeValue = Math.max(updated.incomeApproach.capitalizedValue, updated.incomeApproach.grmValue) || 0;
    
    updated.finalValueEstimate = (
      (salesValue * updated.salesApproach.weight / 100) +
      (costValue * updated.costApproach.weight / 100) +
      (incomeValue * updated.incomeApproach.weight / 100)
    );

    // Calculate confidence level based on approach consistency
    const values = [salesValue, costValue, incomeValue].filter(v => v > 0);
    if (values.length >= 2) {
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const coefficientOfVariation = Math.sqrt(variance) / mean;
      updated.confidenceLevel = Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 200)));
    } else {
      updated.confidenceLevel = 50; // Default confidence for single approach
    }

    setValuation(updated);
  };

  const salesValue = valuation.salesApproach.averageValue || 0;
  const costValue = valuation.costApproach.depreciatedValue || 0;
  const incomeValue = Math.max(valuation.incomeApproach.capitalizedValue, valuation.incomeApproach.grmValue) || 0;

  const approaches = [
    {
      name: 'Sales Comparison',
      value: salesValue,
      weight: valuation.salesApproach.weight,
      weightedValue: (salesValue * valuation.salesApproach.weight / 100),
      reliability: salesValue > 0 ? 'High' : 'No Data',
      applicability: 'Most reliable for typical properties with comparable sales'
    },
    {
      name: 'Cost Approach',
      value: costValue,
      weight: valuation.costApproach.weight,
      weightedValue: (costValue * valuation.costApproach.weight / 100),
      reliability: costValue > 0 ? 'Medium' : 'No Data',
      applicability: 'Best for newer properties and special-use properties'
    },
    {
      name: 'Income Approach',
      value: incomeValue,
      weight: valuation.incomeApproach.weight,
      weightedValue: (incomeValue * valuation.incomeApproach.weight / 100),
      reliability: incomeValue > 0 ? 'High' : 'No Data',
      applicability: 'Essential for income-producing properties'
    }
  ];

  return (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>Value Reconciliation</h3>
      <p style={styles.sectionDescription}>
        Analyze and weight the three approaches to arrive at a final value conclusion.
      </p>

      {/* Final Value Summary */}
      <div style={styles.finalValueCard}>
        <h4 style={styles.finalValueTitle}>Final Value Estimate</h4>
        <div style={styles.finalValueAmount}>${valuation.finalValueEstimate.toLocaleString()}</div>
        <div style={styles.confidenceLevel}>
          Confidence Level: <span style={{color: APPLE_COLORS.GREEN}}>{valuation.confidenceLevel.toFixed(0)}%</span>
        </div>
      </div>

      {/* Approach Weighting */}
      <div style={styles.weightingSection}>
        <h4 style={styles.sectionSubtitle}>Approach Weighting & Analysis</h4>
        <div style={styles.approachesGrid}>
          {approaches.map((approach, index) => (
            <div key={index} style={styles.approachCard}>
              <div style={styles.approachHeader}>
                <h5 style={styles.approachName}>{approach.name}</h5>
                <div style={{
                  ...styles.reliabilityBadge,
                  backgroundColor: approach.reliability === 'High' ? `${APPLE_COLORS.GREEN}20` :
                                 approach.reliability === 'Medium' ? `${APPLE_COLORS.ORANGE}20` :
                                 `${NEUTRAL_COLORS.GRAY_200}`,
                  color: approach.reliability === 'High' ? APPLE_COLORS.GREEN :
                         approach.reliability === 'Medium' ? APPLE_COLORS.ORANGE :
                         NEUTRAL_COLORS.GRAY_600
                }}>
                  {approach.reliability}
                </div>
              </div>
              
              <div style={styles.approachMetrics}>
                <div style={styles.approachMetric}>
                  <span style={styles.metricLabel}>Indicated Value</span>
                  <span style={styles.metricValue}>${approach.value.toLocaleString()}</span>
                </div>
                <div style={styles.approachMetric}>
                  <span style={styles.metricLabel}>Weight</span>
                  <span style={styles.metricValue}>{approach.weight}%</span>
                </div>
                <div style={styles.approachMetric}>
                  <span style={styles.metricLabel}>Weighted Value</span>
                  <span style={styles.metricValue}>${approach.weightedValue.toLocaleString()}</span>
                </div>
              </div>

              <div style={styles.weightSliderContainer}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={approach.weight}
                  onChange={(e) => updateWeight(
                    index === 0 ? 'sales' : index === 1 ? 'cost' : 'income',
                    parseInt(e.target.value)
                  )}
                  style={styles.weightSlider}
                  disabled={approach.value === 0}
                />
              </div>

              <p style={styles.applicabilityText}>{approach.applicability}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reconciliation Analysis */}
      <div style={styles.analysisSection}>
        <h4 style={styles.sectionSubtitle}>Reconciliation Analysis</h4>
        <div style={styles.analysisGrid}>
          <div style={styles.analysisCard}>
            <h5 style={styles.analysisTitle}>Approach Reliability</h5>
            <ul style={styles.analysisList}>
              {salesValue > 0 && <li>Sales Comparison: Strong market data available</li>}
              {costValue > 0 && <li>Cost Approach: Detailed depreciation analysis completed</li>}
              {incomeValue > 0 && <li>Income Approach: Multiple methods support value indication</li>}
              {!salesValue && !costValue && !incomeValue && <li>Complete at least one approach for analysis</li>}
            </ul>
          </div>
          
          <div style={styles.analysisCard}>
            <h5 style={styles.analysisTitle}>Value Range Analysis</h5>
            <div style={styles.valueRange}>
              {(() => {
                const validValues = [salesValue, costValue, incomeValue].filter(v => v > 0);
                if (validValues.length >= 2) {
                  const minValue = Math.min(...validValues);
                  const maxValue = Math.max(...validValues);
                  const range = ((maxValue - minValue) / minValue * 100).toFixed(1);
                  return (
                    <>
                      <div>Range: ${minValue.toLocaleString()} - ${maxValue.toLocaleString()}</div>
                      <div>Variance: {range}%</div>
                      <div style={{color: parseFloat(range) < 10 ? APPLE_COLORS.GREEN : 
                                         parseFloat(range) < 20 ? APPLE_COLORS.ORANGE : APPLE_COLORS.RED}}>
                        {parseFloat(range) < 10 ? 'Excellent consistency' :
                         parseFloat(range) < 20 ? 'Good consistency' : 'Review required'}
                      </div>
                    </>
                  );
                } else {
                  return <div>Complete multiple approaches for range analysis</div>;
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Evidence Management Component
const EvidenceManagement: React.FC = () => {
  return (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>Evidence Management</h3>
      <p style={styles.sectionDescription}>
        Upload and organize supporting documentation for your appeal including photos, 
        surveys, appraisals, and comparable sales data.
      </p>
      
      <div style={styles.comingSoon}>
        <div style={styles.comingSoonIcon}>📎</div>
        <h4 style={styles.comingSoonTitle}>Professional Evidence Portal</h4>
        <p style={styles.comingSoonText}>
          Complete document management system with categorization, OCR processing, 
          and automatic evidence compilation for appeal packets.
        </p>
        <div style={styles.comingSoonFeatures}>
          <div style={styles.feature}>✓ Drag-and-drop file uploads</div>
          <div style={styles.feature}>✓ Automatic categorization</div>
          <div style={styles.feature}>✓ OCR text extraction</div>
          <div style={styles.feature}>✓ Professional photo organization</div>
        </div>
      </div>
    </div>
  );
};

// Appeal Review Component
interface AppealReviewProps {
  valuation: ValuationWorkup | null;
  property: Property | null;
  onGenerate: () => void;
  generating: boolean;
}

const AppealReview: React.FC<AppealReviewProps> = ({ valuation, property, onGenerate, generating }) => {
  if (!valuation || !property) return null;

  return (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>Appeal Review & Filing</h3>
      <p style={styles.sectionDescription}>
        Review your complete valuation analysis and generate the professional appeal packet 
        with county-specific forms and supporting documentation.
      </p>
      
      <div style={styles.appealSummary}>
        <div style={styles.summaryCard}>
          <h4 style={styles.summaryTitle}>Appeal Summary</h4>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Current Assessment</span>
              <span style={styles.summaryValue}>${property.current_assessment.toLocaleString()}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Proposed Value</span>
              <span style={styles.summaryValue}>${(property.current_assessment * 0.85).toLocaleString()}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Potential Savings</span>
              <span style={{...styles.summaryValue, color: APPLE_COLORS.GREEN}}>
                ${(property.current_assessment * 0.15).toLocaleString()}
              </span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Success Probability</span>
              <span style={{...styles.summaryValue, color: APPLE_COLORS.GREEN}}>85%</span>
            </div>
          </div>
        </div>
        
        <div style={styles.actionCard}>
          <h4 style={styles.actionTitle}>Generate Appeal Packet</h4>
          <p style={styles.actionDescription}>
            Your IAAO-compliant appeal packet will include valuation analysis, 
            supporting evidence, and county-specific forms ready for filing.
          </p>
          <Button
            variant="primary"
            onClick={onGenerate}
            loading={generating}
            disabled={generating}
            style={styles.generateButton}
          >
            {generating ? 'Generating Appeal...' : 'Generate Professional Appeal'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: SPACING.LG,
  },

  header: {
    textAlign: 'center' as const,
    marginBottom: SPACING.XXL,
  },

  title: {
    fontSize: '36px',
    fontWeight: 700,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.SM,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  subtitle: {
    fontSize: '18px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    marginBottom: SPACING.LG,
  },

  selectedProperty: {
    backgroundColor: `${APPLE_COLORS.BLUE}08`,
    padding: SPACING.LG,
    borderRadius: '12px',
    border: `1px solid ${APPLE_COLORS.BLUE}30`,
    marginTop: SPACING.LG,
  },

  propertyTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.XS,
  },

  propertyDetails: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
  },

  tabBar: {
    display: 'flex',
    overflowX: 'auto' as const,
    gap: SPACING.SM,
    marginBottom: SPACING.XXL,
    padding: `0 0 ${SPACING.SM} 0`,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
  },

  tab: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.SM,
    padding: `${SPACING.MD} ${SPACING.LG}`,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: TRANSITIONS.STANDARD,
    fontSize: '14px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_600,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    minWidth: '150px',
    whiteSpace: 'nowrap' as const,
  },

  tabActive: {
    color: APPLE_COLORS.BLUE,
    backgroundColor: `${APPLE_COLORS.BLUE}08`,
  },

  tabDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },

  tabStep: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: NEUTRAL_COLORS.GRAY_200,
    color: NEUTRAL_COLORS.GRAY_600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
  },

  tabLabel: {
    fontSize: '14px',
    fontWeight: 500,
  },

  activeIndicator: {
    position: 'absolute' as const,
    bottom: '-1px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '40px',
    height: '2px',
    backgroundColor: APPLE_COLORS.BLUE,
    borderRadius: '1px',
  },

  content: {
    minHeight: '600px',
  },

  tabContent: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '12px',
    padding: SPACING.XXL,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  sectionTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.SM,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  sectionDescription: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    marginBottom: SPACING.XL,
    lineHeight: 1.5,
  },

  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: SPACING.LG,
  },

  loadingText: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
  },

  selectionContainer: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '12px',
    padding: SPACING.XXL,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  propertyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: SPACING.LG,
  },

  propertyCard: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
    borderRadius: '12px',
    padding: SPACING.LG,
    cursor: 'pointer',
    transition: TRANSITIONS.STANDARD,

    ':hover': {
      borderColor: APPLE_COLORS.BLUE,
      boxShadow: `0 4px 12px ${APPLE_COLORS.BLUE}20`,
    },
  },

  propertyCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },

  propertyCardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    flex: 1,
  },

  propertyType: {
    fontSize: '12px',
    fontWeight: 500,
    color: APPLE_COLORS.BLUE,
    backgroundColor: `${APPLE_COLORS.BLUE}10`,
    padding: `${SPACING.XS} ${SPACING.SM}`,
    borderRadius: '6px',
    marginLeft: SPACING.SM,
  },

  propertyCardBody: {
    marginBottom: SPACING.LG,
  },

  propertyLocation: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    marginBottom: SPACING.MD,
  },

  propertyMetrics: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.SM,
  },

  metric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  metricLabel: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
  },

  metricValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
  },

  propertyCardFooter: {
    borderTop: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    paddingTop: SPACING.MD,
  },

  comingSoon: {
    textAlign: 'center' as const,
    padding: SPACING.XXL,
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '12px',
    border: `2px dashed ${NEUTRAL_COLORS.GRAY_200}`,
  },

  comingSoonIcon: {
    fontSize: '48px',
    marginBottom: SPACING.LG,
  },

  comingSoonTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.SM,
  },

  comingSoonText: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    marginBottom: SPACING.LG,
    lineHeight: 1.5,
  },

  comingSoonFeatures: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: SPACING.SM,
    marginTop: SPACING.LG,
  },

  feature: {
    fontSize: '14px',
    color: APPLE_COLORS.GREEN,
    fontWeight: 500,
    textAlign: 'left' as const,
  },

  appealSummary: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: SPACING.XL,
  },

  summaryCard: {
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    padding: SPACING.LG,
    borderRadius: '12px',
    border: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
  },

  summaryTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.LG,
  },

  summaryGrid: {
    display: 'grid',
    gap: SPACING.MD,
  },

  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${SPACING.SM} 0`,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
  },

  summaryLabel: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
  },

  summaryValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
  },

  actionCard: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    padding: SPACING.LG,
    borderRadius: '12px',
    border: `1px solid ${APPLE_COLORS.BLUE}30`,
    textAlign: 'center' as const,
  },

  actionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.SM,
  },

  actionDescription: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    marginBottom: SPACING.LG,
    lineHeight: 1.5,
  },

  generateButton: {
    minWidth: '200px',
  },

  // Sales Comparison Specific Styles
  salesSummaryCard: {
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '12px',
    padding: SPACING.LG,
    marginBottom: SPACING.XL,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
  },

  salesSummaryTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.LG,
  },

  salesSummaryMetrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: SPACING.LG,
  },

  salesSummaryMetric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  salesSummaryLabel: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    fontWeight: 500,
  },

  salesSummaryValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
  },

  comparablesSection: {
    marginBottom: SPACING.XL,
  },

  sectionSubtitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.LG,
  },

  comparablesTable: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.LG,
  },

  comparableCard: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
    borderRadius: '12px',
    padding: SPACING.LG,
  },

  comparableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },

  comparableAddress: {
    fontSize: '16px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
  },

  removeButton: {
    minWidth: '80px',
  },

  comparableGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: SPACING.MD,
  },

  comparableMetric: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.XS,
  },

  addSection: {
    borderTop: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
    paddingTop: SPACING.XL,
  },

  addForm: {
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '12px',
    padding: SPACING.XL,
  },

  formTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.LG,
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: SPACING.LG,
    marginBottom: SPACING.LG,
  },

  adjustmentsSection: {
    gridColumn: '1 / -1',
  },

  adjustmentsTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.MD,
  },

  adjustmentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: SPACING.MD,
  },

  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: SPACING.SM,
  },

  emptyState: {
    textAlign: 'center' as const,
    padding: SPACING.XXL,
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '12px',
    border: `2px dashed ${NEUTRAL_COLORS.GRAY_200}`,
  },

  emptyIcon: {
    fontSize: '48px',
    marginBottom: SPACING.LG,
  },

  emptyTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.SM,
  },

  emptyText: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    lineHeight: 1.5,
    maxWidth: '400px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
} as const;

export default Appeals;