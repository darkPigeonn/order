# Manajemen Order & Pickup

Aplikasi untuk mengelola pesanan dan pengambilan barang toko mitra. API dan antarmuka dipisah supaya modul baru bisa ditambahkan tanpa mengacak alur yang sudah ada.

## Menjalankan

1. Jalankan MongoDB:

```bash
docker compose up -d
```

2. Pasang dependensi dan jalankan API serta web:

```bash
npm install
npm run dev
```

- Web: http://localhost:3001
- API: http://localhost:4000/api/health

Saat pertama kali API hidup, data percobaan dibuat otomatis. Kata sandi semua akun demo adalah `Admin123!`.

| Peran | Email |
| --- | --- |
| Super Admin | superadmin@manageorder.local |
| Admin | admin@manageorder.local |
| Sub Admin | lapangan@manageorder.local |
| User | mitra@manageorder.local |

## Alur

1. User membuat pesanan. Status awal: **Menunggu Diambil**. Jika toko mewajibkan barcode, lampiran wajib ada.
2. Sub Admin atau Admin menandai **Sudah Diambil** setelah barang dicek di lapangan.
3. Admin atau Super Admin mengisi fee dan harga jual, lalu menandai **Selesai**.

Fee dan harga jual tidak dikirim ke Sub Admin maupun User.

Pesanan mengurangi stok toko saat dibuat. Jika penyimpanan gagal, stok dikembalikan.

## Struktur

```text
apps/api/src
  common/          hak akses, guard, filter
  modules/auth     login dan sesi
  modules/users    akun dan peran
  modules/stores   toko serta aturan barcode
  modules/products katalog
  modules/stock    stok per toko dan reservasi
  modules/orders   alur status, finansial, unggahan barcode
apps/web/src
  app/             halaman per peran
  components/      kerangka dan komponen tampilan
  lib/             klien API dan sesi
```

Peran baru ditambahkan di `apps/api/src/common/auth/role-permissions.ts`. Status baru ditambahkan di enum order dan `order-state.machine.ts`. Web membaca daftar izin dari API, jadi menu mengikuti perubahan itu.
