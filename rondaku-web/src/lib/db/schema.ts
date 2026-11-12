import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  numeric,
  timestamp,
  date,
  pgEnum,
  doublePrecision,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const peranEnum = pgEnum("peran", ["admin", "bendahara", "petugas", "warga"]);
export const giliranStatusEnum = pgEnum("giliran_status", [
  "terjadwal",
  "hadir",
  "tidak_hadir",
]);
export const tukarJenisEnum = pgEnum("tukar_jenis", ["tukar", "digantikan"]);
export const tukarStatusEnum = pgEnum("tukar_status", [
  "menunggu",
  "diterima",
  "ditolak",
  "kedaluwarsa",
]);
export const checkinMetodeEnum = pgEnum("checkin_metode", ["qr", "manual"]);
export const dendaStatusEnum = pgEnum("denda_status", [
  "belum_bayar",
  "menunggu_verifikasi",
  "lunas",
  "dibebaskan",
]);
export const pembayaranMetodeEnum = pgEnum("pembayaran_metode", ["tunai", "transfer"]);
export const kasJenisEnum = pgEnum("kas_jenis", ["masuk", "keluar"]);
export const notifikasiKanalEnum = pgEnum("notifikasi_kanal", ["push"]);
export const pengirimanStatusEnum = pgEnum("pengiriman_status", [
  "antri",
  "terkirim",
  "dibaca",
  "gagal",
]);

export const rt = pgTable("rt", {
  id: uuid("id").primaryKey().defaultRandom(),
  nama: text("nama").notNull(),
  alamat: text("alamat"),
  zonaWaktu: varchar("zona_waktu", { length: 20 }).notNull().default("Asia/Jakarta"),
  ...timestamps,
});

export const warga = pgTable("warga", {
  id: uuid("id").primaryKey().defaultRandom(),
  rtId: uuid("rt_id").notNull().references(() => rt.id, { onDelete: "cascade" }),
  nama: text("nama").notNull(),
  noHp: varchar("no_hp", { length: 20 }).notNull(),
  alamat: text("alamat"),
  wajibRonda: boolean("wajib_ronda").notNull().default(true),
  aktif: boolean("aktif").notNull().default(true),
  pinHash: text("pin_hash"),
  gagalLogin: integer("gagal_login").notNull().default(0),
  terkunciSampai: timestamp("terkunci_sampai", { withTimezone: true }),
  ...timestamps,
}, (t) => [
  uniqueIndex("warga_rt_id_no_hp_idx").on(t.rtId, t.noHp),
]);

export const peranWarga = pgTable("peran_warga", {
  id: uuid("id").primaryKey().defaultRandom(),
  wargaId: uuid("warga_id").notNull().references(() => warga.id, { onDelete: "cascade" }),
  peran: peranEnum("peran").notNull(),
  ...timestamps,
}, (t) => [
  uniqueIndex("peran_warga_warga_id_peran_idx").on(t.wargaId, t.peran),
]);

export const pos = pgTable("pos", {
  id: uuid("id").primaryKey().defaultRandom(),
  rtId: uuid("rt_id").notNull().references(() => rt.id, { onDelete: "cascade" }),
  nama: text("nama").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  radiusM: integer("radius_m").notNull().default(100),
  qrToken: text("qr_token").notNull(),
  ...timestamps,
});

export const pengaturan = pgTable("pengaturan", {
  rtId: uuid("rt_id").primaryKey().references(() => rt.id, { onDelete: "cascade" }),
  jamMulai: varchar("jam_mulai", { length: 5 }).notNull().default("22:00"),
  jamSelesai: varchar("jam_selesai", { length: 5 }).notNull().default("04:00"),
  batasCheckin: varchar("batas_checkin", { length: 5 }).notNull().default("01:00"),
  batasTukarJam: varchar("batas_tukar_jam", { length: 5 }).notNull().default("18:00"),
  batasTukarHMin: integer("batas_tukar_h_min").notNull().default(1),
  nominalDenda: numeric("nominal_denda", { precision: 12, scale: 2 }).notNull().default("0"),
  ...timestamps,
});

export const jadwalTemplate = pgTable("jadwal_template", {
  id: uuid("id").primaryKey().defaultRandom(),
  rtId: uuid("rt_id").notNull().references(() => rt.id, { onDelete: "cascade" }),
  hari: integer("hari").notNull(),
  mingguKe: integer("minggu_ke"),
  posId: uuid("pos_id").notNull().references(() => pos.id, { onDelete: "cascade" }),
  wargaId: uuid("warga_id").notNull().references(() => warga.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const giliran = pgTable("giliran", {
  id: uuid("id").primaryKey().defaultRandom(),
  rtId: uuid("rt_id").notNull().references(() => rt.id, { onDelete: "cascade" }),
  tanggal: date("tanggal").notNull(),
  posId: uuid("pos_id").notNull().references(() => pos.id, { onDelete: "cascade" }),
  wargaIdAsli: uuid("warga_id_asli").notNull().references(() => warga.id),
  wargaIdBertugas: uuid("warga_id_bertugas").notNull().references(() => warga.id),
  status: giliranStatusEnum("status").notNull().default("terjadwal"),
  ...timestamps,
});

export const tukarGiliran = pgTable("tukar_giliran", {
  id: uuid("id").primaryKey().defaultRandom(),
  jenis: tukarJenisEnum("jenis").notNull(),
  giliranAsalId: uuid("giliran_asal_id").notNull().references(() => giliran.id, { onDelete: "cascade" }),
  giliranBalasanId: uuid("giliran_balasan_id").references(() => giliran.id, { onDelete: "cascade" }),
  pengajuId: uuid("pengaju_id").notNull().references(() => warga.id),
  penerimaId: uuid("penerima_id").notNull().references(() => warga.id),
  status: tukarStatusEnum("status").notNull().default("menunggu"),
  batasWaktu: timestamp("batas_waktu", { withTimezone: true }).notNull(),
  ...timestamps,
});

export const checkin = pgTable("checkin", {
  id: uuid("id").primaryKey().defaultRandom(),
  giliranId: uuid("giliran_id").notNull().references(() => giliran.id, { onDelete: "cascade" }),
  waktu: timestamp("waktu", { withTimezone: true }).notNull().defaultNow(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  metode: checkinMetodeEnum("metode").notNull(),
  dicatatOleh: uuid("dicatat_oleh").references(() => warga.id),
  ...timestamps,
});

export const denda = pgTable("denda", {
  id: uuid("id").primaryKey().defaultRandom(),
  giliranId: uuid("giliran_id").notNull().references(() => giliran.id, { onDelete: "cascade" }),
  wargaId: uuid("warga_id").notNull().references(() => warga.id),
  nominal: numeric("nominal", { precision: 12, scale: 2 }).notNull(),
  status: dendaStatusEnum("status").notNull().default("belum_bayar"),
  alasanBebas: text("alasan_bebas"),
  ...timestamps,
});

export const pembayaran = pgTable("pembayaran", {
  id: uuid("id").primaryKey().defaultRandom(),
  dendaId: uuid("denda_id").notNull().references(() => denda.id, { onDelete: "cascade" }),
  metode: pembayaranMetodeEnum("metode").notNull(),
  buktiUrl: text("bukti_url"),
  diverifikasiOleh: uuid("diverifikasi_oleh").references(() => warga.id),
  waktu: timestamp("waktu", { withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
});

export const kas = pgTable("kas", {
  id: uuid("id").primaryKey().defaultRandom(),
  rtId: uuid("rt_id").notNull().references(() => rt.id, { onDelete: "cascade" }),
  tanggal: date("tanggal").notNull(),
  jenis: kasJenisEnum("jenis").notNull(),
  kategori: text("kategori").notNull(),
  nominal: numeric("nominal", { precision: 12, scale: 2 }).notNull(),
  keterangan: text("keterangan"),
  notaUrl: text("nota_url"),
  refDendaId: uuid("ref_denda_id").references(() => denda.id),
  dicatatOleh: uuid("dicatat_oleh").notNull().references(() => warga.id),
  ...timestamps,
});

export const riwayat = pgTable("riwayat", {
  id: uuid("id").primaryKey().defaultRandom(),
  rtId: uuid("rt_id").notNull().references(() => rt.id, { onDelete: "cascade" }),
  aktorId: uuid("aktor_id").notNull().references(() => warga.id),
  aksi: text("aksi").notNull(),
  objek: text("objek").notNull(),
  objekId: uuid("objek_id").notNull(),
  dataLama: jsonb("data_lama"),
  dataBaru: jsonb("data_baru"),
  waktu: timestamp("waktu", { withTimezone: true }).notNull().defaultNow(),
});

export const notifikasi = pgTable("notifikasi", {
  id: uuid("id").primaryKey().defaultRandom(),
  rtId: uuid("rt_id").notNull().references(() => rt.id, { onDelete: "cascade" }),
  wargaId: uuid("warga_id").notNull().references(() => warga.id, { onDelete: "cascade" }),
  jenis: text("jenis").notNull(),
  judul: text("judul").notNull(),
  isi: text("isi").notNull(),
  dataLink: text("data_link"),
  dibacaAt: timestamp("dibaca_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pengirimanNotifikasi = pgTable("pengiriman_notifikasi", {
  id: uuid("id").primaryKey().defaultRandom(),
  notifikasiId: uuid("notifikasi_id").notNull().references(() => notifikasi.id, { onDelete: "cascade" }),
  kanal: notifikasiKanalEnum("kanal").notNull().default("push"),
  template: text("template"),
  providerMessageId: text("provider_message_id"),
  status: pengirimanStatusEnum("status").notNull().default("antri"),
  percobaan: integer("percobaan").notNull().default(0),
  waktuKirim: timestamp("waktu_kirim", { withTimezone: true }),
  ...timestamps,
});

export const perangkat = pgTable("perangkat", {
  id: uuid("id").primaryKey().defaultRandom(),
  wargaId: uuid("warga_id").notNull().references(() => warga.id, { onDelete: "cascade" }),
  fcmToken: text("fcm_token").notNull(),
  platform: varchar("platform", { length: 20 }).notNull(),
  terakhirAktif: timestamp("terakhir_aktif", { withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
}, (t) => [
  uniqueIndex("perangkat_fcm_token_idx").on(t.fcmToken),
]);

export const rtRelations = relations(rt, ({ many }) => ({
  warga: many(warga),
  pos: many(pos),
  jadwalTemplate: many(jadwalTemplate),
  giliran: many(giliran),
  kas: many(kas),
  riwayat: many(riwayat),
}));

export const wargaRelations = relations(warga, ({ one, many }) => ({
  rt: one(rt, { fields: [warga.rtId], references: [rt.id] }),
  peran: many(peranWarga),
  perangkat: many(perangkat),
}));

export const giliranRelations = relations(giliran, ({ one, many }) => ({
  pos: one(pos, { fields: [giliran.posId], references: [pos.id] }),
  wargaAsli: one(warga, { fields: [giliran.wargaIdAsli], references: [warga.id] }),
  wargaBertugas: one(warga, { fields: [giliran.wargaIdBertugas], references: [warga.id] }),
  checkin: many(checkin),
  denda: many(denda),
}));

export const dendaRelations = relations(denda, ({ one, many }) => ({
  giliran: one(giliran, { fields: [denda.giliranId], references: [giliran.id] }),
  warga: one(warga, { fields: [denda.wargaId], references: [warga.id] }),
  pembayaran: many(pembayaran),
}));
