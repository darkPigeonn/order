"use client";

import { FormEvent, useEffect, useState } from "react";
import { Notice } from "@/components/ui/Notice";
import { ApiError } from "@/lib/api";
import { formatNominal } from "@/lib/format";
import { Paginated, PickupMethod, StockLine, Store } from "@/lib/types";
import { useApi } from "@/lib/use-api";

export function OrderFormModal({
  onClose,
  onCreated,
  onFailed,
}: {
  onClose: () => void;
  onCreated: () => void;
  onFailed: (message: string) => void;
}) {
  const request = useApi();
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState("");
  const [storeQuery, setStoreQuery] = useState("");
  const [storeOpen, setStoreOpen] = useState(false);
  const [lines, setLines] = useState<StockLine[]>([]);
  const [picked, setPicked] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [productQuery, setProductQuery] = useState("");
  const [productOpen, setProductOpen] = useState(false);
  const [customerOrderNumber, setCustomerOrderNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [pickupMethod, setPickupMethod] = useState<PickupMethod>("SELF_PICK_UP");
  const [traderName, setTraderName] = useState("");
  const [orderAmount, setOrderAmount] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const store = stores.find((item) => item.id === storeId);
  const storeSuggestions = stores.filter((item) => {
    const keyword = storeQuery.trim().toLowerCase();
    if (!keyword) return true;
    return item.name.toLowerCase().includes(keyword);
  });
  const pickedIds = new Set(picked.map((item) => item.productId));
  const suggestions = lines.filter((line) => {
    if (pickedIds.has(line.productId) || line.quantity === 0) return false;
    const keyword = productQuery.trim().toLowerCase();
    if (!keyword) return true;
    return line.productName.toLowerCase().includes(keyword) || line.sku.toLowerCase().includes(keyword);
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    request<Paginated<Store>>("/stores?activeOnly=true&limit=100&sortBy=name&sortDir=asc")
      .then((result) => setStores(result.data))
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : "Gagal memuat toko"));
  }, [request]);

  useEffect(() => {
    if (!storeId) {
      setLines([]);
      setPicked([]);
      return;
    }
    request<Paginated<StockLine>>(`/stock?storeId=${storeId}&limit=100&active=active&sortBy=productName&sortDir=asc`)
      .then((result) => {
        setLines(result.data);
        setPicked([]);
        setProductQuery("");
      })
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : "Gagal memuat stok"));
  }, [request, storeId]);

  function chooseStore(item: Store) {
    setStoreId(item.id);
    setStoreQuery("");
    setStoreOpen(false);
  }

  function addProduct(line: StockLine) {
    setPicked((current) => [...current, { productId: line.productId, quantity: 1 }]);
    setProductQuery("");
    setProductOpen(false);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const items = picked.filter((item) => item.quantity > 0);

    if (!storeId || items.length === 0) {
      setError("Pilih toko dan minimal satu produk");
      return;
    }
    if (!customerOrderNumber.trim() || !recipientName.trim() || !traderName.trim()) {
      setError("Nomor pesanan, nama penerima, dan nama trader wajib diisi");
      return;
    }
    if (store?.requireBarcode && files.length === 0) {
      setError("Toko ini mewajibkan lampiran barcode");
      return;
    }

    const form = new FormData();
    form.set("storeId", storeId);
    form.set("items", JSON.stringify(items));
    form.set("customerOrderNumber", customerOrderNumber.trim());
    form.set("recipientName", recipientName.trim());
    form.set("pickupMethod", pickupMethod);
    form.set("traderName", traderName.trim());
    if (orderAmount !== null) form.set("orderAmount", String(orderAmount));
    form.set("note", note);
    files.forEach((file) => form.append("barcodes", file));

    setPending(true);
    setError("");
    try {
      await request("/orders", { method: "POST", body: form });
      onCreated();
    } catch (caught) {
      const message = caught instanceof ApiError ? caught.message : "Gagal membuat pesanan";
      setError(message);
      onFailed(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 py-8" onMouseDown={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Input order baru"
        onSubmit={onSubmit}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-[680px] rounded-2xl bg-white p-6 shadow-card"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Input order baru</h2>
          <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-ink" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>

        {error ? <div className="mb-4"><Notice>{error}</Notice></div> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Pilih toko</span>
            <div className="relative">
              <input
                value={storeOpen ? storeQuery : store?.name ?? ""}
                placeholder="Pilih toko"
                onClick={() => setStoreOpen(true)}
                onFocus={() => {
                  setStoreOpen(true);
                  setStoreQuery("");
                }}
                onBlur={() => setStoreOpen(false)}
                onChange={(event) => {
                  setStoreQuery(event.target.value);
                  setStoreOpen(true);
                }}
              />
              <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">⌄</span>
              {storeOpen ? (
                <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-line bg-white shadow-card">
                  {storeSuggestions.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-slate-500">Toko tidak ditemukan.</p>
                  ) : (
                    storeSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => chooseStore(item)}
                      >
                        <span className="block font-medium text-ink">{item.name}</span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Pilih produk</span>
            <div className="relative">
              <input
                value={productQuery}
                placeholder={storeId ? "Pilih produk" : "Pilih toko dulu"}
                disabled={!storeId}
                onClick={() => setProductOpen(true)}
                onFocus={() => setProductOpen(true)}
                onBlur={() => setProductOpen(false)}
                onChange={(event) => {
                  setProductQuery(event.target.value);
                  setProductOpen(true);
                }}
              />
              <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">⌄</span>
              {productOpen && storeId ? (
                <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-line bg-white shadow-card">
                  {suggestions.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-slate-500">Produk tidak ditemukan.</p>
                  ) : (
                    suggestions.map((line) => (
                      <button
                        key={line.productId}
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => addProduct(line)}
                      >
                        <span>
                          <span className="block font-medium text-ink">{line.productName}</span>
                          <span className="text-xs text-slate-500">{line.sku}</span>
                        </span>
                        <span className="text-xs text-slate-500">Stok {line.quantity}</span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Nomor pesanan</span>
            <input value={customerOrderNumber} maxLength={80} placeholder="TRK..." onChange={(event) => setCustomerOrderNumber(event.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Nama penerima</span>
            <input value={recipientName} maxLength={120} placeholder="Nama penerima" onChange={(event) => setRecipientName(event.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Metode pengambilan</span>
            <select value={pickupMethod} onChange={(event) => setPickupMethod(event.target.value as PickupMethod)}>
              <option value="SELF_PICK_UP">Self Pick Up</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Nama trader</span>
            <input value={traderName} maxLength={120} placeholder="Yohanes iCase" onChange={(event) => setTraderName(event.target.value)} />
          </label>
        </div>

        <label className="mt-4 block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Nominal order (opsional)</span>
          <div className="field-affix">
            <span className="text-sm text-slate-500">Rp</span>
            <input
              inputMode="numeric"
              placeholder="Untuk rekap per produk"
              value={orderAmount === null ? "" : formatNominal(orderAmount)}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "");
                setOrderAmount(digits ? Number(digits) : null);
              }}
            />
          </div>
        </label>

        {picked.length > 0 ? (
          <div className="mt-4 space-y-2">
            {picked.map((item) => {
              const line = lines.find((entry) => entry.productId === item.productId);
              if (!line) return null;
              return (
                <div key={item.productId} className="grid items-center gap-3 rounded-lg border border-line px-3 py-2 sm:grid-cols-[1fr_88px_auto]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{line.productName}</p>
                    <p className="text-xs text-slate-500">{line.sku} · Stok {line.quantity}</p>
                  </div>
                  <input
                    aria-label={`Jumlah ${line.productName}`}
                    type="number"
                    min={1}
                    max={line.quantity}
                    value={item.quantity}
                    onChange={(event) =>
                      setPicked((current) =>
                        current.map((entry) =>
                          entry.productId === item.productId ? { ...entry, quantity: Number(event.target.value) } : entry,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className="text-sm font-medium text-copper"
                    onClick={() => setPicked((current) => current.filter((entry) => entry.productId !== item.productId))}
                  >
                    Hapus
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        <label className="mt-4 block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Catatan</span>
          <textarea value={note} maxLength={500} rows={2} placeholder="Catatan untuk tim lapangan" onChange={(event) => setNote(event.target.value)} />
        </label>

        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Lampiran pick up</p>
          <p className="mt-2 text-sm font-medium text-ink">Foto bukti order</p>
          <label className="mt-2 flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center hover:border-pine">
            <span className="text-2xl leading-none text-pine">+</span>
            <span className="mt-1 text-sm font-semibold text-pine">Lampirkan foto</span>
            <span className="mt-1 text-xs text-slate-500">
              {files.length ? files.map((file) => file.name).join(", ") : "JPG, PNG, WEBP, atau PDF. Maksimal 5 berkas."}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              className="sr-only"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))}
            />
          </label>
          {store ? (
            <p className={`mt-3 rounded-lg px-3 py-2 text-xs leading-5 ${store.requireBarcode ? "bg-[#fff7ed] text-[#9a3412]" : "bg-[#fffbeb] text-[#92400e]"}`}>
              {store.requireBarcode
                ? "Toko ini mewajibkan barcode. Lampirkan foto atau PDF sebelum pesanan disimpan."
                : "Toko ini tidak mewajibkan barcode, jadi cukup lampirkan foto bukti order bila ada."}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-lg bg-[#16325c] px-4 py-3 text-sm font-semibold text-white hover:bg-[#10243e]"
        >
          {pending ? "Menyimpan..." : "Simpan order"}
        </button>
      </form>
    </div>
  );
}
