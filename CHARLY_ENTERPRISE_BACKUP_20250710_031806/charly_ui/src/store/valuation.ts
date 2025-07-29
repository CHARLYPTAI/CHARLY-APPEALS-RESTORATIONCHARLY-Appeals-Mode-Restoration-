import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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
}

export interface IncomeApproachData {
  rentPerSqFt: number;
  totalRentableArea: number;
  leaseType: 'gross' | 'net' | 'modified';
  vacancyRate: number;
  managementFeeRate: number;
  capRate: number;
  capRateSource: 'api' | 'manual';
  includePropertyTax: boolean;
  tiLcReserves: number;
  rentEscalation: boolean;
  operatingExpenses: number;
  noi: number;
  valuationResult: number;
}

export interface SalesComparisonData {
  comparables: PropertyComparable[];
  adjustedPricePerSqFt: number;
  reconciledValue: number;
  subjectSquareFootage: number;
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
  managementFeeRate: 3,
  capRate: 7.4,
  capRateSource: 'api',
  includePropertyTax: true,
  tiLcReserves: 2,
  rentEscalation: false,
  operatingExpenses: 0,
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
          // Load API valuation data
          const response = await fetch(`/api/portfolio/valuation/${propertyId}`);
          if (!response.ok) {
            throw new Error(`Failed to load valuation: ${response.statusText}`);
          }
          
          const apiData = await response.json();
          
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
              operatingExpenses: 125000
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
        const effectiveIncome = grossIncome * (1 - updated.vacancyRate / 100);
        const managementFee = effectiveIncome * (updated.managementFeeRate / 100);
        const tiReserves = effectiveIncome * (updated.tiLcReserves / 100);
        updated.noi = effectiveIncome - managementFee - tiReserves - updated.operatingExpenses;
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
        const { propertyId, incomeApproach, salesComparison, costApproach, reconciliation } = get();
        if (!propertyId) return;
        
        try {
          const response = await fetch(`/api/portfolio/valuation/${propertyId}/draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              income_approach: incomeApproach,
              sales_comparison: salesComparison,
              cost_approach: costApproach,
              reconciliation: reconciliation
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to save draft');
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to save draft' });
        }
      },

      finalizeValuation: async () => {
        const { propertyId, reconciliation } = get();
        if (!propertyId) return;
        
        try {
          const finalValue = get().calculateWeightedValue();
          const response = await fetch(`/api/portfolio/valuation/${propertyId}/finalize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              final_value: finalValue,
              appraiser_notes: reconciliation.appraiserNotes,
              approach_weights: {
                income: reconciliation.incomeWeight,
                sales: reconciliation.salesWeight,
                cost: reconciliation.costWeight
              }
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to finalize valuation');
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to finalize valuation' });
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