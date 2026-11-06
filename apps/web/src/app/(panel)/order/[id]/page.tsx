"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { pickupLabel, rupiah, statusLabel, tanggal } from "@/lib/format";
import { can } from "@/lib/permissions";
import { OrderRecord } from "@/lib/types";
import { useApi } from "@/lib/use-api";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const request = useApi();
  const { permissions } = useAuth();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [pickupNote, setPickupNote] = useState("");
  const [fee, setFee] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [financeNote, setFinanceNote] = useState("");
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [confirm, setConfirm] = useState<"pickup" | "finance" | "complete" | null>(null);

  async function load() {
    const result = await request<OrderRecord>(`/orders/${params.id}`);
    setOrder(result);
    if (result.finance) {
      setFee(result.finance.fee);
      setSellingPrice(result.finance.sellingPrice);
      setFinanceNote(result.finance.note);
    }
  }

  useEffect(() => {
    load().catch((caught) => setError(caught instanceof ApiError ? caught.message : "Gagal memuat pesanan"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, request]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function run(action: () => Promise<OrderRecord>, success: string) {
    setPending(true);
    setError("");
    try {
      setOrder(await action());
      setToast({ tone: "success", message: success });
    } catch (caught) {
      const message = caught instanceof ApiError ? caught.message : "Tindakan gagal";
      setError(message);
      setToast({ tone: "error", message });
    } finally {
      setPending(false);
      setConfirm(null);
    }
  }

  async function saveFinance() {
    await run(
      () =>
        request<OrderRecord>(`/orders/${params.id}/finance`, {
          method: "PUT",
          body: JSON.stringify({ fee, sellingPrice, note: financeNote }),
        }),
      "Fee dan harga jual tersimpan",
    );
  }

  if (!order) {
    return error ? <Notice>{error}</Notice> : <p className="text-sm text-stone-500">Memuat pesanan...</p>;
  }

  const canPickup = can(permissions, "ORDER_PICKUP") && order.status === "PENDING_PICKUP";
  const canFinance = can(permissions, "ORDER_FINANCE") && order.status === "DONE_PICKUP";
  const canComplete = can(permissions, "ORDER_COMPLETE") && order.status === "DONE_PICKUP" && Boolean(order.finance);

  return (
    <section className="space-y-5">
      {toast ? <Toast tone={toast.tone} message={toast.message} onClose={() => setToast(null)} /> : null}
      <PageHeader
        eyebrow={order.orderNumber}
        title={order.store.name}
        description={`Dibuat oleh ${order.createdBy.name} pada ${tanggal(order.createdAt)}`}
        action={<StatusBadge status={order.status} />}
      />
      {error ? <Notice>{error}</Notice> : null}
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <article className="rounded-xl border border-line bg-card p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">Data pesanan</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Nomor pesanan</dt>
                <dd className="font-medium text-ink">{order.customerOrderNumber || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Nama penerima</dt>
                <dd className="font-medium text-ink">{order.recipientName || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Metode pengambilan</dt>
                <dd className="font-medium text-ink">{order.pickupMethod ? pickupLabel(order.pickupMethod) : "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Nama trader</dt>
                <dd className="font-medium text-ink">{order.traderName || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Nominal order</dt>
                <dd className="font-medium text-ink">{order.orderAmount === null || order.orderAmount === undefined ? "—" : rupiah(order.orderAmount)}</dd>
              </div>
            </dl>
          </article>
          <article className="rounded-xl border border-line bg-card p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">Barang</h2>
            <div className="mt-4 divide-y divide-line">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-semibold">{item.productName}</p>
                    <p className="text-slate-500">{item.sku}</p>
                  </div>
                  <p>{item.quantity}</p>
                </div>
              ))}
            </div>
            {order.note ? <p className="mt-3 text-sm text-slate-600">Catatan: {order.note}</p> : null}
          </article>
          <article className="rounded-xl border border-line bg-card p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">Barcode</h2>
            {order.barcodes.length === 0 ? <p className="mt-3 text-sm text-slate-500">Tidak ada lampiran.</p> : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {order.barcodes.map((file) => (
                <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border border-line">
                  {file.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.url} alt={file.originalName} className="h-40 w-full object-cover" />
                  ) : (
                    <span className="block p-4 text-sm font-semibold text-sea">{file.originalName}</span>
                  )}
                </a>
              ))}
            </div>
          </article>
          {can(permissions, "ORDER_FINANCE") ? (
            <article className="rounded-xl border border-line bg-card p-5 shadow-card">
              <h2 className="text-base font-semibold text-ink">Fee dan harga jual</h2>
              {order.finance && order.status === "COMPLETED" ? (
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><dt>Fee</dt><dd className="font-semibold">{rupiah(order.finance.fee)}</dd></div>
                  <div className="flex justify-between"><dt>Harga jual</dt><dd className="font-semibold">{rupiah(order.finance.sellingPrice)}</dd></div>
                  <p className="text-slate-500">Dicatat oleh {order.finance.recordedBy.name} pada {tanggal(order.finance.recordedAt)}</p>
                </dl>
              ) : (
                <form
                  className="mt-4 space-y-4"
                  onSubmit={(event: FormEvent) => {
                    event.preventDefault();
                    setConfirm("finance");
                  }}
                >
                  {!canFinance ? <p className="text-sm text-slate-500">Fee diisi setelah barang berstatus Sudah Diambil.</p> : null}
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Fee / komisi">
                      <MoneyInput value={fee} disabled={!canFinance} onChange={setFee} />
                    </Field>
                    <Field label="Harga jual">
                      <MoneyInput value={sellingPrice} disabled={!canFinance} onChange={setSellingPrice} />
                    </Field>
                  </div>
                  <Field label="Catatan finansial">
                    <textarea value={financeNote} disabled={!canFinance} rows={3} onChange={(event) => setFinanceNote(event.target.value)} />
                  </Field>
                  <Button disabled={!canFinance || pending}>Simpan perhitungan</Button>
                </form>
              )}
            </article>
          ) : null}
        </div>
        <aside className="space-y-5">
          <article className="rounded-xl border border-line bg-card p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">Jejak status</h2>
            <ol className="mt-4 space-y-4">
              {order.history.map((event, index) => (
                <li key={`${event.status}-${index}`} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-pine" />
                  <p className="font-medium text-ink">{statusLabel(event.status)}</p>
                  <p className="text-sm text-slate-500">{event.by.name} · {tanggal(event.at)}</p>
                  {event.note ? <p className="text-sm">{event.note}</p> : null}
                </li>
              ))}
            </ol>
          </article>
          {canPickup ? (
            <article className="space-y-3 rounded-xl border border-line bg-card p-5 shadow-card">
              <h2 className="text-base font-semibold text-ink">Pengambilan</h2>
              <Field label="Catatan lapangan">
                <textarea value={pickupNote} rows={3} onChange={(event) => setPickupNote(event.target.value)} />
              </Field>
              <Button variant="copper" disabled={pending} onClick={() => setConfirm("pickup")}>
                Tandai Sudah Diambil
              </Button>
            </article>
          ) : null}
          {can(permissions, "ORDER_COMPLETE") && order.status === "DONE_PICKUP" ? (
            <article className="space-y-3 rounded-xl border border-line bg-card p-5 shadow-card">
              <h2 className="text-base font-semibold text-ink">Penyelesaian</h2>
              <p className="text-sm text-slate-600">Pesanan dapat ditutup setelah fee dan harga jual tersimpan.</p>
              <Button disabled={!canComplete || pending} onClick={() => setConfirm("complete")}>
                Tandai Selesai
              </Button>
            </article>
          ) : null}
        </aside>
      </div>
      {confirm === "pickup" ? (
        <ConfirmDialog
          title="Konfirmasi pengambilan"
          message="Barang akan ditandai sudah diambil. Lanjutkan?"
          confirmLabel="Sudah diambil"
          tone="danger"
          pending={pending}
          onClose={() => setConfirm(null)}
          onConfirm={() =>
            void run(
              () =>
                request<OrderRecord>(`/orders/${params.id}/pickup`, {
                  method: "POST",
                  body: JSON.stringify({ note: pickupNote }),
                }),
              "Barang ditandai sudah diambil",
            )
          }
        />
      ) : null}
      {confirm === "finance" ? (
        <ConfirmDialog
          title="Simpan perhitungan"
          message={`Fee ${rupiah(fee)} dan harga jual ${rupiah(sellingPrice)} akan disimpan.`}
          confirmLabel="Simpan"
          tone="primary"
          pending={pending}
          onClose={() => setConfirm(null)}
          onConfirm={() => void saveFinance()}
        />
      ) : null}
      {confirm === "complete" ? (
        <ConfirmDialog
          title="Tutup pesanan"
          message="Pesanan akan ditandai selesai. Status ini tidak dapat dikembalikan."
          confirmLabel="Tandai selesai"
          tone="primary"
          pending={pending}
          onClose={() => setConfirm(null)}
          onConfirm={() => void run(() => request<OrderRecord>(`/orders/${params.id}/complete`, { method: "POST" }), "Pesanan selesai")}
        />
      ) : null}
    </section>
  );
}
