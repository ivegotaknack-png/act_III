import Decimal from 'decimal.js';
import { Household, Asset, TaxType } from '@/types/finance';

export interface SimulationResult {
  year: number;
  ages: Record<string, number>;
  totalPortfolioValue: number;
  cashFlow: {
    income: {
        salary1: number;
        salary2: number;
        fixedIncome: number;
    };
    expenses: {
        essential: number;
        discretionary: number;
        total: number;
    };
    taxesPaid: number;
    surplus: number;
    withdrawalDetails: {
        taxable: number;
        preTax: number;
        roth: number;
        cash: number;
    };
  };
  endingBalances: Asset[];
}

export interface SimulationSummary {
  annualResults: SimulationResult[];
  solventUntilAge: number; // 999 if sustainable
  initialWithdrawalRate: number;
}

/**
 * Helper to clone assets for immutable simulation steps
 */
function cloneAssets(assets: Asset[]): Asset[] {
  return assets.map((a) => ({ ...a }));
}

export function runSimulation(household: Household, isStressTest: boolean = false): SimulationSummary {
  const { contributors, fixedIncome, spending, oneTimeExpenses, parameters } = household;
  const results: SimulationResult[] = [];
  
  // Initialize Simulation State
  let currentAssets = cloneAssets(household.assets);
  const inflationRate = new Decimal(parameters.inflation ?? 0.03);
  const incomeTaxRate = new Decimal(parameters.taxRates?.income ?? 0.25);
  const capitalGainsRate = new Decimal(parameters.taxRates?.capitalGains ?? 0.15);
  const startYear = parameters.startYear ?? new Date().getFullYear();

  // We determine the "Primary" contributor for relative dating (usually the first one)
  const primaryContributor = contributors[0];
  if (!primaryContributor) return { annualResults: [], solventUntilAge: 0, initialWithdrawalRate: 0 };

  // Track Metrics
  let solventUntilAge = 999;
  let hasFailed = false;
  let initialNetNeeded = new Decimal(0);
  const initialTotalAssets = currentAssets.reduce((sum, a) => sum + a.balance, 0);

  for (let yearStep = 0; yearStep <= 50; yearStep++) {
    const yearIndex = new Decimal(yearStep);
    const calendarYear = startYear + yearStep;
    
    // 1. Time Tracking & Ages
    const currentAges: Record<string, number> = {};
    contributors.forEach((c) => {
      currentAges[c.id] = c.currentAge + yearStep;
    });

    // 2. Income Calculation
    let salary1 = new Decimal(0);
    let salary2 = new Decimal(0);
    let fixedIncomeTotal = new Decimal(0);
    
    // Salary
    contributors.forEach((c, index) => {
      const age = currentAges[c.id];
      if (age < c.retirementAge) {
        // Use individual salary growth rate, fallback to inflation if undefined (safety)
        const growthRate = c.salaryGrowthRate !== undefined ? new Decimal(c.salaryGrowthRate) : inflationRate;
        const nominalSalary = new Decimal(c.salary).times(
          new Decimal(1).plus(growthRate).pow(yearIndex)
        );
        if (index === 0) salary1 = nominalSalary;
        else salary2 = nominalSalary;
      }
    });

    // Fixed Income
    fixedIncome.forEach((fi) => {
      const owner = contributors.find(c => c.id === fi.ownerId);
      const ownerAge = owner ? currentAges[owner.id] : primaryContributor.currentAge + yearStep; // Fallback
      
      const isStarted = ownerAge >= fi.startAge;
      const isEnded = fi.endAge ? ownerAge >= fi.endAge : false;

      if (isStarted && !isEnded) {
        let annualAmount = new Decimal(fi.monthlyAmount).times(12);
        
        if (fi.inflationAdjusted) {
          annualAmount = annualAmount.times(
            new Decimal(1).plus(inflationRate).pow(yearIndex)
          );
        }
        fixedIncomeTotal = fixedIncomeTotal.plus(annualAmount);
      }
    });

    const totalIncome = salary1.plus(salary2).plus(fixedIncomeTotal);

    // 3. Expense Calculation
    let expenseEssential = new Decimal(0);
    let expenseDiscretionary = new Decimal(0);

    // Periodic Spending (Spending Phases)
    const primaryAge = currentAges[primaryContributor.id];
    let activePhase = spending.find(
      (p) => primaryAge >= p.startAge && primaryAge < p.endAge
    );

    // Fallback: If age is beyond all defined phases, use the last one
    if (!activePhase && spending.length > 0) {
        const sortedPhases = [...spending].sort((a, b) => a.startAge - b.startAge);
        const lastPhase = sortedPhases[sortedPhases.length - 1];
        if (primaryAge >= lastPhase.endAge) {
            activePhase = lastPhase;
        }
    }

    if (activePhase) {
      const inflationFactor = new Decimal(1).plus(inflationRate).pow(yearIndex);
      
      // Fallback for stale data: use annualAmount if essential/discretionary are missing
      const baseEssential = activePhase.essential ?? (activePhase as any).annualAmount ?? 0;
      const baseDiscretionary = activePhase.discretionary ?? 0;

      const nominalEssential = new Decimal(baseEssential).times(inflationFactor);
      const nominalDiscretionary = new Decimal(baseDiscretionary).times(inflationFactor);
      
      expenseEssential = expenseEssential.plus(nominalEssential);
      expenseDiscretionary = expenseDiscretionary.plus(nominalDiscretionary);
    }

    // One Time Expenses
    oneTimeExpenses.forEach((ote) => {
      if (ote.year === calendarYear) {
        const nominalOTE = new Decimal(ote.amount).times(
            new Decimal(1).plus(inflationRate).pow(yearIndex)
        );
        if (ote.isEssential) {
            expenseEssential = expenseEssential.plus(nominalOTE);
        } else {
            expenseDiscretionary = expenseDiscretionary.plus(nominalOTE);
        }
      }
    });

    const totalExpenses = expenseEssential.plus(expenseDiscretionary);

    // 4. Deficit / Surplus
    let netNeeded = totalExpenses.minus(totalIncome);

    // Capture Initial Withdrawal Need (Year 1, i.e., index 0)
    if (yearStep === 0) {
        initialNetNeeded = netNeeded.greaterThan(0) ? netNeeded : new Decimal(0);
    }

    let taxesPaidOnWithdrawals = new Decimal(0);
    const withdrawalDetails = {
      cash: new Decimal(0),
      taxable: new Decimal(0),
      preTax: new Decimal(0),
      roth: new Decimal(0)
    };

    // 5. Withdrawal Waterfall
    if (netNeeded.greaterThan(0)) {
      const bucketOrder: TaxType[] = ['Cash', 'Taxable', 'PreTax', 'Roth'];
      
      for (const bucketType of bucketOrder) {
        if (netNeeded.lessThanOrEqualTo(0)) break;

        const bucketAssets = currentAssets.filter(a => a.type === bucketType);
        
        for (const asset of bucketAssets) {
            if (netNeeded.lessThanOrEqualTo(0)) break;
            if (asset.balance <= 0) continue;

            const assetBalance = new Decimal(asset.balance);
            let withdrawalAmount = new Decimal(0);
            let cashGenerated = new Decimal(0);
            let taxGenerated = new Decimal(0);

            if (bucketType === 'Cash' || bucketType === 'Roth') {
                const take = Decimal.min(netNeeded, assetBalance);
                withdrawalAmount = take;
                cashGenerated = take;
                taxGenerated = new Decimal(0);
            } 
            else if (bucketType === 'Taxable') {
                const effectiveRate = capitalGainsRate.times(0.5);
                const grossNeeded = netNeeded.dividedBy(new Decimal(1).minus(effectiveRate));
                
                if (assetBalance.greaterThanOrEqualTo(grossNeeded)) {
                    withdrawalAmount = grossNeeded;
                    cashGenerated = netNeeded;
                    taxGenerated = grossNeeded.minus(netNeeded);
                } else {
                    withdrawalAmount = assetBalance;
                    cashGenerated = assetBalance.times(new Decimal(1).minus(effectiveRate));
                    taxGenerated = assetBalance.minus(cashGenerated);
                }
            } 
            else if (bucketType === 'PreTax') {
                const grossNeeded = netNeeded.dividedBy(new Decimal(1).minus(incomeTaxRate));

                if (assetBalance.greaterThanOrEqualTo(grossNeeded)) {
                    withdrawalAmount = grossNeeded;
                    cashGenerated = netNeeded;
                    taxGenerated = grossNeeded.minus(netNeeded);
                } else {
                    withdrawalAmount = assetBalance;
                    cashGenerated = assetBalance.times(new Decimal(1).minus(incomeTaxRate));
                    taxGenerated = assetBalance.minus(cashGenerated);
                }
            }

            // Execute Transaction
            asset.balance = assetBalance.minus(withdrawalAmount).toNumber();
            netNeeded = netNeeded.minus(cashGenerated);
            taxesPaidOnWithdrawals = taxesPaidOnWithdrawals.plus(taxGenerated);

            // Update Granular Details
            if (bucketType === 'Cash') withdrawalDetails.cash = withdrawalDetails.cash.plus(withdrawalAmount);
            if (bucketType === 'Taxable') withdrawalDetails.taxable = withdrawalDetails.taxable.plus(withdrawalAmount);
            if (bucketType === 'PreTax') withdrawalDetails.preTax = withdrawalDetails.preTax.plus(withdrawalAmount);
            if (bucketType === 'Roth') withdrawalDetails.roth = withdrawalDetails.roth.plus(withdrawalAmount);
        }
      }
    } 
    else {
        // Surplus Reinvestment
        let surplusToInvest = netNeeded.abs();
        const taxableAccount = currentAssets.find(a => a.type === 'Taxable');
        if (taxableAccount) {
            taxableAccount.balance = new Decimal(taxableAccount.balance).plus(surplusToInvest).toNumber();
        } else if (currentAssets.length > 0) {
            currentAssets[0].balance = new Decimal(currentAssets[0].balance).plus(surplusToInvest).toNumber();
        }
    }

    // 6. Growth
    currentAssets.forEach(asset => {
        const balance = new Decimal(asset.balance);
        if (balance.greaterThan(0)) {
            let rate = asset.annualReturn;
            if (isStressTest) {
                if (yearStep === 0) rate = -0.37;
                else if (yearStep === 1) rate = 0.26;
                else if (yearStep === 2) rate = 0.15;
            }
            const growth = balance.times(new Decimal(rate));
            asset.balance = balance.plus(growth).toNumber();
        }
    });

    // 7. Output
    const totalPortfolioValue = currentAssets.reduce((sum, a) => sum + a.balance, 0);
    
    if (!hasFailed && totalPortfolioValue <= 100) {
        hasFailed = true;
        solventUntilAge = currentAges[primaryContributor.id];
    }

    results.push({
        year: calendarYear,
        ages: { ...currentAges },
        totalPortfolioValue,
        cashFlow: {
            income: {
                salary1: salary1.toNumber(),
                salary2: salary2.toNumber(),
                fixedIncome: fixedIncomeTotal.toNumber()
            },
            expenses: {
                essential: expenseEssential.toNumber(),
                discretionary: expenseDiscretionary.toNumber(),
                total: totalExpenses.toNumber()
            },
            taxesPaid: taxesPaidOnWithdrawals.toNumber(),
            surplus: netNeeded.lessThan(0) ? netNeeded.abs().toNumber() : 0,
            withdrawalDetails: {
                cash: withdrawalDetails.cash.toNumber(),
                taxable: withdrawalDetails.taxable.toNumber(),
                preTax: withdrawalDetails.preTax.toNumber(),
                roth: withdrawalDetails.roth.toNumber()
            }
        },
        endingBalances: cloneAssets(currentAssets)
    });
  }

  const initialWithdrawalRate = initialTotalAssets > 0 
    ? initialNetNeeded.toNumber() / initialTotalAssets 
    : 0;

  return {
      annualResults: results,
      solventUntilAge,
      initialWithdrawalRate
  };
}
