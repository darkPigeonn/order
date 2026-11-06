"use client";

import { FormEvent, useEffect, useState } from "react";
import { ListControls, SortHeader } from "@/components/list/ListControls";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Paginated, Product } from "@/lib/types";
import { rowNumber, usePagedList } from "@/lib/use-paged-list";
import { useApi } from "@/lib/use-api";

const EMPTY = { name: "", sku: "", description: "", isActive: true };
type ProductForm = typeof EMPTY;
type ToastState = { tone: "success" | "error"; message: string };

export default function ProductsPage() {
  const request = useApi();
  const { permissions } = useAuth();
  const writable = can(permissions, "PRODUCT_WRITE");
  const list = usePagedList({ sortBy: "name", sortDir: "asc" });
  const [result, setResult] = useState<Paginated<Product> | null>(null);
  const [editor, setEditor] = useState<{ id: string | null; form: ProductForm } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  async function load() {
    setResult(await request<Paginated<Product>>(`/products?${list.query}`));
  }

  useEffect(() => {
    load().catch((caught) => setToast({ tone: "error", message: caught instanceof ApiError ? caught.message : "Gagal memuat produk" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.query, request]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editor) return;
    setBusy(true);
    try {
      if (editor.id) {
        await request(`/products/${editor.id}`, { method: "PATCH", body: JSON.stringify(editor.form) });
        setToast({ tone: "success", message: "Produk berhasil diperbarui" });
      } else {
        await request("/products", { method: "POST", body: JSON.stringify(editor.form) });
        setToast({ tone: "success", message: "Produk berhasil ditambahkan" });
      }
      setEditor(null);
      await load();
    } catch (caught) {
      setToast({ tone: "error", message: caught instanceof ApiError ? caught.message : "Gagal menyimpan produk" });
    } finally {
      setBusy(false);
    }
  }

  async function removeProduct() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await request(`/products/${pendingDelete.id}`, { method: "DELETE" });
      setToast({ tone: "success", message: "Produk berhasil dihapus" });
      setPendingDelete(null);
      await load();
    } catch (caught) {
      setToast({ tone: "error", message: caught instanceof ApiError ? caught.message : "Gagal menghapus produk" });
      setPendingDelete(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      {toast ? <Toast tone={toast.tone} message={toast.message} onClose={() => setToast(null)} /> : null}
      <PageHeader
        eyebrow="Master"
        title="Katalog produk"
        description="Produk dipakai bersama semua toko. Jumlah barang diatur pada halaman stok."
        action={writable ? <Button onClick={() => setEditor({ id: null, form: EMPTY })}>Produk baru</Button> : null}
      />
      <ListControls
        search={list.q}
        onSearch={list.search}
        placeholder="Cari nama atau SKU"
        page={result?.meta.page ?? list.page}
        totalPages={result?.meta.totalPages ?? 1}
        total={result?.meta.total ?? 0}
        onPage={list.setPage}
        filters={
          <select value={list.filters.active ?? ""} onChange={(event) => list.filter("active", event.target.value)}>
            <option value="">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        }
      />
      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">No</th>
              <SortHeader label="Produk" field="name" sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.sort} />
              <SortHeader label="SKU" field="sku" sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.sort} />
              <th className="px-4 py-3">Status</th>
              {writable ? <th className="px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {result?.data.map((product, index) => (
              <tr key={product.id} className="border-t border-line">
                <td className="px-4 py-3">{rowNumber(result.meta.page, index, result.meta.limit)}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.description}</p>
                </td>
                <td className="px-4 py-3">{product.sku}</td>
                <td className="px-4 py-3">{product.isActive ? "Aktif" : "Nonaktif"}</td>
                {writable ? (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setEditor({
                          id: product.id,
                          form: {
                            name: product.name,
                            sku: product.sku,
                            description: product.description,
                            isActive: product.isActive,
                          },
                        })}
                      >
                        Ubah
                      </Button>
                      <Button variant="ghost" onClick={() => setPendingDelete(product)}>Hapus</Button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {!result?.data.length ? <p className="px-4 py-8 text-sm text-slate-500">Tidak ada produk pada filter ini.</p> : null}
      </div>

      {editor ? (
        <Modal title={editor.id ? "Ubah produk" : "Produk baru"} onClose={() => setEditor(null)}>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Nama"><input value={editor.form.name} required onChange={(event) => setEditor({ ...editor, form: { ...editor.form, name: event.target.value } })} /></Field>
            <Field label="SKU" hint="Huruf, angka, dan tanda hubung."><input value={editor.form.sku} required onChange={(event) => setEditor({ ...editor, form: { ...editor.form, sku: event.target.value } })} /></Field>
            <Field label="Keterangan"><textarea rows={3} value={editor.form.description} onChange={(event) => setEditor({ ...editor, form: { ...editor.form, description: event.target.value } })} /></Field>
            <label className="flex items-center gap-2 text-sm"><input className="h-4 w-4" type="checkbox" checked={editor.form.isActive} onChange={(event) => setEditor({ ...editor, form: { ...editor.form, isActive: event.target.checked } })} /> Produk aktif</label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditor(null)}>Batal</Button>
              <Button disabled={busy}>{busy ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Hapus produk"
          message={`Produk ${pendingDelete.name} akan dihapus. Produk yang sudah dipakai pesanan tidak dapat dihapus.`}
          confirmLabel="Hapus"
          pending={busy}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => void removeProduct()}
        />
      ) : null}
    </section>
  );
}
