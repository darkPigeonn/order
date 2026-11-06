"use client";

import { FormEvent, useEffect, useState } from "react";
import { ListControls, SortHeader } from "@/components/list/ListControls";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { roleLabel } from "@/lib/format";
import { can } from "@/lib/permissions";
import { Account, Paginated, Role } from "@/lib/types";
import { rowNumber, usePagedList } from "@/lib/use-paged-list";
import { useApi } from "@/lib/use-api";

export default function UsersPage() {
  const request = useApi();
  const { user, permissions } = useAuth();
  const writable = can(permissions, "USER_WRITE");
  const list = usePagedList({ sortBy: "createdAt", sortDir: "desc" });
  const [result, setResult] = useState<Paginated<Account> | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role === "SUPER_ADMIN" ? "ADMIN" : "USER");
  const [error, setError] = useState("");

  const roleOptions: Role[] = user?.role === "SUPER_ADMIN"
    ? ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "USER"]
    : ["SUB_ADMIN", "USER"];

  async function load() {
    setResult(await request<Paginated<Account>>(`/users?${list.query}`));
  }

  useEffect(() => {
    load().catch((caught) => setError(caught instanceof ApiError ? caught.message : "Gagal memuat pengguna"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.query, request]);

  async function createAccount(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await request("/users", { method: "POST", body: JSON.stringify({ name, email, password, role }) });
      setName("");
      setEmail("");
      setPassword("");
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Gagal membuat akun");
    }
  }

  async function toggle(account: Account) {
    setError("");
    try {
      await request(`/users/${account.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !account.isActive }),
      });
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Gagal mengubah akun");
    }
  }

  return (
    <section>
      <PageHeader eyebrow="Akses" title="Pengguna" description="Super Admin dapat membuat seluruh peran. Admin dapat membuat Sub Admin dan User." />
      {error ? <Notice>{error}</Notice> : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <ListControls
            search={list.q}
            onSearch={list.search}
            placeholder="Cari nama atau email"
            page={result?.meta.page ?? list.page}
            totalPages={result?.meta.totalPages ?? 1}
            total={result?.meta.total ?? 0}
            onPage={list.setPage}
            filters={
              <>
                <select value={list.filters.role ?? ""} onChange={(event) => list.filter("role", event.target.value)}>
                  <option value="">Semua peran</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUB_ADMIN">Sub Admin</option>
                  <option value="USER">User</option>
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
                  <SortHeader label="Nama" field="name" sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.sort} />
                  <SortHeader label="Email" field="email" sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.sort} />
                  <SortHeader label="Peran" field="role" sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.sort} />
                  <th className="px-4 py-3">Status</th>
                  {writable ? <th className="px-4 py-3" /> : null}
                </tr>
              </thead>
              <tbody>
                {result?.data.map((account, index) => (
                  <tr key={account.id} className="border-t border-line">
                    <td className="px-4 py-3">{rowNumber(result.meta.page, index, result.meta.limit)}</td>
                    <td className="px-4 py-3 font-semibold">{account.name}</td>
                    <td className="px-4 py-3">{account.email}</td>
                    <td className="px-4 py-3">{roleLabel(account.role)}</td>
                    <td className="px-4 py-3">{account.isActive ? "Aktif" : "Nonaktif"}</td>
                    {writable ? (
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" disabled={account.id === user?.id} onClick={() => toggle(account)}>
                          {account.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
            {!result?.data.length ? <p className="px-4 py-8 text-sm text-stone-500">Tidak ada pengguna pada filter ini.</p> : null}
          </div>
        </div>
        {writable ? (
          <form onSubmit={createAccount} className="h-fit space-y-4 rounded-xl border border-line bg-card p-5 shadow-card">
            <h2 className="text-lg font-semibold">Akun baru</h2>
            <Field label="Nama"><input value={name} required onChange={(event) => setName(event.target.value)} /></Field>
            <Field label="Email"><input type="email" value={email} required onChange={(event) => setEmail(event.target.value)} /></Field>
            <Field label="Kata sandi" hint="Minimal 8 karakter."><input type="password" value={password} required minLength={8} onChange={(event) => setPassword(event.target.value)} /></Field>
            <Field label="Peran">
              <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
                {roleOptions.map((option) => (
                  <option key={option} value={option}>{roleLabel(option)}</option>
                ))}
              </select>
            </Field>
            <Button>Buat akun</Button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
