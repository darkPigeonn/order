export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function resolveSort(
  sortBy: string | undefined,
  sortDir: "asc" | "desc" | undefined,
  allowed: readonly string[],
  fallback: { field: string; direction: 1 | -1 },
): Record<string, 1 | -1> {
  const field = sortBy && allowed.includes(sortBy) ? sortBy : fallback.field;
  const direction = sortBy && allowed.includes(sortBy)
    ? sortDir === "asc"
      ? 1
      : -1
    : fallback.direction;
  return { [field]: direction };
}
