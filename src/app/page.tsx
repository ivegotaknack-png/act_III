"use client";

import ScenarioEditor from '@/components/dashboard/ScenarioEditor';
import ScenarioManager from '@/components/dashboard/ScenarioManager';
import WealthChart from '@/components/dashboard/WealthChart';
import CashFlowChart from '@/components/dashboard/CashFlowChart';
import GuardrailBadge from '@/components/dashboard/GuardrailBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlanningStore } from '@/store/usePlanningStore';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { household, simulationSummary, showRealDollars, setShowRealDollars } = usePlanningStore();
  const { solventUntilAge, initialWithdrawalRate } = simulationSummary;

  // Metric 1: Net Worth Today
  const currentNetWorth = household.assets.reduce((sum, asset) => sum + asset.balance, 0);

  // Solvency Logic
  const isSolvent = solventUntilAge >= 90; // Or 999
  const solvencyText = solventUntilAge >= 99 ? "Sustainable Forever" : `Until Age ${solventUntilAge}`;

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">Act III</h1>
          <p className="text-xl text-muted-foreground mt-2">Strategic Retirement Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2 bg-card border px-4 py-2 rounded-lg shadow-sm">
                <Switch 
                    id="real-dollars" 
                    checked={showRealDollars}
                    onCheckedChange={setShowRealDollars}
                />
                <Label htmlFor="real-dollars" className="cursor-pointer text-sm font-medium">Show Real $</Label>
            </div>
            <ScenarioManager />
            <ScenarioEditor />
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(currentNetWorth)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solvency Horizon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", !isSolvent && "text-destructive")}>
                {solvencyText}
            </div>
            <p className="text-xs text-muted-foreground">Based on current spending plan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Withdrawal Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                    {(initialWithdrawalRate * 100).toFixed(1)}%
                </div>
                <GuardrailBadge withdrawalRate={initialWithdrawalRate} isSolvent={isSolvent} />
            </div>
            <p className="text-xs text-muted-foreground">Initial annual withdrawal</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid gap-8">
        <WealthChart />
        <CashFlowChart />
      </div>
    </div>
  );
}
