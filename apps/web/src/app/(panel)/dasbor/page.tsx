"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Notice } from "@/components/ui/Notice";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { rupiah, tanggal } from "@/lib/format";
import { can } from "@/lib/permissions";
import { OrderSummary, OrderStatus } from "@/lib/types";
import { useApi } from "@/lib/use-api";

export default function DashboardPage() {
  const request = useApi();
  const { user, permissions } = useAuth();
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    request<OrderSummary>("/orders/summary")
      .then(setSummary)
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : "Gagal memuat dasbor"));
  }, [request]);

  const pending = summary?.counts.PENDING_PICKUP ?? 0;
  const picked = summary?.counts.DONE_PICKUP ?? 0;
  const completed = summary?.counts.COMPLETED ?? 0;
  const total = pending + picked + completed;
  const today = new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(new Date());

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{today}</p>
          <h1 className="mt-1 text-[1.7rem] font-semibold tracking-tight text-ink">Halo, {user?.name}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Ringkasan pesanan yang menunggu diambil, sudah diambil, dan sudah selesai.
          </p>
        </div>
        {can(permissions, "ORDER_CREATE") ? (
          <Link href="/order?baru=1" className="rounded-lg bg-[#16325c] px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#10243e]">
            + Order baru
          </Link>
        ) : (
          <Link href="/order" className="rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink hover:bg-slate-50">
            Lihat pesanan
          </Link>
        )}
      </div>

      {error ? <Notice>{error}</Notice> : null}

      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Menunggu diambil" value={pending} hint="Perlu diambil di lapangan" tone="blue" />
        <Metric label="Sudah diambil" value={picked} hint="Menunggu penyelesaian admin" tone="maroon" />
        <Metric label="Selesai" value={completed} hint="Pesanan yang sudah ditutup" tone="navy" />
      </div>

      <div className="rounded-xl border border-line bg-card px-5 py-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink">Komposisi status</p>
          <p className="text-xs text-slate-500">{total} pesanan</p>
        </div>
        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100">
          {total === 0 ? null : (
            <>
              <span className="bg-pine" style={{ width: `${(pending / total) * 100}%` }} />
              <span className="bg-copper" style={{ width: `${(picked / total) * 100}%` }} />
              <span className="bg-[#16325c]" style={{ width: `${(completed / total) * 100}%` }} />
            </>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
          <Legend color="bg-pine" label="Menunggu" />
          <Legend color="bg-copper" label="Diambil" />
          <Legend color="bg-[#16325c]" label="Selesai" />
        </div>
      </div>

      {summary?.finance ? (
        <div className="grid gap-3 md:grid-cols-3">
          <Metric label="Total fee" value={rupiah(summary.finance.totalFee)} hint="Hanya terlihat admin" tone="navy" />
          <Metric label="Total harga jual" value={rupiah(summary.finance.totalSellingPrice)} hint="Akumulasi pesanan selesai" tone="navy" />
          <Metric label="Transaksi tercatat" value={summary.finance.recordedCount} hint="Sudah ada fee dan harga jual" tone="blue" />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink">Pesanan terbaru</h2>
            <p className="text-xs text-slate-500">Lima pesanan terakhir pada cakupan akun Anda</p>
          </div>
          <Link href="/order" className="text-sm font-medium text-pine hover:underline">
            Lihat semua
          </Link>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">No. Order</th>
              <th className="px-4 py-3">Toko</th>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {summary?.recent.map((order, index) => (
              <tr key={order.id} className="border-t border-line">
                <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                <td className="px-4 py-3 font-semibold">
                  <Link href={`/order/${order.id}`} className="text-pine hover:underline">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{order.store.name}</td>
                <td className="px-4 py-3 text-slate-600">{tanggal(order.createdAt)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status as OrderStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!summary?.recent.length ? <p className="px-5 py-8 text-sm text-slate-500">Belum ada pesanan.</p> : null}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number | string;
  hint: string;
  tone: "blue" | "maroon" | "navy";
}) {
  const accent = tone === "maroon" ? "bg-copper" : tone === "navy" ? "bg-[#16325c]" : "bg-pine";
  return (
    <article className="rounded-xl border border-line bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </article>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
