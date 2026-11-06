"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ListControls, SortHeader } from "@/components/list/ListControls";
import { OrderFormModal } from "@/components/orders/OrderFormModal";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { tanggal } from "@/lib/format";
import { can } from "@/lib/permissions";
import { OrderRecord, OrderStatus, Paginated, Store } from "@/lib/types";
import { rowNumber, usePagedList } from "@/lib/use-paged-list";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/use-api";

export default function OrdersPage() {
  const request = useApi();
  const { permissions } = useAuth();
  const list = usePagedList({ sortBy: "createdAt", sortDir: "desc" });
  const [stores, setStores] = useState<Store[]>([]);
  const [result, setResult] = useState<Paginated<OrderRecord> | null>(null);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    request<Paginated<Store>>("/stores?limit=100&sortBy=name&sortDir=asc")
      .then((payload) => setStores(payload.data))
      .catch(() => undefined);
  }, [request]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("baru") === "1" && can(permissions, "ORDER_CREATE")) {
      setComposerOpen(true);
    }
  }, [permissions]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function closeComposer() {
    setComposerOpen(false);
    if (window.location.search.includes("baru=")) {
      window.history.replaceState(null, "", "/order");
    }
  }

  useEffect(() => {
    request<Paginated<OrderRecord>>(`/orders?${list.query}`)
      .then(setResult)
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : "Gagal memuat pesanan"));
  }, [list.query, reloadKey, request]);

  return (
    <section>
      <PageHeader
        eyebrow="Pesanan"
        title="Daftar order"
        description="User hanya melihat pesanannya sendiri. Admin dan tim lapangan memantau seluruh order."
        action={
          can(permissions, "ORDER_CREATE") ? (
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="rounded-lg bg-[#16325c] px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#10243e]"
            >
              + Order baru
            </button>
          ) : null
        }
      />
      {toast ? <Toast tone={toast.tone} message={toast.message} onClose={() => setToast(null)} /> : null}
      {error ? <Notice>{error}</Notice> : null}
      <ListControls
        search={list.q}
        onSearch={list.search}
        placeholder="Cari nomor order, penerima, atau trader"
        page={result?.meta.page ?? list.page}
        totalPages={result?.meta.totalPages ?? 1}
        total={result?.meta.total ?? 0}
        onPage={list.setPage}
        filters={
          <>
            <select value={list.filters.status ?? ""} onChange={(event) => list.filter("status", event.target.value)}>
              <option value="">Semua status</option>
              <option value="PENDING_PICKUP">Menunggu Diambil</option>
              <option value="DONE_PICKUP">Sudah Diambil</option>
              <option value="COMPLETED">Selesai</option>
            </select>
            <select value={list.filters.storeId ?? ""} onChange={(event) => list.filter("storeId", event.target.value)}>
              <option value="">Semua toko</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </>
        }
      />
      <div className="overflow-x-auto rounded-xl border border-line bg-card shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">No</th>
              <SortHeader label="No. Order" field="orderNumber" sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.sort} />
              <th className="px-4 py-3">Nomor pesanan</th>
              <th className="px-4 py-3">Penerima</th>
              <th className="px-4 py-3">Trader</th>
              <th className="px-4 py-3">Toko</th>
              <th className="px-4 py-3">Pembuat</th>
              <SortHeader label="Status" field="status" sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.sort} />
              <SortHeader label="Waktu" field="createdAt" sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.sort} />
            </tr>
          </thead>
          <tbody>
            {result?.data.map((order, index) => (
              <tr key={order.id} className="border-t border-line">
                <td className="px-4 py-3">{rowNumber(result.meta.page, index, result.meta.limit)}</td>
                <td className="px-4 py-3 font-semibold">
                  <Link href={`/order/${order.id}`} className="text-sea">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{order.customerOrderNumber || "—"}</td>
                <td className="px-4 py-3">{order.recipientName || "—"}</td>
                <td className="px-4 py-3">{order.traderName || "—"}</td>
                <td className="px-4 py-3">{order.store.name}</td>
                <td className="px-4 py-3">{order.createdBy.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status as OrderStatus} />
                </td>
                <td className="px-4 py-3">{tanggal(order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!result?.data.length ? <p className="px-4 py-8 text-sm text-slate-500">Tidak ada pesanan pada filter ini.</p> : null}
      </div>
      {composerOpen ? (
        <OrderFormModal
          onClose={closeComposer}
          onCreated={() => {
            closeComposer();
            setReloadKey((value) => value + 1);
            setToast({ tone: "success", message: "Pesanan berhasil dibuat" });
          }}
          onFailed={(message) => setToast({ tone: "error", message })}
        />
      ) : null}
    </section>
  );
}
