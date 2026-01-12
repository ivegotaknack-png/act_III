"use client";

import { usePlanningStore } from "@/store/usePlanningStore";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MoneyInput } from "@/components/ui/money-input";
import { PercentInput } from "@/components/ui/percent-input";
import { Settings2, Plus, Trash2 } from "lucide-react";
import { Household, FixedIncome, SpendingPhase, Contributor, Asset, TaxType, OneTimeExpense } from "@/types/finance";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ScenarioEditor() {
  const { household, updateHousehold, isStressTest, setStressTest } = usePlanningStore();

  // Helper to deep update household
  const handleUpdate = (updater: (draft: Household) => void) => {
    const newHousehold = JSON.parse(JSON.stringify(household));
    updater(newHousehold);
    updateHousehold(newHousehold);
  };

  const parseIntSafe = (val: string) => {
      const parsed = parseInt(val);
      return isNaN(parsed) ? 0 : parsed;
  };

  const parseFloatSafe = (val: string) => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
  };

  // 1. Market Reality Handlers
  const handleInflationChange = (val: number) => {
    handleUpdate((h) => {
      h.parameters.inflation = val;
    });
  };

  const handleGlobalReturnChange = (val: number) => {
    handleUpdate((h) => {
      // Bulk update all assets
      h.assets.forEach(a => a.annualReturn = val);
    });
  };

  // 2. Family Handlers
  const handleContributorChange = (id: string, field: keyof Contributor, newVal: string | number) => {
      handleUpdate((h) => {
          const c = h.contributors.find(c => c.id === id);
          if (c) {
              // @ts-ignore
              c[field] = newVal;
          }
      });
  };

  // 3. Asset Handlers
  const handleAssetChange = (id: string, field: keyof Asset, newVal: string | number) => {
      handleUpdate((h) => {
          const asset = h.assets.find(a => a.id === id);
          if (asset) {
              // @ts-ignore
              asset[field] = newVal;
          }
      });
  };
  
  const addAsset = () => {
      handleUpdate((h) => {
          h.assets.push({
              id: `a-${Date.now()}`,
              ownerId: h.contributors[0].id,
              name: 'New Asset',
              type: 'Taxable',
              balance: 0,
              costBasis: 0,
              annualReturn: 0.07
          });
      });
  };

  const deleteAsset = (id: string) => {
      handleUpdate((h) => {
          h.assets = h.assets.filter(a => a.id !== id);
      });
  };

  // 4. Income Handlers
  const handleIncomeChange = (id: string, field: keyof FixedIncome, newVal: string | number | boolean | undefined) => {
      handleUpdate((h) => {
          const income = h.fixedIncome.find(i => i.id === id);
          if (income) {
              // @ts-ignore
              income[field] = newVal;
          }
      });
  };

  const addIncomeSource = () => {
      handleUpdate((h) => {
          // Ensure array exists
          if (!h.fixedIncome) h.fixedIncome = [];
          
          h.fixedIncome.push({
              id: `fi-${Date.now()}`,
              ownerId: h.contributors[0].id,
              name: 'New Income',
              type: 'Pension',
              monthlyAmount: 1000,
              startAge: 65,
              endAge: undefined,
              taxable: true,
              inflationAdjusted: false,
          });
      });
  };

  const deleteIncome = (id: string) => {
      handleUpdate((h) => {
          h.fixedIncome = h.fixedIncome.filter(i => i.id !== id);
      });
  };

  // 5. Spending Handlers
  const handleSpendingChange = (id: string, field: keyof SpendingPhase, newVal: number) => {
      handleUpdate((h) => {
          const phase = h.spending.find(p => p.id === id);
          if (phase) {
              // @ts-ignore
              phase[field] = newVal;
          }
      });
  };

  // 6. Event Handlers
  const handleEventChange = (id: string, field: keyof OneTimeExpense, newVal: string | number | boolean) => {
    handleUpdate((h) => {
      const event = h.oneTimeExpenses.find(e => e.id === id);
      if (event) {
        // @ts-ignore
        event[field] = newVal;
      }
    });
  };

  const addEvent = () => {
      handleUpdate((h) => {
          h.oneTimeExpenses.push({
              id: `ote-${Date.now()}`,
              name: 'New Expense',
              year: h.parameters.startYear + 5,
              amount: 10000,
              isEssential: false
          });
      });
  };

  const deleteEvent = (id: string) => {
      handleUpdate((h) => {
          h.oneTimeExpenses = h.oneTimeExpenses.filter(e => e.id !== id);
      });
  };


  // Derived Values for Display
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Edit Scenario
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-[400px]">
        <SheetHeader>
          <SheetTitle>Edit Scenario</SheetTitle>
          <SheetDescription>
            Adjust parameters to see instant impact.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <Accordion type="single" collapsible defaultValue="family">
            
            {/* Section 0: Family & Work */}
            <AccordionItem value="family">
                <AccordionTrigger>Family & Work</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-2">
                    {household.contributors.map((c, idx) => (
                        <div key={c.id} className="space-y-3 border-b pb-4 last:border-0">
                            <div className="grid gap-2">
                                <Label htmlFor={`c-name-${c.id}`} className="text-xs text-muted-foreground uppercase">Spouse {idx + 1}</Label>
                                <Input 
                                    id={`c-name-${c.id}`}
                                    value={c.name}
                                    onChange={(e) => handleContributorChange(c.id, 'name', e.target.value)}
                                    className="font-semibold"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor={`c-age-${c.id}`} className="text-xs">Current Age</Label>
                                    <Input 
                                        id={`c-age-${c.id}`}
                                        type="number"
                                        value={c.currentAge}
                                        onChange={(e) => handleContributorChange(c.id, 'currentAge', parseIntSafe(e.target.value))}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor={`c-ret-${c.id}`} className="text-xs">Retirement Age</Label>
                                    <Input 
                                        id={`c-ret-${c.id}`}
                                        type="number"
                                        value={c.retirementAge}
                                        onChange={(e) => handleContributorChange(c.id, 'retirementAge', parseIntSafe(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor={`c-sal-${c.id}`} className="text-xs">Annual Salary ($)</Label>
                                <MoneyInput 
                                    id={`c-sal-${c.id}`}
                                    value={c.salary}
                                    onChange={(val) => handleContributorChange(c.id, 'salary', val)}
                                />
                            </div>
                            <div className="grid gap-1.5 pt-1">
                                <Label htmlFor={`c-growth-${c.id}`} className="text-xs">Salary Growth (%)</Label>
                                <PercentInput 
                                    id={`c-growth-${c.id}`}
                                    value={c.salaryGrowthRate}
                                    onChange={(val) => handleContributorChange(c.id, 'salaryGrowthRate', val)}
                                />
                            </div>
                        </div>
                    ))}
                </AccordionContent>
            </AccordionItem>


            {/* Section 1: Market Reality */}
            <AccordionItem value="market">
              <AccordionTrigger>Market Reality</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid gap-2">
                  <Label htmlFor="startYear">Start Year</Label>
                  <Input 
                    id="startYear" 
                    type="number" 
                    value={household.parameters.startYear || new Date().getFullYear()}
                    onChange={(e) => {
                        const val = parseIntSafe(e.target.value);
                        handleUpdate((h) => {
                            h.parameters.startYear = val;
                        });
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="inflation">Inflation Rate (%)</Label>
                  <PercentInput 
                    id="inflation" 
                    value={household.parameters.inflation}
                    onChange={handleInflationChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="return">Global Annual Return (%)</Label>
                  <PercentInput 
                    id="return" 
                    value={household.assets[0]?.annualReturn || 0.07} // Just a placeholder reading from first asset
                    onChange={handleGlobalReturnChange}
                  />
                  <p className="text-xs text-muted-foreground">Updates return rate for all assets.</p>
                </div>
                
                <div className="flex items-center space-x-2 pt-2 border-t mt-4">
                    <Switch 
                        id="stress-test" 
                        checked={isStressTest}
                        onCheckedChange={setStressTest}
                    />
                    <Label htmlFor="stress-test">Simulate 2008 Crash</Label>
                </div>
                {isStressTest && (
                    <p className="text-xs text-destructive mt-1">
                        Overrides returns for first 3 years: -37%, +26%, +15%.
                    </p>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Section 2: Assets */}
            <AccordionItem value="assets">
              <AccordionTrigger>Assets</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                {household.assets.map((asset) => (
                  <div key={asset.id} className="space-y-3 border-b pb-3 last:border-0 relative group">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-0 top-0 h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteAsset(asset.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid gap-1.5 pr-8">
                        <Label htmlFor={`asset-name-${asset.id}`} className="text-xs text-muted-foreground">Name</Label>
                        <Input 
                            id={`asset-name-${asset.id}`}
                            value={asset.name}
                            onChange={(e) => handleAssetChange(asset.id, 'name', e.target.value)}
                            className="h-8"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                         <div className="grid gap-1.5">
                             <Label className="text-xs text-muted-foreground">Type</Label>
                             <Select 
                                value={asset.type} 
                                onValueChange={(val) => handleAssetChange(asset.id, 'type', val)}
                             >
                                <SelectTrigger className="h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Taxable">Taxable</SelectItem>
                                    <SelectItem value="PreTax">PreTax (401k)</SelectItem>
                                    <SelectItem value="Roth">Roth</SelectItem>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                </SelectContent>
                             </Select>
                         </div>
                         <div className="grid gap-1.5">
                             <Label htmlFor={`asset-bal-${asset.id}`} className="text-xs text-muted-foreground">Balance</Label>
                             <MoneyInput 
                                id={`asset-bal-${asset.id}`}
                                value={asset.balance}
                                onChange={(val) => handleAssetChange(asset.id, 'balance', val)}
                                className="h-8"
                             />
                         </div>
                    </div>
                    <div className="grid gap-1.5 pt-1">
                        <Label htmlFor={`asset-ret-${asset.id}`} className="text-xs text-muted-foreground">Exp. Return (%)</Label>
                        <PercentInput 
                            id={`asset-ret-${asset.id}`}
                            value={asset.annualReturn}
                            onChange={(val) => handleAssetChange(asset.id, 'annualReturn', val)}
                            className="h-8"
                        />
                    </div>
                  </div>
                ))}
                <Button variant="secondary" size="sm" className="w-full mt-2" onClick={addAsset}>
                    <Plus className="h-4 w-4 mr-2" /> Add Asset
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* Section 4: Income Sources */}
            <AccordionItem value="income">
                <AccordionTrigger>Income Sources</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                    {household.fixedIncome.map((income) => (
                        <div key={income.id} className="space-y-3 border-b pb-3 last:border-0 relative">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-0 top-0 h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteIncome(income.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                             <div className="grid gap-1.5 pr-8">
                                 <Label className="text-xs text-muted-foreground">Name</Label>
                                 <Input 
                                     value={income.name}
                                     onChange={(e) => handleIncomeChange(income.id, 'name', e.target.value)}
                                     className="h-8"
                                 />
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Type</Label>
                                    <Select 
                                        value={income.type} 
                                        onValueChange={(val) => handleIncomeChange(income.id, 'type', val)}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pension">Pension</SelectItem>
                                            <SelectItem value="SocialSecurity">Social Security</SelectItem>
                                            <SelectItem value="Annuity">Annuity</SelectItem>
                                            <SelectItem value="Rental">Rental</SelectItem>
                                            <SelectItem value="Consulting">Consulting</SelectItem>
                                            <SelectItem value="Windfall">Windfall</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor={`inc-amt-${income.id}`} className="text-xs">Monthly ($)</Label>
                                    <MoneyInput 
                                        id={`inc-amt-${income.id}`}
                                        value={income.monthlyAmount}
                                        onChange={(val) => handleIncomeChange(income.id, 'monthlyAmount', val)}
                                        className="h-8"
                                    />
                                </div>
                             </div>
                             <div className="grid gap-1.5">
                                <Label htmlFor={`inc-start-${income.id}`} className="text-xs">Start Age</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        id={`inc-start-${income.id}`}
                                        type="number"
                                        placeholder="Start"
                                        value={income.startAge}
                                        onChange={(e) => handleIncomeChange(income.id, 'startAge', parseFloatSafe(e.target.value))}
                                        className="h-8"
                                    />
                                    <Input 
                                        id={`inc-end-${income.id}`}
                                        type="number"
                                        placeholder="Life"
                                        value={income.endAge || ''}
                                        onChange={(e) => handleIncomeChange(income.id, 'endAge', e.target.value ? parseFloatSafe(e.target.value) : undefined)}
                                        className="h-8"
                                    />
                                </div>
                             </div>
                        </div>
                    ))}
                    <Button variant="secondary" size="sm" className="w-full mt-2" onClick={addIncomeSource}>
                        <Plus className="h-4 w-4 mr-2" /> Add Income Stream
                    </Button>
                </AccordionContent>
            </AccordionItem>

            {/* Section 5: Spending Plan */}
            <AccordionItem value="spending">
                <AccordionTrigger>Spending Plan</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                     {household.spending.map((phase) => (
                         <div key={phase.id} className="space-y-2 border-b pb-2 last:border-0">
                             <Label className="font-semibold">{phase.name}</Label>
                             <div className="grid grid-cols-2 gap-2">
                                 <div className="grid gap-1">
                                     <Label htmlFor={`spd-start-${phase.id}`} className="text-xs">Start</Label>
                                     <Input 
                                         id={`spd-start-${phase.id}`}
                                         type="number"
                                         value={phase.startAge}
                                         onChange={(e) => handleSpendingChange(phase.id, 'startAge', parseFloatSafe(e.target.value))}
                                     />
                                 </div>
                                 <div className="grid gap-1">
                                     <Label htmlFor={`spd-end-${phase.id}`} className="text-xs">End</Label>
                                     <Input 
                                         id={`spd-end-${phase.id}`}
                                         type="number"
                                         value={phase.endAge}
                                         onChange={(e) => handleSpendingChange(phase.id, 'endAge', parseFloatSafe(e.target.value))}
                                     />
                                 </div>
                             </div>
                             <div className="grid gap-1">
                                 <Label htmlFor={`spd-ess-${phase.id}`} className="text-xs">Essential (Needs)</Label>
                                 <MoneyInput 
                                     id={`spd-ess-${phase.id}`}
                                     value={phase.essential}
                                     onChange={(val) => handleSpendingChange(phase.id, 'essential', val)}
                                 />
                             </div>
                             <div className="grid gap-1">
                                 <Label htmlFor={`spd-disc-${phase.id}`} className="text-xs">Discretionary (Wants)</Label>
                                 <MoneyInput 
                                     id={`spd-disc-${phase.id}`}
                                     value={phase.discretionary}
                                     onChange={(val) => handleSpendingChange(phase.id, 'discretionary', val)}
                                 />
                             </div>
                         </div>
                     ))}
                </AccordionContent>
            </AccordionItem>

            {/* Section 3: Life Events */}
            <AccordionItem value="events">
              <AccordionTrigger>Life Events</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                {household.oneTimeExpenses.map((event) => (
                  <div key={event.id} className="space-y-3 border-b pb-3 last:border-0 relative">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-0 top-0 h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteEvent(event.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid gap-1.5 pr-8">
                         <Label className="text-xs text-muted-foreground">Event Name</Label>
                         <Input 
                             value={event.name}
                             onChange={(e) => handleEventChange(event.id, 'name', e.target.value)}
                             className="h-8"
                         />
                     </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-1">
                        <Label htmlFor={`evt-year-${event.id}`} className="text-xs">Calendar Year</Label>
                        <Input 
                          id={`evt-year-${event.id}`}
                          type="number"
                          value={event.year}
                          onChange={(e) => handleEventChange(event.id, 'year', parseFloatSafe(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor={`evt-amt-${event.id}`} className="text-xs">Cost ($)</Label>
                        <MoneyInput 
                          id={`evt-amt-${event.id}`}
                          value={event.amount}
                          onChange={(val) => handleEventChange(event.id, 'amount', val)}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                        <Switch 
                            id={`evt-ess-${event.id}`}
                            checked={event.isEssential}
                            onCheckedChange={(val) => handleEventChange(event.id, 'isEssential', val)}
                        />
                        <Label htmlFor={`evt-ess-${event.id}`} className="text-xs">Is Essential?</Label>
                    </div>
                  </div>
                ))}
                <Button variant="secondary" size="sm" className="w-full mt-2" onClick={addEvent}>
                    <Plus className="h-4 w-4 mr-2" /> Add Event
                </Button>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}
