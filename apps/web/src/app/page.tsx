"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(user ? "/dasbor" : "/login");
  }, [ready, router, user]);

  return <main className="grid min-h-screen place-items-center text-sm text-stone-500">Membuka aplikasi...</main>;
}
