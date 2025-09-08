"use client";

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { TextField } from "@radix-ui/themes";
import type { ChangeEvent } from "react";

export type SearchProps = {
  value: string;
  onValueChange: (nextValue: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
};

export default function Search({
  value,
  onValueChange,
  placeholder = "Search...",
  className,
  ariaLabel = "Search",
}: SearchProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValueChange(event.target.value);
  };

  return (
    <TextField.Root
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className ?? "flex"}
    >
      <TextField.Slot side="right" className="shrink">
        <MagnifyingGlassIcon aria-hidden width="16" height="16" />
      </TextField.Slot>
    </TextField.Root>
  );
}
