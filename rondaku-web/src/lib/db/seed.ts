import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const client = postgres(connectionString);
const db = drizzle(client, { schema });

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function atTime(dateStr: string, hhmm: string) {
  return new Date(`${dateStr}T${hhmm}:00+07:00`);
}

async function main() {
  console.log("Seeding RondaKu...");

  const pinHash = await bcrypt.hash("123456", 10);

  const [rt] = await db
    .insert(schema.rt)
    .values({
      nama: "RT 05 / RW 03 Kelurahan Sukamaju",
      alamat: "Jl. Mawar Raya, Kelurahan Sukamaju",
      zonaWaktu: "Asia/Jakarta",
    })
    .returning();

  await db.insert(schema.pengaturan).values({
    rtId: rt.id,
    jamMulai: "22:00",
    jamSelesai: "04:00",
    batasCheckin: "01:00",
    batasTukarJam: "18:00",
    batasTukarHMin: 1,
    nominalDenda: "25000",
  });

  const [posUtama] = await db
    .insert(schema.pos)
    .values({
      rtId: rt.id,
      nama: "Pos Ronda Utama",
      lat: -6.200000,
      lng: 106.816666,
      radiusM: 100,
      qrToken: "POS-UTAMA-" + rt.id.slice(0, 8),
    })
    .returning();

  const wargaRows = await db
    .insert(schema.warga)
    .values([
      { rtId: rt.id, nama: "Budi Santoso", noHp: "081200000001", alamat: "Blok A No. 1", wajibRonda: false, pinHash },
      { rtId: rt.id, nama: "Siti Aminah", noHp: "081200000002", alamat: "Blok A No. 2", wajibRonda: false, pinHash },
      { rtId: rt.id, nama: "Agus Wijaya", noHp: "081200000003", alamat: "Blok B No. 3", wajibRonda: true, pinHash },
      { rtId: rt.id, nama: "Dedi Kurniawan", noHp: "081200000004", alamat: "Blok B No. 4", wajibRonda: true, pinHash },
      { rtId: rt.id, nama: "Rudi Hartono", noHp: "081200000005", alamat: "Blok C No. 5", wajibRonda: true, pinHash },
      { rtId: rt.id, nama: "Hj. Maryam", noHp: "081200000006", alamat: "Blok C No. 6", wajibRonda: false, aktif: true, pinHash },
    ])
    .returning();

  const [admin, bendahara, petugas1, petugas2, petugas3, wargaLansia] = wargaRows;

  await db.insert(schema.peranWarga).values([
    { wargaId: admin.id, peran: "admin" },
    { wargaId: bendahara.id, peran: "bendahara" },
    { wargaId: petugas1.id, peran: "petugas" },
    { wargaId: petugas2.id, peran: "petugas" },
    { wargaId: petugas3.id, peran: "petugas" },
    { wargaId: wargaLansia.id, peran: "warga" },
    { wargaId: admin.id, peran: "warga" },
    { wargaId: bendahara.id, peran: "warga" },
    { wargaId: petugas1.id, peran: "warga" },
    { wargaId: petugas2.id, peran: "warga" },
    { wargaId: petugas3.id, peran: "warga" },
  ]);

  await db.insert(schema.jadwalTemplate).values([
    { rtId: rt.id, hari: 1, posId: posUtama.id, wargaId: petugas1.id },
    { rtId: rt.id, hari: 3, posId: posUtama.id, wargaId: petugas2.id },
    { rtId: rt.id, hari: 5, posId: posUtama.id, wargaId: petugas3.id },
  ]);

  const tglLalu = daysFromNow(-2);
  const tglBesok = daysFromNow(1);
  const tglLusa = daysFromNow(3);

  const [giliranHadir, giliranTidakHadir, giliranBesok, giliranLusa] = await db
    .insert(schema.giliran)
    .values([
      { rtId: rt.id, tanggal: tglLalu, posId: posUtama.id, wargaIdAsli: petugas1.id, wargaIdBertugas: petugas1.id, status: "hadir" },
      { rtId: rt.id, tanggal: tglLalu, posId: posUtama.id, wargaIdAsli: petugas2.id, wargaIdBertugas: petugas2.id, status: "tidak_hadir" },
      { rtId: rt.id, tanggal: tglBesok, posId: posUtama.id, wargaIdAsli: petugas3.id, wargaIdBertugas: petugas3.id, status: "terjadwal" },
      { rtId: rt.id, tanggal: tglLusa, posId: posUtama.id, wargaIdAsli: petugas1.id, wargaIdBertugas: petugas1.id, status: "terjadwal" },
    ])
    .returning();

  await db.insert(schema.checkin).values({
    giliranId: giliranHadir.id,
    waktu: atTime(tglLalu, "22:15"),
    lat: -6.200010,
    lng: 106.816670,
    metode: "qr",
  });

  const [dendaTidakHadir] = await db
    .insert(schema.denda)
    .values({
      giliranId: giliranTidakHadir.id,
      wargaId: petugas2.id,
      nominal: "25000",
      status: "lunas",
    })
    .returning();

  await db.insert(schema.pembayaran).values({
    dendaId: dendaTidakHadir.id,
    metode: "tunai",
    diverifikasiOleh: bendahara.id,
    waktu: atTime(daysFromNow(-1), "19:00"),
  });

  await db.insert(schema.kas).values([
    {
      rtId: rt.id,
      tanggal: daysFromNow(-1),
      jenis: "masuk",
      kategori: "denda",
      nominal: "25000",
      keterangan: "Pembayaran denda tidak hadir ronda - Dedi Kurniawan",
      refDendaId: dendaTidakHadir.id,
      dicatatOleh: bendahara.id,
    },
    {
      rtId: rt.id,
      tanggal: daysFromNow(-1),
      jenis: "masuk",
      kategori: "iuran",
      nominal: "500000",
      keterangan: "Iuran kas warga bulan berjalan",
      dicatatOleh: bendahara.id,
    },
    {
      rtId: rt.id,
      tanggal: daysFromNow(0),
      jenis: "keluar",
      kategori: "konsumsi",
      nominal: "75000",
      keterangan: "Kopi dan snack pos ronda",
      dicatatOleh: bendahara.id,
    },
  ]);

  await db.insert(schema.notifikasi).values([
    {
      rtId: rt.id,
      wargaId: petugas3.id,
      jenis: "H-1_giliran",
      judul: "Giliran ronda besok",
      isi: `Giliran ronda Anda besok (${tglBesok}) di Pos Ronda Utama, jam 22.00-04.00.`,
    },
    {
      rtId: rt.id,
      wargaId: petugas2.id,
      jenis: "denda_dibuat",
      judul: "Denda tidak hadir",
      isi: "Anda tercatat tidak hadir ronda dan dikenakan denda Rp25.000.",
    },
  ]);

  console.log("Seed selesai.");
  console.log({
    rt: rt.nama,
    posUtama: posUtama.nama,
    warga: wargaRows.map((w) => w.nama),
    giliran: [giliranHadir, giliranTidakHadir, giliranBesok, giliranLusa].map(
      (g) => `${g.tanggal} - ${g.status}`
    ),
  });
  console.log("Login contoh: no HP salah satu warga di atas, PIN 123456");

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
