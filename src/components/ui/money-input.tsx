"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface MoneyInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value: number;
  onChange: (value: number) => void;
}

export function MoneyInput({ value, onChange, className, ...props }: MoneyInputProps) {
  // Format helper
  const format = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const [displayValue, setDisplayValue] = useState(format(value));
  const [isFocused, setIsFocused] = useState(false);

  // Sync with external value changes if not being edited
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(format(value));
    }
  }, [value, isFocused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // On focus, show the raw number for easy editing
    setDisplayValue(value.toString());
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    // On blur, re-format
    setDisplayValue(format(value));
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setDisplayValue(rawVal);

    // Parse number
    const parsed = parseFloat(rawVal.replace(/[^0-9.-]/g, ""));
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else if (rawVal === "") {
        onChange(0);
    }
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      className={className}
      {...props}
    />
  );
}
