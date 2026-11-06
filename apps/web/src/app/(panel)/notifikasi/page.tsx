"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ListControls, SortHeader } from "@/components/list/ListControls";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApiError } from "@/lib/api";
import { tanggal } from "@/lib/format";
import { AppNotification, Paginated } from "@/lib/types";
import { rowNumber, usePagedList } from "@/lib/use-paged-list";
import { useApi } from "@/lib/use-api";

export default function NotificationsPage() {
  const request = useApi();
  const router = useRouter();
  const list = usePagedList({ sortBy: "createdAt", sortDir: "desc" });
  const [result, setResult] = useState<Paginated<AppNotification> | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setResult(await request<Paginated<AppNotification>>(`/notifications?${list.query}`));
  }

  useEffect(() => {
    load().catch((caught) => setError(caught instanceof ApiError ? caught.message : "Gagal memuat notifikasi"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.query, request]);

  async function openItem(item: AppNotification) {
    if (!item.readAt) {
      await request(`/notifications/${item.id}/read`, { method: "POST" });
    }
    if (item.orderId) router.push(`/order/${item.orderId}`);
    else await load();
  }

  async function markAll() {
    setError("");
    try {
      await request("/notifications/read-all", { method: "POST" });
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Gagal menandai notifikasi");
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="Kotak masuk"
        title="Notifikasi"
        description="Pemberitahuan muncul saat pesanan baru dibuat, barang sudah diambil, atau pesanan selesai."
        action={<Button variant="ghost" onClick={markAll}>Tandai semua dibaca</Button>}
      />
      {error ? <Notice>{error}</Notice> : null}
      <ListControls
        search={list.q}
        onSearch={list.search}
        placeholder="Cari judul atau pesan"
        page={result?.meta.page ?? list.page}
        totalPages={result?.meta.totalPages ?? 1}
        total={result?.meta.total ?? 0}
        onPage={list.setPage}
        filters={
          <select value={list.filters.read ?? ""} onChange={(event) => list.filter("read", event.target.value)}>
            <option value="">Semua</option>
            <option value="unread">Belum dibaca</option>
            <option value="read">Sudah dibaca</option>
          </select>
        }
      />
      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">No</th>
              <SortHeader label="Judul" field="title" sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.sort} />
              <th className="px-4 py-3">Pesan</th>
              <SortHeader label="Waktu" field="createdAt" sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.sort} />
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {result?.data.map((item, index) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{rowNumber(result.meta.page, index, result.meta.limit)}</td>
                <td className="px-4 py-3">
                  <button type="button" className="font-semibold text-sea" onClick={() => void openItem(item)}>
                    {item.title}
                  </button>
                </td>
                <td className="px-4 py-3">{item.message}</td>
                <td className="px-4 py-3">{tanggal(item.createdAt)}</td>
                <td className="px-4 py-3">{item.readAt ? "Dibaca" : "Baru"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!result?.data.length ? <p className="px-4 py-8 text-sm text-stone-500">Tidak ada notifikasi pada filter ini.</p> : null}
      </div>
    </section>
  );
}
