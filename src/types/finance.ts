export type TaxType = 'Taxable' | 'PreTax' | 'Roth' | 'Cash';

export interface Contributor {
  id: string;
  name: string;
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  salary: number;
  salaryGrowthRate: number; // e.g. 0.03
}

export interface Asset {
  id: string;
  ownerId: string;
  name: string;
  type: TaxType;
  balance: number;
  costBasis: number; // Relevant for Taxable
  annualReturn: number; // e.g., 0.07 for 7%
}

export interface FixedIncome {
  id: string;
  ownerId: string;
  name: string;
  type: 'SocialSecurity' | 'Pension' | 'Annuity' | 'Rental' | 'Consulting' | 'Windfall';
  monthlyAmount: number;
  startAge: number;
  endAge?: number; // Optional, defaults to life expectancy
  taxable: boolean;
  inflationAdjusted: boolean;
}

export interface SpendingPhase {
  id: string;
  startAge: number; // Relative to primary contributor
  endAge: number;
  essential: number; // The Floor (Needs)
  discretionary: number; // The Ceiling (Wants)
  name: string;
}

export interface OneTimeExpense {
  id: string;
  year: number; // Calendar Year (e.g., 2028)
  amount: number;
  name: string;
  isEssential: boolean;
}

export interface HouseholdParameters {
  inflation: number; // e.g. 0.03
  startYear: number; // e.g. 2026
  taxRates: {
    income: number; // Simplified effective rate
    capitalGains: number;
  };
}

export interface Household {
  contributors: Contributor[];
  assets: Asset[];
  fixedIncome: FixedIncome[];
  spending: SpendingPhase[];
  oneTimeExpenses: OneTimeExpense[];
  parameters: HouseholdParameters;
}
