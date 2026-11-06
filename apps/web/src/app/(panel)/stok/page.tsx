"use client";

import { useEffect, useState } from "react";
import { ListControls, SortHeader } from "@/components/list/ListControls";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Paginated, StockLine, Store } from "@/lib/types";
import { rowNumber, usePagedList } from "@/lib/use-paged-list";
import { useApi } from "@/lib/use-api";

export default function StockPage() {
  const request = useApi();
  const { permissions } = useAuth();
  const writable = can(permissions, "STOCK_WRITE");
  const list = usePagedList({ sortBy: "productName", sortDir: "asc" });
  const [stores, setStores] = useState<Store[]>([]);
  const [result, setResult] = useState<Paginated<StockLine> | null>(null);
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const storeId = list.filters.storeId ?? "";

  useEffect(() => {
    request<Paginated<Store>>("/stores?limit=100&sortBy=name&sortDir=asc")
      .then((payload) => {
        setStores(payload.data);
        if (!list.filters.storeId && payload.data[0]) list.filter("storeId", payload.data[0].id);
      })
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : "Gagal memuat toko"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  useEffect(() => {
    if (!storeId) return;
    request<Paginated<StockLine>>(`/stock?${list.query}`)
      .then((payload) => {
        setResult(payload);
        setDrafts(Object.fromEntries(payload.data.map((line) => [line.productId, line.quantity])));
      })
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : "Gagal memuat stok"));
  }, [list.query, request, storeId]);

  async function save(line: StockLine) {
    setError("");
    setMessage("");
    try {
      await request("/stock", {
        method: "PUT",
        body: JSON.stringify({ storeId, productId: line.productId, quantity: drafts[line.productId] ?? 0 }),
      });
      setMessage(`Stok ${line.productName} diperbarui`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Gagal menyimpan stok");
    }
  }

  return (
    <section>
      <PageHeader eyebrow="Master" title="Stok per toko" description="Ketersediaan barang terikat pada toko. Pesanan baru hanya bisa dibuat selama stok mencukupi." />
      {error ? <Notice>{error}</Notice> : null}
      {message ? <p className="mb-4 text-sm font-semibold text-pine">{message}</p> : null}
      <ListControls
        search={list.q}
        onSearch={list.search}
        placeholder="Cari nama produk atau SKU"
        page={result?.meta.page ?? list.page}
        totalPages={result?.meta.totalPages ?? 1}
        total={result?.meta.total ?? 0}
        onPage={list.setPage}
        filters={
          <>
            <select value={storeId} onChange={(event) => list.filter("storeId", event.target.value)}>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
            <select value={list.filters.active ?? ""} onChange={(event) => list.filter("active", event.target.value)}>
              <option value="">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </>
        }
      />
      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">No</th>
              <SortHeader label="Produk" field="productName" sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.sort} />
              <SortHeader label="SKU" field="sku" sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.sort} />
              <SortHeader label="Jumlah" field="quantity" sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.sort} />
              {writable ? <th className="px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {result?.data.map((line, index) => (
              <tr key={line.productId} className="border-t border-line">
                <td className="px-4 py-3">{rowNumber(result.meta.page, index, result.meta.limit)}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{line.productName}</p>
                  <p className="text-xs text-stone-500">{line.isActive ? "Aktif" : "Nonaktif"}</p>
                </td>
                <td className="px-4 py-3">{line.sku}</td>
                <td className="px-4 py-3">
                  <input
                    className="max-w-[120px]"
                    type="number"
                    min={0}
                    disabled={!writable || !line.isActive}
                    value={drafts[line.productId] ?? 0}
                    onChange={(event) => setDrafts((current) => ({ ...current, [line.productId]: Number(event.target.value) }))}
                  />
                </td>
                {writable ? (
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" disabled={!line.isActive} onClick={() => save(line)}>Simpan</Button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {!result?.data.length ? <p className="px-4 py-8 text-sm text-stone-500">Tidak ada stok pada filter ini.</p> : null}
      </div>
    </section>
  );
}
