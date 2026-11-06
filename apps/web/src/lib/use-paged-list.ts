"use client";

import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export function usePagedList(initial: { sortBy: string; sortDir: SortDir }) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState(initial.sortBy);
  const [sortDir, setSortDir] = useState<SortDir>(initial.sortDir);
  const [filters, setFilters] = useState<Record<string, string>>({});

  function search(value: string) {
    setPage(1);
    setQ(value);
  }

  function filter(key: string, value: string) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function sort(field: string) {
    setPage(1);
    if (sortBy === field) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(field);
    setSortDir("asc");
  }

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
      sortBy,
      sortDir,
    });
    if (q.trim()) params.set("q", q.trim());
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    return params.toString();
  }, [filters, page, q, sortBy, sortDir]);

  return { page, setPage, q, search, sortBy, sortDir, sort, filter, filters, query };
}

export function rowNumber(page: number, index: number, limit = 10) {
  return (page - 1) * limit + index + 1;
}
