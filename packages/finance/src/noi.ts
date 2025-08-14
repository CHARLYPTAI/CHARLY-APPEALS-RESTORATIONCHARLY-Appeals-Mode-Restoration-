import type { PropertyFinancials, NOICalculation } from './types.js';

export function calculateNOI(financials: PropertyFinancials): NOICalculation {
  if (financials.grossRentalIncome < 0) {
    throw new Error('Gross rental income must be non-negative');
  }
  if (financials.operatingExpenses < 0) {
    throw new Error('Operating expenses must be non-negative');
  }
  if (financials.vacancyRate < 0 || financials.vacancyRate > 1) {
    throw new Error('Vacancy rate must be between 0 and 1');
  }

  const vacancy = financials.grossRentalIncome * financials.vacancyRate;
  const effectiveGrossIncome = financials.grossRentalIncome - vacancy;
  const netOperatingIncome = effectiveGrossIncome - financials.operatingExpenses;

  return {
    netOperatingIncome,
    effectiveGrossIncome,
    vacancy
  };
}