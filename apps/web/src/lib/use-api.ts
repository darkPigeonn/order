"use client";

import { useCallback } from "react";
import { api } from "./api";
import { useAuth } from "./auth";

export function useApi() {
  const { token } = useAuth();

  return useCallback(
    <T,>(path: string, options: RequestInit = {}) => api<T>(path, { ...options, token }),
    [token],
  );
}
