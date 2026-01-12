import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Household } from '@/types/finance';
import { DEFAULT_HOUSEHOLD } from '@/constants';
import { runSimulation, SimulationResult, SimulationSummary } from '@/lib/engine';

interface PlanningState {
  household: Household;
  simulationResults: SimulationResult[];
  simulationSummary: SimulationSummary;
  isStressTest: boolean;
  showRealDollars: boolean;
  updateHousehold: (newHousehold: Household) => void;
  setStressTest: (isStressTest: boolean) => void;
  setShowRealDollars: (showReal: boolean) => void;
  resetScenario: () => void;
}

export const usePlanningStore = create<PlanningState>()(
  persist(
    (set, get) => {
        // Initial Run (Default)
        const initialRun = runSimulation(DEFAULT_HOUSEHOLD, false);

        return {
            household: DEFAULT_HOUSEHOLD,
            simulationResults: initialRun.annualResults,
            simulationSummary: initialRun,
            isStressTest: false,
            showRealDollars: false,
            updateHousehold: (newHousehold: Household) => {
                const isStressTest = get().isStressTest;
                const summary = runSimulation(newHousehold, isStressTest);
                set({ 
                    household: newHousehold, 
                    simulationResults: summary.annualResults,
                    simulationSummary: summary
                });
            },
            setStressTest: (isStressTest: boolean) => {
                const household = get().household;
                const summary = runSimulation(household, isStressTest);
                set({ 
                    isStressTest, 
                    simulationResults: summary.annualResults,
                    simulationSummary: summary
                });
            },
            setShowRealDollars: (showRealDollars: boolean) => set({ showRealDollars }),
            resetScenario: () => {
                const summary = runSimulation(DEFAULT_HOUSEHOLD, false);
                set({ 
                    household: DEFAULT_HOUSEHOLD, 
                    simulationResults: summary.annualResults,
                    simulationSummary: summary,
                    isStressTest: false
                });
            }
        };
    },
    {
      name: 'act-iii-storage',
      storage: createJSONStorage(() => localStorage),
      // We only persist the "Input" (Household + UI Flags), not the calculated results.
      // We re-calculate results on hydration.
      partialize: (state) => ({ 
          household: state.household, 
          isStressTest: state.isStressTest, 
          showRealDollars: state.showRealDollars 
      }),
      onRehydrateStorage: () => (state) => {
          if (state) {
              // Re-run simulation with restored data
              const summary = runSimulation(state.household, state.isStressTest);
              state.simulationResults = summary.annualResults;
              state.simulationSummary = summary;
          }
      }
    }
  )
);
