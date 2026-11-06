"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { can, canAny } from "@/lib/permissions";
import { useAuth } from "@/lib/auth";
import { Permission } from "@/lib/types";
import { AccountMenu } from "./AccountMenu";
import { NotificationBell } from "./NotificationBell";

type NavItem = { href: string; label: string; icon: ReactNode; any?: Permission[]; permission?: Permission };

const NAV: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Operasi",
    items: [
      { href: "/dasbor", label: "Dasbor", icon: <IconGrid /> },
      { href: "/order", label: "Pesanan", icon: <IconList />, any: ["ORDER_READ_OWN", "ORDER_READ_ALL"] },
    ],
  },
  {
    label: "Master",
    items: [
      { href: "/toko", label: "Toko", icon: <IconStore />, permission: "STORE_READ" },
      { href: "/produk", label: "Produk", icon: <IconBox />, permission: "PRODUCT_READ" },
      { href: "/stok", label: "Stok", icon: <IconLayers />, permission: "STOCK_READ" },
      { href: "/pengguna", label: "Pengguna", icon: <IconUsers />, permission: "USER_READ" },
    ],
  },
  {
    label: "Akun",
    items: [{ href: "/notifikasi", label: "Notifikasi", icon: <IconBell /> }],
  },
];

const PAGE_TITLES: Array<[string, string]> = [
  ["/akun/kata-sandi", "Ganti kata sandi"],
  ["/dasbor", "Dasbor"],
  ["/order", "Pesanan"],
  ["/toko", "Toko"],
  ["/produk", "Produk"],
  ["/stok", "Stok"],
  ["/pengguna", "Pengguna"],
  ["/notifikasi", "Notifikasi"],
];

function isCurrent(href: string, pathname: string) {
  if (href === "/order") {
    return pathname === "/order" || /^\/order\/(?!baru$).+/.test(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function pageTitle(pathname: string) {
  return PAGE_TITLES.find(([href]) => isCurrent(href, pathname))?.[1] ?? "Order & Pickup";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { permissions } = useAuth();
  const groups = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.permission) return can(permissions, item.permission);
      if (item.any) return canAny(permissions, item.any);
      return true;
    }),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-[#0c1b33] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-pine text-sm font-semibold shadow-sm">OP</span>
          <div>
            <p className="text-sm font-semibold leading-tight">Order & Pickup</p>
            <p className="text-xs text-slate-400">Portal operasional</p>
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto px-3 pb-4 lg:block lg:flex-1 lg:space-y-6 lg:overflow-y-auto lg:pb-6">
          {groups.map((group) => (
            <div key={group.label} className="flex shrink-0 gap-1 lg:block">
              <p className="hidden px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 lg:block">
                {group.label}
              </p>
              <div className="flex gap-1 lg:block lg:space-y-1">
                {group.items.map((item) => {
                  const highlighted = isCurrent(item.href, pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                        highlighted ? "bg-pine text-white shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className={highlighted ? "text-white" : "text-slate-400"}>{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-white/90 px-5 py-3 backdrop-blur lg:px-8">
          <p className="text-sm font-semibold text-ink">{pageTitle(pathname)}</p>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <AccountMenu />
          </div>
        </header>
        <main className="px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </svg>
  );
}

function IconList() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
    </svg>
  );
}

function IconStore() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16v9H4zM3 10l1.5-5h15L21 10M9 19v-5h6v5" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 19v-1a3.5 3.5 0 0 0-2.5-3.35M16 5.1a3 3 0 0 1 0 5.8" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
      <path strokeLinecap="round" d="M9.5 17a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}
