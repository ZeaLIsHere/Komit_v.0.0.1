# Prosedur Backup & Restore Database PostgreSQL — Komit Platform

Dokumen ini menjelaskan prosedur pencadangan (backup) dan pemulihan (restore) database PostgreSQL (Neon / Railway / Self-Hosted) untuk menjaga keandalan data pemantauan tugas besar.

---

## 1. Cadangan Otomatis Cloud (Disarankan)

- **Neon PostgreSQL**: Fitur Point-in-Time Recovery (PITR) aktif secara default hingga 7-30 hari pada branch database.
- **Railway Managed Postgres**: Backups otomatis harian tersedia di tab **Backups** pada dashboard project.

---

## 2. Prosedur Manual Backup (pg_dump)

Jalankan perintah berikut melalui terminal yang memiliki utilitas `postgresql-client` / `pg_dump`:

### A. Format SQL Plain Text
```bash
pg_dump "$DIRECT_URL" --format=plain --no-owner --no-acl -f backup_komit_$(date +%Y%m%d_%H%M%S).sql
```

### B. Format Binary Compressed (Dianjurkan untuk data besar)
```bash
pg_dump "$DIRECT_URL" --format=custom --compress=9 --no-owner --no-acl -f backup_komit_$(date +%Y%m%d_%H%M%S).dump
```

*Catatan: Selalu gunakan `DIRECT_URL` (koneksi direct non-pooler) saat menjalankan `pg_dump` untuk menghindari koneksi terputus di tengah proses dump.*

---

## 3. Prosedur Pemulihan (Restore)

### A. Dari File SQL Plain
```bash
psql "$DIRECT_URL" -f backup_komit_YYYYMMDD_HHMMSS.sql
```

### B. Dari File Custom Binary
```bash
pg_restore -d "$DIRECT_URL" --clean --if-exists --no-owner --no-acl backup_komit_YYYYMMDD_HHMMSS.dump
```

---

## 4. Skrip Otomatisasi Harian (Cron / Linux Server)

Buat file executable `backup.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/komit"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/komit_$TIMESTAMP.dump"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Memulai pencadangan database..."
pg_dump "$DIRECT_URL" --format=custom --compress=9 -f "$FILENAME"

# Hapus backup yang lebih tua dari 14 hari
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +14 -exec rm {} +

echo "[$(date)] Backup selesai: $FILENAME"
```

Pasang di `crontab -e`:
```cron
# Jalankan setiap hari pukul 02:00 WIB (19:00 UTC)
0 19 * * * /bin/bash /var/backups/komit/backup.sh >> /var/log/komit_backup.log 2>&1
```
