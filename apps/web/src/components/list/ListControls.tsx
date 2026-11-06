import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { SortDir } from "@/lib/use-paged-list";

export function ListControls({
  search,
  onSearch,
  placeholder,
  filters,
  page,
  totalPages,
  total,
  onPage,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  filters?: ReactNode;
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <input value={search} placeholder={placeholder} onChange={(event) => onSearch(event.target.value)} />
        {filters ? <div className="flex flex-wrap gap-2 md:justify-end [&_select]:w-auto [&_select]:min-w-44">{filters}</div> : null}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-500">
          {total} data · halaman {page} dari {Math.max(totalPages, 1)}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>Sebelumnya</Button>
          <Button variant="ghost" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Berikutnya</Button>
        </div>
      </div>
    </div>
  );
}

export function SortHeader({
  label,
  field,
  sortBy,
  sortDir,
  onSort,
}: {
  label: string;
  field: string;
  sortBy: string;
  sortDir: SortDir;
  onSort: (field: string) => void;
}) {
  const active = sortBy === field;
  const mark = active ? (sortDir === "asc" ? "↑" : "↓") : "";
  return (
    <th className="px-4 py-3">
      <button
        type="button"
        className={`text-xs font-semibold uppercase tracking-wide ${active ? "text-ink" : "text-slate-500 hover:text-ink"}`}
        onClick={() => onSort(field)}
      >
        {label} {mark}
      </button>
    </th>
  );
}
