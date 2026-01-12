"use client";

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePlanningStore } from '@/store/usePlanningStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-lg text-sm">
        <p className="font-bold mb-2">Year {label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
             <span className="text-muted-foreground">{entry.name}:</span>
             <span className="font-mono font-medium">
                ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(entry.value)}
             </span>
          </div>
        ))}
         <div className="mt-2 pt-2 border-t border-border flex justify-between gap-4 font-bold">
            <span>Total:</span>
            <span>
                ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(payload.reduce((sum: number, entry: any) => sum + entry.value, 0))}
            </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function WealthChart() {
  const { household, simulationResults, showRealDollars } = usePlanningStore();

  // Transform data for the Stacked Area Chart
  const chartData = useMemo(() => {
    const startYear = household.parameters.startYear;
    return simulationResults.map((yearResult) => {
      const relativeYear = yearResult.year - startYear;
      const inflationFactor = showRealDollars 
        ? Math.pow(1 + household.parameters.inflation, relativeYear) 
        : 1;

      // Aggregate balances by TaxType
      const balances = {
        Taxable: 0,
        PreTax: 0,
        Roth: 0,
        Cash: 0,
      };

      yearResult.endingBalances.forEach((asset) => {
        balances[asset.type] += asset.balance / inflationFactor;
      });

      return {
        year: yearResult.year,
        ...balances,
      };
    });
  }, [simulationResults, showRealDollars, household.parameters.inflation]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Portfolio Projection</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
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
                tickFormatter={(value) => `$${value / 1000000}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
                type="monotone" 
                dataKey="Cash" 
                stackId="1" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.6}
            />
            <Area 
                type="monotone" 
                dataKey="Taxable" 
                stackId="1" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.6}
            />
            <Area 
                type="monotone" 
                dataKey="PreTax" 
                stackId="1" 
                stroke="#f59e0b" 
                fill="#f59e0b" 
                fillOpacity={0.6}
            />
            <Area 
                type="monotone" 
                dataKey="Roth" 
                stackId="1" 
                stroke="#8b5cf6" 
                fill="#8b5cf6" 
                fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
