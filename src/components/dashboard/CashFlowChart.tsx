"use client";

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePlanningStore } from '@/store/usePlanningStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, showRealDollars }: any) => {
  if (active && payload && payload.length) {
    // Separate Income and Expenses
    const incomeItems = payload.filter((p: any) => p.dataKey.startsWith("Income"));
    const withdrawalItems = payload.filter((p: any) => p.dataKey.startsWith("Draw"));
    const expenseItem = payload.find((p: any) => p.dataKey === "Expenses");

    const format = (val: number) => `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val)}`;

    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-lg text-sm min-w-[200px] z-50">
        <p className="font-bold mb-2">Year {label}</p>
        
        {/* Income Section */}
        <div className="mb-3">
             <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wide">Income Sources</p>
             {incomeItems.map((entry: any, index: number) => (
                <div key={index} className="flex justify-between items-center gap-4 mb-0.5">
                   <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                       <span className="text-xs">{entry.name}</span>
                   </div>
                   <span className="font-mono font-medium text-xs">{format(entry.value)}</span>
                </div>
             ))}
             {withdrawalItems.map((entry: any, index: number) => (
                <div key={index} className="flex justify-between items-center gap-4 mb-0.5">
                   <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                       <span className="text-xs">{entry.name}</span>
                   </div>
                   <span className="font-mono font-medium text-xs">{format(entry.value)}</span>
                </div>
             ))}
        </div>

        {/* Expense Line */}
        <div className="pt-2 border-t border-border flex justify-between items-center font-bold">
            <span className="text-destructive">Total Expenses</span>
            <span>{expenseItem ? format(expenseItem.value) : '$0'}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function CashFlowChart() {
  const { household, simulationResults, showRealDollars } = usePlanningStore();

  const chartData = useMemo(() => {
    const startYear = household.parameters.startYear;
    return simulationResults.map((yearResult) => {
      const relativeYear = yearResult.year - startYear;
      const inflationFactor = showRealDollars 
        ? Math.pow(1 + household.parameters.inflation, relativeYear) 
        : 1;

      return {
        year: yearResult.year,
        // Income Stack
        "Income: Fixed": yearResult.cashFlow.income.fixedIncome / inflationFactor,
        [`Income: ${household.contributors[0]?.name || 'Primary'}`]: yearResult.cashFlow.income.salary1 / inflationFactor,
        [`Income: ${household.contributors[1]?.name || 'Spouse'}`]: yearResult.cashFlow.income.salary2 / inflationFactor,
        
        // Withdrawal Stack (Stacked on top of Income to show total "Inflow" needed)
        // Wait, standard cash flow charts usually show Income vs Expenses side by side OR
        // Income + Withdrawals = Total Inflow vs Total Outflow.
        // The prompt says "Replace the 'Income' bar with a multi-layered stack".
        // So we stack Income Sources + Portfolio Withdrawals.
        "Draw: Taxable": yearResult.cashFlow.withdrawalDetails.taxable / inflationFactor,
        "Draw: PreTax": yearResult.cashFlow.withdrawalDetails.preTax / inflationFactor,
        "Draw: Roth": yearResult.cashFlow.withdrawalDetails.roth / inflationFactor,
        "Draw: Cash": yearResult.cashFlow.withdrawalDetails.cash / inflationFactor,

        // Comparison Line (or separate bar)
        Expenses: (yearResult.cashFlow.expenses + yearResult.cashFlow.taxesPaid) / inflationFactor,
      };
    });
  }, [simulationResults, household.parameters.inflation, showRealDollars, household.contributors, household.parameters.startYear]);

  const name1 = household.contributors[0]?.name || 'Primary';
  const name2 = household.contributors[1]?.name || 'Spouse';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cash Flow Details {showRealDollars && "(Real $)"}</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="year" className="text-xs text-muted-foreground" />
            <YAxis 
                className="text-xs text-muted-foreground" 
                tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip content={<CustomTooltip showRealDollars={showRealDollars} />} cursor={{fill: 'transparent'}} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
            
            {/* The Income Stack */}
            <Bar dataKey="Income: Fixed" stackId="a" fill="#14b8a6" name="Fixed Income" />
            <Bar dataKey={`Income: ${name1}`} stackId="a" fill="#059669" name={`${name1}'s Salary`} />
            <Bar dataKey={`Income: ${name2}`} stackId="a" fill="#34d399" name={`${name2}'s Salary`} />
            
            {/* The Withdrawal Stack (Stacked on top of Income) */}
            <Bar dataKey="Draw: Cash" stackId="a" fill="#94a3b8" name="Cash Withdrawal" />
            <Bar dataKey="Draw: Taxable" stackId="a" fill="#3b82f6" name="Taxable Withdrawal" />
            <Bar dataKey="Draw: PreTax" stackId="a" fill="#f59e0b" name="PreTax Withdrawal" />
            <Bar dataKey="Draw: Roth" stackId="a" fill="#8b5cf6" name="Roth Withdrawal" />

            {/* Expenses Comparison (Separate Bar or Line? Prompt implies Bar stack. But Expenses usually = Total Inflow) */}
            {/* To compare, let's put Expenses as a separate bar stack "b" for comparison side-by-side */}
            <Bar dataKey="Expenses" stackId="b" fill="#ef4444" name="Total Expenses" />

          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}