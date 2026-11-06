"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { roleLabel } from "@/lib/format";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function closeOnOutside(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-account-menu]")) setOpen(false);
    }
    window.addEventListener("mousedown", closeOnOutside);
    return () => window.removeEventListener("mousedown", closeOnOutside);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" data-account-menu>
      <button
        type="button"
        className="flex items-center gap-3 rounded-lg px-1.5 py-1 text-left hover:bg-slate-50"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e8eefc] text-xs font-semibold text-pine">
          {initials(user.name)}
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink">{user.name}</span>
          <span className="block text-xs text-slate-500">{roleLabel(user.role)}</span>
        </span>
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-card">
          <Link
            href="/akun/kata-sandi"
            className="block px-4 py-2.5 text-sm font-medium text-ink hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            Ganti kata sandi
          </Link>
          <button
            type="button"
            className="block w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={logout}
          >
            Keluar
          </button>
        </div>
      ) : null}
    </div>
  );
}
