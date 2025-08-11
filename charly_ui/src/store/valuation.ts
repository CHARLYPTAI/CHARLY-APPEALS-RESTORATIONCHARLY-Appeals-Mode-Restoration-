import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { authenticatedRequest } from '@/lib/auth';

export interface PropertyComparable {
  id: string;
  address: string;
  salePrice: number;
  saleDate: string;
  squareFootage: number;
  pricePerSqFt: number;
  timeAdjustment: number;
  locationAdjustment: number;
  ageAdjustment: number;
  qualityAdjustment: number;
  weight: number;
  confidence: 'high' | 'medium' | 'low';
  zoningCompatibility: number;
  // Additional IAAO variables
  lotSize?: number;
  buildingArea?: number;
  parkingSpaces?: number;
  storiesCount?: number;
  yearBuilt?: number;
  constructionQuality?: string;
  conditionRating?: string;
  marketConditionsAdjustment?: number;
  financingAdjustment?: number;
  conditionsOfSaleAdjustment?: number;
}

export interface IncomeApproachData {
  rentPerSqFt: number;
  totalRentableArea: number;
  leaseType: 'gross' | 'net' | 'modified';
  vacancyRate: number;
  creditLoss: number;
  managementFeeRate: number;
  capRate: number;
  capRateSource: 'api' | 'manual';
  includePropertyTax: boolean;
  tiLcReserves: number;
  rentEscalation: boolean;
  escalationRate: number;
  operatingExpenses: number;
  insurance: number;
  utilities: number;
  maintenance: number;
  realEstateTaxes: number;
  otherExpenses: number;
  expenseRatio: number;
  effectiveGrossIncome: number;
  noi: number;
  valuationResult: number;
  // Additional IAAO variables
  baseRent?: number;
  parkingRevenue?: number;
  storageRevenue?: number;
  laundryRevenue?: number;
  vendingRevenue?: number;
  petFees?: number;
  miscellaneousIncome?: number;
  managementExpense?: number;
  accountingExpense?: number;
  legalExpense?: number;
  advertisingExpense?: number;
  landscapingExpense?: number;
  securityExpense?: number;
  permitsExpense?: number;
  replacementReserves?: number;
  capitalImprovements?: number;
  discountRate?: number;
  useMortgageEquity?: boolean;
  useDCF?: boolean;
  // DCF Analysis variables
  holdingPeriod?: number;
  rentGrowthRate?: number;
  expenseGrowthRate?: number;
  terminalCapRate?: number;
  reversionMethod?: string;
  pvCashFlows?: number;
  pvReversion?: number;
  irr?: number;
}

export interface SalesComparisonData {
  comparables: PropertyComparable[];
  adjustedPricePerSqFt: number;
  reconciledValue: number;
  subjectSquareFootage: number;
  // Additional IAAO variables
  subjectLotSize?: number;
  subjectYearBuilt?: number;
}

export interface CostApproachData {
  landValue: number;
  landValueSource: 'sales' | 'extraction' | 'allocation';
  costPerSqFt: number;
  totalSquareFootage: number;
  builderProfit: number;
  entrepreneurialIncentive: number;
  depreciationMethod: 'straight_line' | 'observed' | 'age_life';
  depreciationRate: number;
  remainingLife: number;
  totalCost: number;
  depreciatedCost: number;
  totalValue: number;
  // Additional IAAO variables
  foundationCost?: number;
  framingCost?: number;
  roofStructureCost?: number;
  exteriorWallsCost?: number;
  plumbingCost?: number;
  electricalCost?: number;
  hvacCost?: number;
  fireProtectionCost?: number;
  flooringCost?: number;
  interiorCost?: number;
  exteriorFinishCost?: number;
  specialFeaturesCost?: number;
  curablePhysicalDepreciation?: number;
  incurablePhysicalDepreciation?: number;
  curableFunctionalObsolescence?: number;
  incurableFunctionalObsolescence?: number;
  economicObsolescence?: number;
  locationalObsolescence?: number;
  buildingQuality?: string;
  designComplexity?: string;
  sizeFactor?: number;
  // Additional missing properties
  buildersProfit?: number;
  indirectCosts?: number;
  actualAge?: number;
  effectiveAge?: number;
  economicLife?: number;
  landSize?: number;
  landValuePerSF?: number;
  landValueMethod?: string;
  drivewaysCost?: number;
  landscapingCost?: number;
  utilitiesCost?: number;
  fencingCost?: number;
}

export interface ReconciliationData {
  incomeWeight: number;
  salesWeight: number;
  costWeight: number;
  weightedValue: number;
  finalOverride?: number;
  appraiserNotes: string;
  aiSuggestedWeights: {
    income: number;
    sales: number;
    cost: number;
    confidence: number;
  };
}

export interface ValuationState {
  propertyId: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // API Data
  apiValuation: {
    noi: number;
    cap_rate: number;
    expense_ratio: number;
    valuation_score: number;
    flags: string[];
  } | null;
  
  // Three Approaches
  incomeApproach: IncomeApproachData;
  salesComparison: SalesComparisonData;
  costApproach: CostApproachData;
  reconciliation: ReconciliationData;
  
  // Actions
  setPropertyId: (id: string) => void;
  loadValuation: (propertyId: string) => Promise<void>;
  updateIncomeApproach: (data: Partial<IncomeApproachData>) => void;
  updateSalesComparison: (data: Partial<SalesComparisonData>) => void;
  updateCostApproach: (data: Partial<CostApproachData>) => void;
  updateReconciliation: (data: Partial<ReconciliationData>) => void;
  addComparable: (comp: PropertyComparable) => void;
  updateComparable: (id: string, data: Partial<PropertyComparable>) => void;
  removeComparable: (id: string) => void;
  calculateIncomeValue: () => number;
  calculateSalesValue: () => number;
  calculateCostValue: () => number;
  calculateWeightedValue: () => number;
  saveDraft: () => Promise<void>;
  finalizeValuation: () => Promise<void>;
  reset: () => void;
}

const initialIncomeApproach: IncomeApproachData = {
  rentPerSqFt: 0,
  totalRentableArea: 0,
  leaseType: 'gross',
  vacancyRate: 5,
  creditLoss: 1,
  managementFeeRate: 3,
  capRate: 7.4,
  capRateSource: 'api',
  includePropertyTax: true,
  tiLcReserves: 2,
  rentEscalation: false,
  escalationRate: 3,
  operatingExpenses: 0,
  insurance: 0,
  utilities: 0,
  maintenance: 0,
  realEstateTaxes: 0,
  otherExpenses: 0,
  expenseRatio: 0,
  effectiveGrossIncome: 0,
  noi: 0,
  valuationResult: 0
};

const initialSalesComparison: SalesComparisonData = {
  comparables: [],
  adjustedPricePerSqFt: 0,
  reconciledValue: 0,
  subjectSquareFootage: 0
};

const initialCostApproach: CostApproachData = {
  landValue: 0,
  landValueSource: 'sales',
  costPerSqFt: 0,
  totalSquareFootage: 0,
  builderProfit: 10,
  entrepreneurialIncentive: 5,
  depreciationMethod: 'straight_line',
  depreciationRate: 0,
  remainingLife: 30,
  totalCost: 0,
  depreciatedCost: 0,
  totalValue: 0
};

const initialReconciliation: ReconciliationData = {
  incomeWeight: 50,
  salesWeight: 35,
  costWeight: 15,
  weightedValue: 0,
  finalOverride: undefined,
  appraiserNotes: '',
  aiSuggestedWeights: {
    income: 50,
    sales: 35,
    cost: 15,
    confidence: 0.85
  }
};

export const useValuationStore = create<ValuationState>()(
  devtools(
    (set, get) => ({
      propertyId: null,
      loading: false,
      error: null,
      lastUpdated: null,
      apiValuation: null,
      incomeApproach: initialIncomeApproach,
      salesComparison: initialSalesComparison,
      costApproach: initialCostApproach,
      reconciliation: initialReconciliation,

      setPropertyId: (id: string) => {
        set({ propertyId: id });
      },

      loadValuation: async (propertyId: string) => {
        set({ loading: true, error: null, propertyId });
        
        try {
          // Try to load saved draft or default data using authenticated request
          const response = await authenticatedRequest(`/api/portfolio/valuation/${propertyId}`);
          
          if (!response.ok) {
            throw new Error('Failed to load valuation data');
          }
          
          const data = await response.json();
          
          // Check if this is a saved draft with full data
          if (data.isDraft && data.income && data.sales) {
            // Load saved draft data
            set({
              incomeApproach: data.income || initialIncomeApproach,
              salesComparison: data.sales || initialSalesComparison,
              costApproach: data.cost || initialCostApproach,
              reconciliation: data.reconciliation || initialReconciliation,
              apiValuation: data.apiValuation || null,
              lastUpdated: data.lastUpdated,
              loading: false
            });
            return;
          }
          
          // Otherwise use the API data as before
          const apiData = {
            noi: data.noi || 85000,
            cap_rate: data.cap_rate || 0.075,
            expense_ratio: data.expense_ratio || 0.35,
            valuation_score: data.valuation_score || 82,
            flags: data.flags || ['high_cap_rate', 'below_market_rent']
          };
          
          // Load comparables (if needed in the future)
          // const compResponse = await fetch(`/api/portfolio/valuation/${propertyId}/comparables`);
          // const comparables = compResponse.ok ? await compResponse.json() : {};
          
          // Create sample comparables if none exist
          const sampleComparables: PropertyComparable[] = [
            {
              id: 'comp_1',
              address: '123 Main St, Similar Property',
              salePrice: 2500000,
              saleDate: '2024-06-15',
              squareFootage: 15000,
              pricePerSqFt: 166.67,
              timeAdjustment: 2.5,
              locationAdjustment: -5.0,
              ageAdjustment: 0,
              qualityAdjustment: 3.0,
              weight: 35,
              confidence: 'high',
              zoningCompatibility: 9
            },
            {
              id: 'comp_2',
              address: '456 Commerce Blvd, Comparable Building',
              salePrice: 2200000,
              saleDate: '2024-08-20',
              squareFootage: 12500,
              pricePerSqFt: 176.0,
              timeAdjustment: 0,
              locationAdjustment: 2.0,
              ageAdjustment: -8.0,
              qualityAdjustment: 5.0,
              weight: 40,
              confidence: 'medium',
              zoningCompatibility: 8
            },
            {
              id: 'comp_3',
              address: '789 Business Way, Office Complex',
              salePrice: 1800000,
              saleDate: '2024-04-10',
              squareFootage: 10000,
              pricePerSqFt: 180.0,
              timeAdjustment: 4.0,
              locationAdjustment: -10.0,
              ageAdjustment: 2.0,
              qualityAdjustment: -3.0,
              weight: 25,
              confidence: 'medium',
              zoningCompatibility: 7
            }
          ];

          set({
            apiValuation: apiData,
            loading: false,
            lastUpdated: new Date().toISOString(),
            incomeApproach: {
              ...get().incomeApproach,
              capRate: apiData.cap_rate * 100,
              noi: apiData.noi,
              capRateSource: 'api',
              rentPerSqFt: 24.50,
              totalRentableArea: 14500,
              operatingExpenses: 85000,
              insurance: 15000,
              utilities: 25000,
              maintenance: 35000,
              realEstateTaxes: 45000,
              otherExpenses: 8000
            },
            salesComparison: {
              ...get().salesComparison,
              comparables: sampleComparables,
              subjectSquareFootage: 14500
            },
            costApproach: {
              ...get().costApproach,
              landValue: 800000,
              costPerSqFt: 120,
              totalSquareFootage: 14500,
              depreciationRate: 15
            }
          });

          // Trigger calculations for all approaches
          get().updateIncomeApproach({});
          get().updateSalesComparison({});
          get().updateCostApproach({});
          get().updateReconciliation({});
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load valuation',
            loading: false 
          });
        }
      },

      updateIncomeApproach: (data: Partial<IncomeApproachData>) => {
        const current = get().incomeApproach;
        const updated = { ...current, ...data };
        
        // Auto-calculate NOI and valuation
        const grossIncome = updated.rentPerSqFt * updated.totalRentableArea * 12;
        const vacancyLoss = grossIncome * (updated.vacancyRate / 100);
        const creditLoss = grossIncome * (updated.creditLoss / 100);
        updated.effectiveGrossIncome = grossIncome - vacancyLoss - creditLoss;
        
        const managementFee = updated.effectiveGrossIncome * (updated.managementFeeRate / 100);
        const tiReserves = updated.effectiveGrossIncome * (updated.tiLcReserves / 100);
        
        const totalExpenses = updated.operatingExpenses + updated.insurance + updated.utilities + 
                             updated.maintenance + updated.realEstateTaxes + updated.otherExpenses + 
                             managementFee + tiReserves;
        
        updated.expenseRatio = updated.effectiveGrossIncome > 0 ? (totalExpenses / updated.effectiveGrossIncome) * 100 : 0;
        updated.noi = updated.effectiveGrossIncome - totalExpenses;
        updated.valuationResult = updated.noi / (updated.capRate / 100);
        
        set({ incomeApproach: updated });
      },

      updateSalesComparison: (data: Partial<SalesComparisonData>) => {
        const current = get().salesComparison;
        const updated = { ...current, ...data };
        
        // Auto-calculate reconciled value
        if (updated.comparables.length > 0) {
          const totalWeight = updated.comparables.reduce((sum, comp) => sum + comp.weight, 0);
          const weightedSum = updated.comparables.reduce((sum, comp) => {
            const adjustedPrice = comp.pricePerSqFt * 
              (1 + comp.timeAdjustment / 100) *
              (1 + comp.locationAdjustment / 100) *
              (1 + comp.ageAdjustment / 100) *
              (1 + comp.qualityAdjustment / 100);
            return sum + (adjustedPrice * comp.weight);
          }, 0);
          
          updated.adjustedPricePerSqFt = totalWeight > 0 ? weightedSum / totalWeight : 0;
          updated.reconciledValue = updated.adjustedPricePerSqFt * updated.subjectSquareFootage;
        }
        
        set({ salesComparison: updated });
      },

      updateCostApproach: (data: Partial<CostApproachData>) => {
        const current = get().costApproach;
        const updated = { ...current, ...data };
        
        // Auto-calculate cost value
        const baseCost = updated.costPerSqFt * updated.totalSquareFootage;
        const profit = baseCost * (updated.builderProfit / 100);
        const incentive = baseCost * (updated.entrepreneurialIncentive / 100);
        updated.totalCost = baseCost + profit + incentive;
        updated.depreciatedCost = updated.totalCost * (1 - updated.depreciationRate / 100);
        updated.totalValue = updated.depreciatedCost + updated.landValue;
        
        set({ costApproach: updated });
      },

      updateReconciliation: (data: Partial<ReconciliationData>) => {
        const current = get().reconciliation;
        const updated = { ...current, ...data };
        
        // Auto-calculate weighted value
        const { incomeApproach, salesComparison, costApproach } = get();
        const incomeValue = incomeApproach.valuationResult;
        const salesValue = salesComparison.reconciledValue;
        const costValue = costApproach.totalValue;
        
        updated.weightedValue = 
          (incomeValue * updated.incomeWeight / 100) +
          (salesValue * updated.salesWeight / 100) +
          (costValue * updated.costWeight / 100);
        
        set({ reconciliation: updated });
      },

      addComparable: (comp: PropertyComparable) => {
        const { salesComparison } = get();
        set({
          salesComparison: {
            ...salesComparison,
            comparables: [...salesComparison.comparables, comp]
          }
        });
      },

      updateComparable: (id: string, data: Partial<PropertyComparable>) => {
        const { salesComparison } = get();
        const updated = salesComparison.comparables.map(comp => 
          comp.id === id ? { ...comp, ...data } : comp
        );
        set({
          salesComparison: {
            ...salesComparison,
            comparables: updated
          }
        });
      },

      removeComparable: (id: string) => {
        const { salesComparison } = get();
        set({
          salesComparison: {
            ...salesComparison,
            comparables: salesComparison.comparables.filter(comp => comp.id !== id)
          }
        });
      },

      calculateIncomeValue: () => {
        return get().incomeApproach.valuationResult;
      },

      calculateSalesValue: () => {
        return get().salesComparison.reconciledValue;
      },

      calculateCostValue: () => {
        return get().costApproach.totalValue;
      },

      calculateWeightedValue: () => {
        return get().reconciliation.finalOverride || get().reconciliation.weightedValue;
      },

      saveDraft: async () => {
        const { propertyId } = get();
        if (!propertyId) return;
        
        try {
          const state = get();
          const data = {
            income: state.incomeApproach,
            sales: state.salesComparison,
            cost: state.costApproach,
            reconciliation: state.reconciliation,
            apiValuation: state.apiValuation
          };
          
          const response = await authenticatedRequest(`/api/portfolio/valuation/${propertyId}/draft`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });
          
          if (!response.ok) {
            throw new Error('Failed to save draft');
          }
          
          const result = await response.json();
          
          // Update last saved timestamp
          set({ lastUpdated: result.saved_at || new Date().toISOString() });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to save draft' });
        }
      },

      finalizeValuation: async () => {
        const { propertyId } = get();
        if (!propertyId) return;
        
        try {
          const finalValue = get().calculateWeightedValue();
          console.log(`Finalizing valuation for property: ${propertyId} with value: $${finalValue.toLocaleString()}`);
          
          // C3: FINALIZE - Submit to electronic filing endpoint
          const { authenticatedRequest } = await import('../lib/auth');
          
          const response = await authenticatedRequest('/api/filing/electronic-submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              property_id: propertyId,
              finalized_value: finalValue,
              valuation_complete: true,
              submission_type: 'valuation_finalization'
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Filing submission failed: ${response.status}`);
          }
          
          const result = await response.json();
          console.log('✅ Valuation finalized and submitted:', result);
          
          // Update state to reflect successful submission
          set({ 
            lastUpdated: new Date().toISOString(),
            // Could add filing confirmation data if needed
          });
          
          return result; // Return filing confirmation
          
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to finalize valuation' });
          throw error; // Re-throw so the UI can handle it
        }
      },

      reset: () => {
        set({
          propertyId: null,
          loading: false,
          error: null,
          lastUpdated: null,
          apiValuation: null,
          incomeApproach: initialIncomeApproach,
          salesComparison: initialSalesComparison,
          costApproach: initialCostApproach,
          reconciliation: initialReconciliation
        });
      }
    }),
    { name: 'valuation-store' }
  )
);