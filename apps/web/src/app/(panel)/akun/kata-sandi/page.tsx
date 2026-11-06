"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";

export default function ChangePasswordPage() {
  const request = useApi();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setToast({ tone: "error", message: "Konfirmasi kata sandi baru tidak sama" });
      return;
    }

    setPending(true);
    try {
      await request("/auth/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setToast({ tone: "success", message: "Kata sandi berhasil diperbarui" });
    } catch (caught) {
      setToast({ tone: "error", message: caught instanceof ApiError ? caught.message : "Gagal mengubah kata sandi" });
    } finally {
      setPending(false);
    }
  }

  return (
    <section>
      {toast ? <Toast tone={toast.tone} message={toast.message} onClose={() => setToast(null)} /> : null}
      <PageHeader
        eyebrow="Akun"
        title="Ganti kata sandi"
        description="Kata sandi baru minimal 8 karakter. Gunakan kombinasi yang tidak mudah ditebak."
      />
      <form onSubmit={onSubmit} className="max-w-md space-y-4 rounded-xl border border-line bg-card p-5 shadow-card">
        <Field label="Kata sandi sekarang">
          <input type="password" required minLength={8} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        </Field>
        <Field label="Kata sandi baru">
          <input type="password" required minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        </Field>
        <Field label="Ulangi kata sandi baru">
          <input type="password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        </Field>
        <Button disabled={pending}>{pending ? "Menyimpan..." : "Simpan kata sandi"}</Button>
      </form>
    </section>
  );
}
