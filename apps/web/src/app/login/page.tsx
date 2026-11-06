"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const DEMOS = [
  ["Mitra / User", "mitra@manageorder.local"],
  ["Tim lapangan", "lapangan@manageorder.local"],
  ["Admin", "admin@manageorder.local"],
  ["Super Admin", "superadmin@manageorder.local"],
];

export default function LoginPage() {
  const { ready, user, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("mitra@manageorder.local");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/dasbor");
  }, [ready, router, user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await login(email, password);
      router.replace("/dasbor");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Gagal masuk");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden bg-ink px-14 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-pine text-sm font-semibold">OP</span>
          <p className="mt-8 text-sm font-medium text-slate-300">Portal operasional</p>
          <h1 className="mt-3 max-w-lg text-4xl font-semibold tracking-tight">Manajemen Order & Pickup</h1>
        </div>
        <ol className="max-w-md space-y-4 text-sm leading-6 text-slate-300">
          <li>1. User memilih toko, produk, jumlah, dan barcode bila toko mewajibkannya.</li>
          <li>2. Tim lapangan menandai barang yang sudah diambil.</li>
          <li>3. Admin mengisi fee serta harga jual, lalu menutup pesanan.</li>
        </ol>
      </section>
      <section className="flex items-center bg-paper px-6 py-12">
        <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-5 rounded-2xl border border-line bg-white p-7 shadow-card">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-pine">Masuk</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Akun pengguna</h2>
          </div>
          {error ? <Notice>{error}</Notice> : null}
          <Field label="Email">
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </Field>
          <Field label="Kata sandi">
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </Field>
          <Button className="w-full" disabled={pending}>
            {pending ? "Memeriksa..." : "Masuk"}
          </Button>
          <div className="space-y-2 border-t border-line pt-4">
            <p className="text-xs text-slate-500">Akun percobaan · kata sandi Admin123!</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMOS.map(([label, value]) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded-lg border px-3 py-2 text-left text-xs font-medium ${
                    email === value ? "border-pine bg-[#eef3ff] text-pine" : "border-line text-slate-600 hover:bg-slate-50"
                  }`}
                  onClick={() => setEmail(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
