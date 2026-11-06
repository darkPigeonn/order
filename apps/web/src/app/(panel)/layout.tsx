"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, router, user]);

  if (!ready || !user) {
    return <main className="grid min-h-screen place-items-center text-sm text-stone-500">Memuat sesi...</main>;
  }

  return <AppShell>{children}</AppShell>;
}
