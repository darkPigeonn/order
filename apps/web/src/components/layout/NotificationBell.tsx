"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { tanggal } from "@/lib/format";
import { Paginated } from "@/lib/types";
import { useApi } from "@/lib/use-api";

interface NoticeItem {
  id: string;
  title: string;
  message: string;
  orderId: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const request = useApi();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<NoticeItem[]>([]);

  async function refresh() {
    const [count, list] = await Promise.all([
      request<{ total: number }>("/notifications/unread-count"),
      request<Paginated<NoticeItem>>("/notifications?read=unread&limit=5&sortBy=createdAt&sortDir=desc"),
    ]);
    setTotal(count.total);
    setItems(list.data);
  }

  useEffect(() => {
    refresh().catch(() => undefined);
    const timer = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, request]);

  async function openItem(item: NoticeItem) {
    await request(`/notifications/${item.id}/read`, { method: "POST" });
    setOpen(false);
    await refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifikasi"
        className="relative grid h-10 w-10 place-items-center text-ink hover:text-pine"
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 17a2.5 2.5 0 0 0 5 0" />
        </svg>
        {total > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-copper px-1.5 text-[11px] font-semibold text-white">
            {total}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <div className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">Belum dibaca</div>
          {items.length === 0 ? <p className="px-4 py-5 text-sm text-slate-500">Tidak ada notifikasi baru.</p> : null}
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.orderId ? `/order/${item.orderId}` : "/notifikasi"}
              className="block border-b border-line px-4 py-3 hover:bg-slate-50"
              onClick={() => void openItem(item)}
            >
              <p className="text-sm font-medium text-ink">{item.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.message}</p>
              <p className="mt-1 text-[11px] text-slate-400">{tanggal(item.createdAt)}</p>
            </Link>
          ))}
          <Link href="/notifikasi" className="block px-4 py-3 text-sm font-medium text-pine hover:bg-slate-50" onClick={() => setOpen(false)}>
            Lihat semua
          </Link>
        </div>
      ) : null}
    </div>
  );
}
