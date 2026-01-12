"use client";

import { useRef } from 'react';
import { usePlanningStore } from "@/store/usePlanningStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileDown, FileUp, RotateCcw, FolderOpen } from "lucide-react";
import { Household } from "@/types/finance";

export default function ScenarioManager() {
  const { household, updateHousehold, resetScenario } = usePlanningStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export Logic
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(household, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const date = new Date().toISOString().split('T')[0];
    downloadAnchorNode.setAttribute("download", `ActIII_Scenario_${date}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Import Logic
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            // Basic Validation
            if (json.contributors && json.assets && json.parameters) {
                updateHousehold(json as Household);
            } else {
                alert("Invalid Scenario File format.");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to parse JSON file.");
        }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  return (
    <>
      <input 
        type="file" 
        accept=".json" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Manage Scenarios
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" />
            <span>Export to JSON</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImportClick}>
            <FileUp className="mr-2 h-4 w-4" />
            <span>Import from JSON</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={resetScenario} className="text-destructive focus:text-destructive">
            <RotateCcw className="mr-2 h-4 w-4" />
            <span>Reset to Default</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
