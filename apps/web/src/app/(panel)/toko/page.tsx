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
import { Paginated, Store } from "@/lib/types";
import { rowNumber, usePagedList } from "@/lib/use-paged-list";
import { useApi } from "@/lib/use-api";

const EMPTY = { name: "", address: "", phone: "", requireBarcode: false, notes: "", isActive: true };

type StoreForm = typeof EMPTY;
type ToastState = { tone: "success" | "error"; message: string };

export default function StoresPage() {
  const request = useApi();
  const { permissions } = useAuth();
  const writable = can(permissions, "STORE_WRITE");
  const list = usePagedList({ sortBy: "name", sortDir: "asc" });
  const [result, setResult] = useState<Paginated<Store> | null>(null);
  const [editor, setEditor] = useState<{ id: string | null; form: StoreForm } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Store | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  async function load() {
    setResult(await request<Paginated<Store>>(`/stores?${list.query}`));
  }

  useEffect(() => {
    load().catch((caught) => setToast({ tone: "error", message: caught instanceof ApiError ? caught.message : "Gagal memuat toko" }));
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
        await request(`/stores/${editor.id}`, { method: "PATCH", body: JSON.stringify(editor.form) });
        setToast({ tone: "success", message: "Toko berhasil diperbarui" });
      } else {
        await request("/stores", { method: "POST", body: JSON.stringify(editor.form) });
        setToast({ tone: "success", message: "Toko berhasil ditambahkan" });
      }
      setEditor(null);
      await load();
    } catch (caught) {
      setToast({ tone: "error", message: caught instanceof ApiError ? caught.message : "Gagal menyimpan toko" });
    } finally {
      setBusy(false);
    }
  }

  async function removeStore() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await request(`/stores/${pendingDelete.id}`, { method: "DELETE" });
      setToast({ tone: "success", message: "Toko berhasil dihapus" });
      setPendingDelete(null);
      await load();
    } catch (caught) {
      setToast({ tone: "error", message: caught instanceof ApiError ? caught.message : "Gagal menghapus toko" });
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
        title="Toko mitra"
        description="Aturan barcode diatur per toko. Studio Ponsel adalah contoh toko yang mewajibkan lampiran."
        action={writable ? <Button onClick={() => setEditor({ id: null, form: EMPTY })}>Toko baru</Button> : null}
      />
      <ListControls
        search={list.q}
        onSearch={list.search}
        placeholder="Cari nama, alamat, atau telepon"
        page={result?.meta.page ?? list.page}
        totalPages={result?.meta.totalPages ?? 1}
        total={result?.meta.total ?? 0}
        onPage={list.setPage}
        filters={
          <>
            <select value={list.filters.active ?? ""} onChange={(event) => list.filter("active", event.target.value)}>
              <option value="">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
            <select value={list.filters.barcode ?? ""} onChange={(event) => list.filter("barcode", event.target.value)}>
              <option value="">Semua aturan barcode</option>
              <option value="required">Wajib barcode</option>
              <option value="optional">Barcode tidak wajib</option>
            </select>
          </>
        }
      />
      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">No</th>
              <SortHeader label="Nama" field="name" sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.sort} />
              <th className="px-4 py-3">Alamat</th>
              <SortHeader label="Telepon" field="phone" sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.sort} />
              <th className="px-4 py-3">Barcode</th>
              <th className="px-4 py-3">Status</th>
              {writable ? <th className="px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {result?.data.map((store, index) => (
              <tr key={store.id} className="border-t border-line">
                <td className="px-4 py-3">{rowNumber(result.meta.page, index, result.meta.limit)}</td>
                <td className="px-4 py-3 font-semibold">{store.name}</td>
                <td className="px-4 py-3">{store.address || "—"}</td>
                <td className="px-4 py-3">{store.phone || "—"}</td>
                <td className="px-4 py-3">{store.requireBarcode ? "Wajib" : "Tidak wajib"}</td>
                <td className="px-4 py-3">{store.isActive ? "Aktif" : "Nonaktif"}</td>
                {writable ? (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setEditor({
                          id: store.id,
                          form: {
                            name: store.name,
                            address: store.address,
                            phone: store.phone,
                            requireBarcode: store.requireBarcode,
                            notes: store.notes,
                            isActive: store.isActive,
                          },
                        })}
                      >
                        Ubah
                      </Button>
                      <Button variant="ghost" onClick={() => setPendingDelete(store)}>Hapus</Button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {!result?.data.length ? <p className="px-4 py-8 text-sm text-slate-500">Tidak ada toko pada filter ini.</p> : null}
      </div>

      {editor ? (
        <Modal title={editor.id ? "Ubah toko" : "Toko baru"} onClose={() => setEditor(null)}>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Nama"><input value={editor.form.name} required onChange={(event) => setEditor({ ...editor, form: { ...editor.form, name: event.target.value } })} /></Field>
            <Field label="Alamat"><input value={editor.form.address} onChange={(event) => setEditor({ ...editor, form: { ...editor.form, address: event.target.value } })} /></Field>
            <Field label="Telepon"><input value={editor.form.phone} onChange={(event) => setEditor({ ...editor, form: { ...editor.form, phone: event.target.value } })} /></Field>
            <Field label="Catatan"><textarea rows={3} value={editor.form.notes} onChange={(event) => setEditor({ ...editor, form: { ...editor.form, notes: event.target.value } })} /></Field>
            <label className="flex items-center gap-2 text-sm"><input className="h-4 w-4" type="checkbox" checked={editor.form.requireBarcode} onChange={(event) => setEditor({ ...editor, form: { ...editor.form, requireBarcode: event.target.checked } })} /> Wajib barcode</label>
            <label className="flex items-center gap-2 text-sm"><input className="h-4 w-4" type="checkbox" checked={editor.form.isActive} onChange={(event) => setEditor({ ...editor, form: { ...editor.form, isActive: event.target.checked } })} /> Toko aktif</label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditor(null)}>Batal</Button>
              <Button disabled={busy}>{busy ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Hapus toko"
          message={`Toko ${pendingDelete.name} akan dihapus. Toko yang sudah dipakai pesanan tidak dapat dihapus.`}
          confirmLabel="Hapus"
          pending={busy}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => void removeStore()}
        />
      ) : null}
    </section>
  );
}
