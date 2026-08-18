"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
  group?: string;
}

/** Cocokkan label ATAU group — label produk dipendekkan ("Antam 1g" di group "Emas"). */
export function matchesSearch(option: MultiSelectOption, search: string): boolean {
  const q = search.toLowerCase();
  return (
    option.label.toLowerCase().includes(q) || (option.group?.toLowerCase().includes(q) ?? false)
  );
}

/** Kelompokkan opsi; grup kosong (opsi tanpa group) selalu di urutan pertama. */
export function groupOptions(
  options: MultiSelectOption[]
): { group: string; items: MultiSelectOption[] }[] {
  const map = new Map<string, MultiSelectOption[]>();
  for (const o of options) {
    const g = o.group ?? "";
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(o);
  }
  return Array.from(map, ([group, items]) => ({ group, items })).sort((a, b) =>
    a.group === b.group ? 0 : a.group === "" ? -1 : b.group === "" ? 1 : 0
  );
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  iconPrefix?: string;
  allOptionLabel?: string;
  direction?: "down" | "up" | "auto";
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "All",
  searchPlaceholder = "Search...",
  searchable = false,
  iconPrefix,
  allOptionLabel,
  direction = "auto",
  className,
  disabled = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const filtered = useMemo(() => {
    if (!search) return options;
    return options.filter((o) => matchesSearch(o, search));
  }, [options, search]);

  const hasGroups = useMemo(() => options.some((o) => o.group), [options]);

  const groupedFiltered = useMemo(() => {
    if (!hasGroups) return [];
    // Opsi tanpa grup (mis. akun liquid) selalu di atas — tak dilipat, tetap 1 klik.
    return groupOptions(filtered);
  }, [filtered, hasGroups]);

  // Grup default terlipat; search membuka semua grup yang punya hasil (keunggulan vs 2 dropdown).
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const searching = search.trim().length > 0;
  // Grup dibuka kalau: sedang search, user expand manual, atau ada opsi terpilih di dalamnya
  // (biar pilihan yang sudah ada tak tersembunyi saat dropdown dibuka lagi).
  const groupsWithSelection = useMemo(() => {
    const set = new Set<string>();
    for (const o of options) if (o.group && value.includes(o.value)) set.add(o.group);
    return set;
  }, [options, value]);
  const isGroupOpen = (group: string) =>
    searching || expandedGroups.has(group) || groupsWithSelection.has(group);
  const toggleGroup = (group: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });

  const allSelected = options.length > 0 && options.every((o) => value.includes(o.value));

  const displayText = useMemo(() => {
    if (value.length === 0) return "";
    const labels = options.filter((o) => value.includes(o.value)).map((o) => o.label);
    if (labels.length <= 2) return labels.join(", ");
    return `${labels.length} dipilih`;
  }, [value, options]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
  const vh = window.innerHeight;
    const PANEL_MAX = 280; // max-h-60 (240) + search (~40)
    const spaceBelow = vh - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openAbove =
      direction === "up" ||
      (direction === "auto" && spaceBelow < PANEL_MAX && spaceAbove > spaceBelow);
    setPanelStyle(
      openAbove
        ? {
            position: "fixed",
            bottom: vh - rect.top + 4,
            left: rect.left,
            minWidth: rect.width,
            maxHeight: Math.min(spaceAbove, PANEL_MAX),
            zIndex: 9999,
          }
        : {
            position: "fixed",
            top: rect.bottom + 4,
            left: rect.left,
            minWidth: rect.width,
            maxHeight: Math.min(spaceBelow, PANEL_MAX),
            zIndex: 9999,
          }
    );
    }, [direction]);
  useLayoutEffect(() => {
    if (!isOpen) { setPanelStyle(null); return; }
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = () => updatePosition();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [isOpen, updatePosition]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setIsOpen(false);
      setSearch("");
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable) searchRef.current?.focus();
  }, [isOpen, searchable]);

  function toggle(val: string) {
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  }

  function toggleAll() {
    onChange(allSelected ? [] : options.map((o) => o.value));
  }

  function clearAll(e: React.MouseEvent) {
    e.stopPropagation();
    onChange([]);
  }

  function renderOption(opt: MultiSelectOption) {
    const selected = value.includes(opt.value);
    return (
      <button
        key={opt.value}
        type="button"
        onMouseDown={(e) => { e.preventDefault(); toggle(opt.value); }}
        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        <span
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
            selected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
          )}
        >
          {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </span>
        <span className="flex-1 truncate text-gray-800">{opt.label}</span>
      </button>
    );
  }

  const panel = mounted && isOpen && panelStyle
    ? createPortal(
        <div
          ref={panelRef}
          style={panelStyle}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg flex flex-col"
        >
          {searchable && (
            <div className="relative border-b border-gray-100 p-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-gray-200 py-1.5 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-500"
              />
            </div>
          )}
          <div className="flex-1 overflow-auto p-1">
            {allOptionLabel && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); toggleAll(); }}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-gray-100"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    allSelected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
                  )}
                >
                  {allSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
                <span className="flex-1 text-gray-800 font-medium">{allOptionLabel}</span>
              </button>
            )}
            {filtered.length > 0 ? (
              hasGroups ? (
                groupedFiltered.map(({ group, items }) => (
                  <div key={group || "__ungrouped"}>
                    {group && (
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        aria-expanded={isGroupOpen(group)}
                        className="mx-1 my-1 flex w-[calc(100%-0.5rem)] items-center gap-1.5 border-y border-gray-100 bg-gray-50 px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                      >
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-transform",
                            isGroupOpen(group) ? "rotate-0" : "-rotate-90"
                          )}
                        />
                        <span className="flex-1">{group}</span>
                        <span className="font-semibold text-gray-400">{items.length}</span>
                      </button>
                    )}
                    {(!group || isGroupOpen(group)) && items.map(renderOption)}
                  </div>
                ))
              ) : (
                filtered.map(renderOption)
              )
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                {search ? "No results" : "No options yet"}
              </div>
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setIsOpen((o) => !o); }}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "border-blue-500 ring-2 ring-blue-500/20"
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {iconPrefix && (
            <span className="shrink-0 text-base">{iconPrefix}</span>
          )}
          <span className={cn("truncate", value.length === 0 ? "text-gray-400" : "text-gray-800")}>
            {displayText || placeholder}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {value.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onMouseDown={(e) => { e.stopPropagation(); }}
              onClick={clearAll}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>
      {panel}
    </div>
  );
}

/** Thin wrapper — single-pick mode using MultiSelect internals (portal, search, groups). */
export interface SingleSelectOption {
  value: string;
  label: string;
  group?: string;
}

interface SingleSelectProps {
  options: SingleSelectOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  iconPrefix?: string;
  direction?: "down" | "up" | "auto";
  className?: string;
  disabled?: boolean;
}

export function SingleSelect({ value, onChange, direction = "auto", ...rest }: SingleSelectProps) {
  return (
    <MultiSelect
      {...rest}
      direction={direction}
      value={value ? [value] : []}
      onChange={(vals) => onChange(vals[vals.length - 1] ?? "")}
    />
  );
}
