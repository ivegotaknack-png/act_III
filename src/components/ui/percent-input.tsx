"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface PercentInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value: number; // e.g. 0.05 for 5%
  onChange: (value: number) => void;
}

export function PercentInput({ value, onChange, className, ...props }: PercentInputProps) {
  // We display "5.0" for 0.05
  const toDisplay = (val: number) => (val * 100).toFixed(1);
  const fromDisplay = (val: string) => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed / 100;
  };

  const [displayValue, setDisplayValue] = useState(toDisplay(value));

  // Sync with external value changes
  useEffect(() => {
    // Only update if the external value is significantly different from what we are displaying
    // This prevents cursor jumping if we are just re-formatting the same number
    const currentParsed = fromDisplay(displayValue);
    if (Math.abs(currentParsed - value) > 0.0001) {
        setDisplayValue(toDisplay(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setDisplayValue(rawVal);
    
    // Commit immediately if valid number, to allow simulation to update
    // But we don't force formatting yet.
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed)) {
        onChange(parsed / 100);
    } else if (rawVal === "") {
        onChange(0);
    }
  };

  const handleBlur = () => {
      // On blur, format nicely
      const parsed = parseFloat(displayValue);
      if (!isNaN(parsed)) {
          setDisplayValue(parsed.toFixed(1));
      } else {
          setDisplayValue("0.0");
      }
  };

  return (
    <Input
      type="number"
      step="0.1"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      {...props}
    />
  );
}
