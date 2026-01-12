import { Household } from './types/finance';

export const DEFAULT_HOUSEHOLD: Household = {
  contributors: [
    {
      id: 'c1',
      name: 'John',
      currentAge: 50,
      retirementAge: 65,
      lifeExpectancy: 90,
      salary: 150000,
      salaryGrowthRate: 0.03,
    },
    {
      id: 'c2',
      name: 'Jane',
      currentAge: 48,
      retirementAge: 65,
      lifeExpectancy: 95,
      salary: 120000,
      salaryGrowthRate: 0.03,
    },
  ],
  assets: [
    {
      id: 'a1',
      ownerId: 'c1',
      name: 'John 401k',
      type: 'PreTax',
      balance: 500000,
      costBasis: 0,
      annualReturn: 0.07,
    },
    {
      id: 'a2',
      ownerId: 'c2',
      name: 'Jane 401k',
      type: 'PreTax',
      balance: 400000,
      costBasis: 0,
      annualReturn: 0.07,
    },
    {
      id: 'a3',
      ownerId: 'c1',
      name: 'Joint Brokerage',
      type: 'Taxable',
      balance: 400000,
      costBasis: 300000,
      annualReturn: 0.07,
    },
    {
      id: 'a4',
      ownerId: 'c2',
      name: 'Jane Roth IRA',
      type: 'Roth',
      balance: 200000,
      costBasis: 150000,
      annualReturn: 0.07,
    },
  ],
  fixedIncome: [
    {
      id: 'fi1',
      ownerId: 'c1',
      name: 'Pension',
      type: 'Pension',
      monthlyAmount: 4000,
      startAge: 65,
      taxable: true,
      inflationAdjusted: false,
    },
    {
      id: 'fi2',
      ownerId: 'c1',
      name: 'Social Security',
      type: 'SocialSecurity',
      monthlyAmount: 3000, // Estimated
      startAge: 67,
      taxable: true,
      inflationAdjusted: true,
    },
    {
      id: 'fi3',
      ownerId: 'c2',
      name: 'Social Security',
      type: 'SocialSecurity',
      monthlyAmount: 2500, // Estimated
      startAge: 67,
      taxable: true,
      inflationAdjusted: true,
    },
    {
      id: 'fi4',
      ownerId: 'c1',
      name: 'Rental Property',
      type: 'Rental',
      monthlyAmount: 1000,
      startAge: 50,
      endAge: 80, // Selling it later
      taxable: true,
      inflationAdjusted: true,
    }
  ],
  spending: [
    {
      id: 'sp1',
      name: 'Pre-Retirement',
      startAge: 50,
      endAge: 65,
      essential: 60000,
      discretionary: 40000,
    },
    {
      id: 'sp2',
      name: 'Active Retirement',
      startAge: 65,
      endAge: 75,
      essential: 50000,
      discretionary: 70000, // Travel etc.
    },
    {
      id: 'sp3',
      name: 'Late Retirement',
      startAge: 75,
      endAge: 95,
      essential: 50000,
      discretionary: 40000,
    },
  ],
  oneTimeExpenses: [
    {
      id: 'ote1',
      name: 'Daughter Wedding',
      year: new Date().getFullYear() + 5,
      amount: 40000,
      isEssential: false,
    },
  ],
  parameters: {
    inflation: 0.03,
    startYear: new Date().getFullYear(),
    taxRates: {
      income: 0.24,
      capitalGains: 0.15,
    },
  },
};