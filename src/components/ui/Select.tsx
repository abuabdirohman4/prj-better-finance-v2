"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  variant?: "form" | "filter";
  iconPrefix?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      placeholder,
      variant = "form",
      iconPrefix,
      className,
      required,
      id,
      ...rest
    },
    ref
  ) => {
    const isFilter = variant === "filter";

    // Group options by group field
    const ungrouped = options.filter((o) => !o.group);
    const groups: { group: string; items: SelectOption[] }[] = [];
    for (const o of options) {
      if (!o.group) continue;
      let bucket = groups.find((g) => g.group === o.group);
      if (!bucket) {
        bucket = { group: o.group, items: [] };
        groups.push(bucket);
      }
      bucket.items.push(o);
    }

    const selectEl = (
      <div className="relative">
        {iconPrefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">
            {iconPrefix}
          </span>
        )}
        <select
          ref={ref}
          id={id}
          required={required}
          className={cn(
            "w-full appearance-none rounded-lg border text-sm outline-none transition focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed pr-9",
            iconPrefix ? "pl-8" : "pl-4",
            isFilter
              ? "border-gray-300 bg-white py-2.5 text-gray-700 focus:border-blue-500 focus:ring-blue-500/20"
              : "border-gray-300 bg-white py-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {ungrouped.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {groups.map(({ group, items }) => (
            <optgroup key={group} label={group.charAt(0).toUpperCase() + group.slice(1)}>
              {items.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
        />
      </div>
    );

    if (isFilter) return selectEl;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        )}
        {selectEl}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
