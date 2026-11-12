CREATE TYPE "public"."checkin_metode" AS ENUM('qr', 'manual');--> statement-breakpoint
CREATE TYPE "public"."denda_status" AS ENUM('belum_bayar', 'menunggu_verifikasi', 'lunas', 'dibebaskan');--> statement-breakpoint
CREATE TYPE "public"."giliran_status" AS ENUM('terjadwal', 'hadir', 'tidak_hadir');--> statement-breakpoint
CREATE TYPE "public"."kas_jenis" AS ENUM('masuk', 'keluar');--> statement-breakpoint
CREATE TYPE "public"."notifikasi_kanal" AS ENUM('push');--> statement-breakpoint
CREATE TYPE "public"."pembayaran_metode" AS ENUM('tunai', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."pengiriman_status" AS ENUM('antri', 'terkirim', 'dibaca', 'gagal');--> statement-breakpoint
CREATE TYPE "public"."peran" AS ENUM('admin', 'bendahara', 'petugas', 'warga');--> statement-breakpoint
CREATE TYPE "public"."tukar_jenis" AS ENUM('tukar', 'digantikan');--> statement-breakpoint
CREATE TYPE "public"."tukar_status" AS ENUM('menunggu', 'diterima', 'ditolak', 'kedaluwarsa');--> statement-breakpoint
CREATE TABLE "checkin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"giliran_id" uuid NOT NULL,
	"waktu" timestamp with time zone DEFAULT now() NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"metode" "checkin_metode" NOT NULL,
	"dicatat_oleh" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "denda" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"giliran_id" uuid NOT NULL,
	"warga_id" uuid NOT NULL,
	"nominal" numeric(12, 2) NOT NULL,
	"status" "denda_status" DEFAULT 'belum_bayar' NOT NULL,
	"alasan_bebas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "giliran" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rt_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"pos_id" uuid NOT NULL,
	"warga_id_asli" uuid NOT NULL,
	"warga_id_bertugas" uuid NOT NULL,
	"status" "giliran_status" DEFAULT 'terjadwal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jadwal_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rt_id" uuid NOT NULL,
	"hari" integer NOT NULL,
	"minggu_ke" integer,
	"pos_id" uuid NOT NULL,
	"warga_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rt_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"jenis" "kas_jenis" NOT NULL,
	"kategori" text NOT NULL,
	"nominal" numeric(12, 2) NOT NULL,
	"keterangan" text,
	"nota_url" text,
	"ref_denda_id" uuid,
	"dicatat_oleh" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifikasi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rt_id" uuid NOT NULL,
	"warga_id" uuid NOT NULL,
	"jenis" text NOT NULL,
	"judul" text NOT NULL,
	"isi" text NOT NULL,
	"data_link" text,
	"dibaca_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pembayaran" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"denda_id" uuid NOT NULL,
	"metode" "pembayaran_metode" NOT NULL,
	"bukti_url" text,
	"diverifikasi_oleh" uuid,
	"waktu" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengaturan" (
	"rt_id" uuid PRIMARY KEY NOT NULL,
	"jam_mulai" varchar(5) DEFAULT '22:00' NOT NULL,
	"jam_selesai" varchar(5) DEFAULT '04:00' NOT NULL,
	"batas_checkin" varchar(5) DEFAULT '01:00' NOT NULL,
	"batas_tukar_jam" varchar(5) DEFAULT '18:00' NOT NULL,
	"batas_tukar_h_min" integer DEFAULT 1 NOT NULL,
	"nominal_denda" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengiriman_notifikasi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notifikasi_id" uuid NOT NULL,
	"kanal" "notifikasi_kanal" DEFAULT 'push' NOT NULL,
	"template" text,
	"provider_message_id" text,
	"status" "pengiriman_status" DEFAULT 'antri' NOT NULL,
	"percobaan" integer DEFAULT 0 NOT NULL,
	"waktu_kirim" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peran_warga" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warga_id" uuid NOT NULL,
	"peran" "peran" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "perangkat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warga_id" uuid NOT NULL,
	"fcm_token" text NOT NULL,
	"platform" varchar(20) NOT NULL,
	"terakhir_aktif" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rt_id" uuid NOT NULL,
	"nama" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"radius_m" integer DEFAULT 100 NOT NULL,
	"qr_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "riwayat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rt_id" uuid NOT NULL,
	"aktor_id" uuid NOT NULL,
	"aksi" text NOT NULL,
	"objek" text NOT NULL,
	"objek_id" uuid NOT NULL,
	"data_lama" jsonb,
	"data_baru" jsonb,
	"waktu" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" text NOT NULL,
	"alamat" text,
	"zona_waktu" varchar(20) DEFAULT 'Asia/Jakarta' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tukar_giliran" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jenis" "tukar_jenis" NOT NULL,
	"giliran_asal_id" uuid NOT NULL,
	"giliran_balasan_id" uuid,
	"pengaju_id" uuid NOT NULL,
	"penerima_id" uuid NOT NULL,
	"status" "tukar_status" DEFAULT 'menunggu' NOT NULL,
	"batas_waktu" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warga" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rt_id" uuid NOT NULL,
	"nama" text NOT NULL,
	"no_hp" varchar(20) NOT NULL,
	"alamat" text,
	"wajib_ronda" boolean DEFAULT true NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"pin_hash" text,
	"gagal_login" integer DEFAULT 0 NOT NULL,
	"terkunci_sampai" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checkin" ADD CONSTRAINT "checkin_giliran_id_giliran_id_fk" FOREIGN KEY ("giliran_id") REFERENCES "public"."giliran"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin" ADD CONSTRAINT "checkin_dicatat_oleh_warga_id_fk" FOREIGN KEY ("dicatat_oleh") REFERENCES "public"."warga"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "denda" ADD CONSTRAINT "denda_giliran_id_giliran_id_fk" FOREIGN KEY ("giliran_id") REFERENCES "public"."giliran"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "denda" ADD CONSTRAINT "denda_warga_id_warga_id_fk" FOREIGN KEY ("warga_id") REFERENCES "public"."warga"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "giliran" ADD CONSTRAINT "giliran_rt_id_rt_id_fk" FOREIGN KEY ("rt_id") REFERENCES "public"."rt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "giliran" ADD CONSTRAINT "giliran_pos_id_pos_id_fk" FOREIGN KEY ("pos_id") REFERENCES "public"."pos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "giliran" ADD CONSTRAINT "giliran_warga_id_asli_warga_id_fk" FOREIGN KEY ("warga_id_asli") REFERENCES "public"."warga"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "giliran" ADD CONSTRAINT "giliran_warga_id_bertugas_warga_id_fk" FOREIGN KEY ("warga_id_bertugas") REFERENCES "public"."warga"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal_template" ADD CONSTRAINT "jadwal_template_rt_id_rt_id_fk" FOREIGN KEY ("rt_id") REFERENCES "public"."rt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal_template" ADD CONSTRAINT "jadwal_template_pos_id_pos_id_fk" FOREIGN KEY ("pos_id") REFERENCES "public"."pos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal_template" ADD CONSTRAINT "jadwal_template_warga_id_warga_id_fk" FOREIGN KEY ("warga_id") REFERENCES "public"."warga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kas" ADD CONSTRAINT "kas_rt_id_rt_id_fk" FOREIGN KEY ("rt_id") REFERENCES "public"."rt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kas" ADD CONSTRAINT "kas_ref_denda_id_denda_id_fk" FOREIGN KEY ("ref_denda_id") REFERENCES "public"."denda"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kas" ADD CONSTRAINT "kas_dicatat_oleh_warga_id_fk" FOREIGN KEY ("dicatat_oleh") REFERENCES "public"."warga"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_rt_id_rt_id_fk" FOREIGN KEY ("rt_id") REFERENCES "public"."rt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_warga_id_warga_id_fk" FOREIGN KEY ("warga_id") REFERENCES "public"."warga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_denda_id_denda_id_fk" FOREIGN KEY ("denda_id") REFERENCES "public"."denda"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_diverifikasi_oleh_warga_id_fk" FOREIGN KEY ("diverifikasi_oleh") REFERENCES "public"."warga"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengaturan" ADD CONSTRAINT "pengaturan_rt_id_rt_id_fk" FOREIGN KEY ("rt_id") REFERENCES "public"."rt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengiriman_notifikasi" ADD CONSTRAINT "pengiriman_notifikasi_notifikasi_id_notifikasi_id_fk" FOREIGN KEY ("notifikasi_id") REFERENCES "public"."notifikasi"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peran_warga" ADD CONSTRAINT "peran_warga_warga_id_warga_id_fk" FOREIGN KEY ("warga_id") REFERENCES "public"."warga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perangkat" ADD CONSTRAINT "perangkat_warga_id_warga_id_fk" FOREIGN KEY ("warga_id") REFERENCES "public"."warga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos" ADD CONSTRAINT "pos_rt_id_rt_id_fk" FOREIGN KEY ("rt_id") REFERENCES "public"."rt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riwayat" ADD CONSTRAINT "riwayat_rt_id_rt_id_fk" FOREIGN KEY ("rt_id") REFERENCES "public"."rt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riwayat" ADD CONSTRAINT "riwayat_aktor_id_warga_id_fk" FOREIGN KEY ("aktor_id") REFERENCES "public"."warga"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tukar_giliran" ADD CONSTRAINT "tukar_giliran_giliran_asal_id_giliran_id_fk" FOREIGN KEY ("giliran_asal_id") REFERENCES "public"."giliran"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tukar_giliran" ADD CONSTRAINT "tukar_giliran_giliran_balasan_id_giliran_id_fk" FOREIGN KEY ("giliran_balasan_id") REFERENCES "public"."giliran"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tukar_giliran" ADD CONSTRAINT "tukar_giliran_pengaju_id_warga_id_fk" FOREIGN KEY ("pengaju_id") REFERENCES "public"."warga"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tukar_giliran" ADD CONSTRAINT "tukar_giliran_penerima_id_warga_id_fk" FOREIGN KEY ("penerima_id") REFERENCES "public"."warga"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warga" ADD CONSTRAINT "warga_rt_id_rt_id_fk" FOREIGN KEY ("rt_id") REFERENCES "public"."rt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "peran_warga_warga_id_peran_idx" ON "peran_warga" USING btree ("warga_id","peran");--> statement-breakpoint
CREATE UNIQUE INDEX "perangkat_fcm_token_idx" ON "perangkat" USING btree ("fcm_token");--> statement-breakpoint
CREATE UNIQUE INDEX "warga_rt_id_no_hp_idx" ON "warga" USING btree ("rt_id","no_hp");