# Precise Vector Studio

Catatan status: 15 September 2026. Aplikasi lokal untuk mengubah PNG, JPG, dan JPEG menjadi SVG/EPS. Fokus saat ini: line icon, ilustrasi hitam-putih, dan grafis warna datar. Kualitas belum sempurna atau dijamin lolos microstock.

## Menjalankan server

Buka **Command Prompt (CMD)** dan jalankan:

```bat
cd /d "C:\Users\Windows 10\Documents\Codex\2026-09-12\apa"
node server.cjs
```

Jika `node` tidak dikenali, gunakan runtime yang tersedia di komputer ini:

```bat
cd /d "C:\Users\Windows 10\Documents\Codex\2026-09-12\apa"
"C:\Users\Windows 10\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.cjs
```

Buka **http://127.0.0.1:4173/** di browser. Biarkan terminal tetap berjalan. Hentikan dengan **Ctrl+C**. Server hanya mendengarkan koneksi lokal pada port 4173 dan menyajikan folder `dist`. Tidak perlu `npm install`, build, atau API key untuk tracing yang tersedia di UI.

- `EADDRINUSE`: port 4173 sudah dipakai. Coba buka alamat aplikasi; jangan menjalankan server kedua jika aplikasi sudah aktif.
- Halaman tidak terbuka: cek terminal masih hidup dan menampilkan `Local: http://127.0.0.1:4173/`.
- Perubahan belum terlihat: refresh halaman. **Unduh hasil terlebih dahulu** karena antrean dan hasil berada di memori browser.

## Sudah sampai mana?

| Area | Status saat ini |
| --- | --- |
| P0 — koreksi dasar | Sampler cubic Bézier dan satuan toleransi diperbaiki; indikator tidak lagi mengklaim validasi penuh. |
| P1 — shared boundaries | Bidang warna/mono memakai graph batas bersama. Refine satu batas memperbarui kedua bidang; induk lubang disimpan dari topologi raster. |
| P2 — preprocessing/sub-pixel | Denoise ringan dan estimasi batas dari warna/alpha sumber. Kandidat konservatif; bukan restorasi gambar atau AI segmentation. |
| P3 — validasi geometri | Pemeriksaan persilangan proper, overlap kolinear, winding/luas, dan induk lubang pada kurva yang didekati sampai 0,05 px. Belum lengkap untuk semua jenis kontak. |
| P4 | Belum disepakati atau diimplementasikan sebagai tahap tersendiri. Render-and-compare optimization menyeluruh untuk bidang warna belum tersedia. |
| Line Icon | Centerline dengan stroke seragam, refinement lokal, geometri, gap opsional, dan simetri vertikal/horizontal/180°. Bukan validator bidang P3. |
| Grafis warna | Toleransi menyesuaikan gambar kecil; label anti-aliasing memakai pasangan warna yang didukung tetangga lokal dalam mode otomatis. Masih perlu pengujian lebih luas. |

**Perilaku P3 terbaru:** kurva smoothing yang ditolak dicoba ulang dengan kurva awal. Jika masih tidak lolos, hasil ditampilkan dengan peringatan. Aplikasi **tidak lagi otomatis mengganti seluruh hasil ke kontur raster**. Pemeriksaan berat tidak diulang setiap kali preview/SVG/EPS diperbarui. Edit graph melalui Refine tetap diperiksa secara transaksional. Jangan menganggap hasil yang bisa diunduh otomatis bebas cacat.

## Fitur pengguna

- Input PNG/JPG/JPEG dengan pemeriksaan header: maksimal 25 MB/file, 40 megapiksel, 32.768 px per sisi.
- Profil Seimbang, Detail Tinggi, Line Icon, mono, dan pengaturan manual.
- Detail, Smoothing, pemilihan warna otomatis/manual, pembersihan area kecil, alpha, dan resolusi pemrosesan 800/1.000/1.200/1.400/1.600 px.
- Parameter memicu konversi otomatis; slider Detail/Smoothing memproses setelah dilepas.
- Preview Asli, Bandingkan, Vektor, Asli + Path, dan Path saja. Warna hasil terlihat pada mode Vektor; overlay Asli + Path masih memakai raster sumber.
- Refine: pilih kontur/node, luruskan rentang, preview geometri lokal, Apply/Cancel, dan Undo.
- Palet editable lewat pemilih warna atau kode HEX.
- Ekspor SVG/EPS dan preview PNG. Pilihan sisi panjang 2.000/4.000/5.000/6.000 px atau ukuran asli; proporsi dipertahankan.

## Bulk dan tata letak terbaru

1. Klik kotak upload atau drag-and-drop beberapa gambar. Kotak menampilkan jumlah file dan ukuran total.
2. File tampil horizontal di atas tab preview. Klik thumbnail untuk memilih sumber/hasil; edit nama langsung pada kartu.
3. Atur parameter, lalu klik **Mulai** di bawah upload. Antrean memakai snapshot pengaturan saat Mulai ditekan, diproses berurutan.
4. Loading bar bergerak saat proses (bukan persentase terukur), centang hijau saat berhasil, silang merah beserta alasan jika gagal. Hentikan mempertahankan hasil yang sudah selesai.
5. Pilih SVG, EPS, atau keduanya dan **Unduh ZIP**. Nama sama diberi suffix agar tidak bertabrakan. Unduhan individual juga memakai nama editan.

Batas antrean: 30 gambar / total input 150 MB, total teks hasil SVG+EPS 150 MB, timeout 2 menit per file. Tidak ada penyimpanan sesi permanen. Tombol Mulai melewati hasil yang sudah selesai; gunakan Buat vektor untuk memproses ulang file terpilih. Pengaturan ulang dan edit individual perlu diperiksa sebelum ZIP diunduh.

## Keterbatasan / pekerjaan berikutnya

- **Ukuran EPS vs CorelDRAW belum diperbaiki:** exporter masih memakai angka sisi ekspor sebagai point PostScript. Label px di UI tidak menjamin ukuran px yang sama saat impor; DPI dokumen tujuan memengaruhi konversinya. SVG dan PNG memiliki perilaku satuan berbeda.
- P3 belum menjamin kontak tangensial, kontak endpoint non-junction, perpindahan seluruh komponen ke bidang lain, atau cacat di bawah toleransi.
- Line Icon belum menjalankan validator bidang P3; junction kompleks dan simetri berbasis kelompok masih dapat salah. Evaluasi line refinement dibatasi maksimal 768 px dan dapat dilewati pada lebih dari 1.500 path.
- Tidak ada AI refinement aktif di UI. Server masih memiliki endpoint AI lama yang memerlukan konfigurasi terpisah, tetapi bukan bagian alur tracing saat ini.
- Tidak ada variable-width stroke, rekonstruksi semantik, atau optimasi render ulang menyeluruh pada grafis warna.
- Detail kecil/warna aksen, huruf, radius sudut, dan pemisahan tepi masih perlu benchmark tambahan. Penurunan jumlah node bukan bukti kualitas visual meningkat.
- Belum ada deployment publik terbaru yang diverifikasi; alamat di atas adalah server lokal.

## Bukti pengujian yang sudah dilakukan

- Graph: 512 pola label kecil, shared-edge edit, lubang, closure, Undo, dan ekspor.
- Fixture geometri: lingkaran, elips, rectangle, rounded rectangle, rectangle miring, dan penolakan bentuk organik.
- PNG rumah asli: perbaikan timeout detektor lingkaran dan perbaikan gerigi pada tangga; hasil hitam-putih 2 warna / 11.840 segmen pada Seimbang. Detail Tinggi juga berhasil diproses setelah perbaikan loop kecil. Peringatan topologi masih bisa muncul.
- Logo INSIDE OUT 283×270: bidang 146 → 28, segmen 1.392 → 678, RGB MAE 1,343 → 1,220 pada skala 0–255; pemeriksaan P3 lulus untuk fixture tersebut. Bendera dan detail sudut belum eksak.
- Browser: multi-upload JPG/JPEG/PNG, preview antarfile, rename, ZIP, indikator proses/sukses/gagal, dan penolakan signature tidak valid.

Waktu proses yang pernah dilaporkan merupakan pengukuran lokal, bukan jaminan performa. Belum semua skenario telah diuji secara menyeluruh.

## Struktur proyek

| Lokasi | Fungsi |
| --- | --- |
| `server.cjs` | Server HTTP lokal. |
| `dist/index.html`, `style.css`, `app.js` | UI dan konversi tunggal. |
| `dist/bulk.js`, `raster-input.js` | Antrean, preview/rename, ZIP, validasi input. |
| `dist/trace-worker.js` | Pipeline tracing di worker. |
| `dist/auto-palette.js`, `subpixel.js` | Deteksi warna, label tepi, denoise/sub-pixel. |
| `dist/vector-graph.js`, `topology.js` | Batas bersama dan validator. |
| `dist/smart-curve.js`, `geometry-fit.js` | Fitting kurva dan primitive. |
| `dist/line-icon.js`, `line-refine.js` | Centerline dan refinement stroke seragam. |
| `dist/refine.js`, `refine-geometry.js` | Edit geometri interaktif. |
| `dist/engine.js` | Materialisasi objek, statistik, SVG/EPS. |
| `REFINEMENT.md` | Riwayat teknis perubahan; beberapa bagian lama sudah digantikan perilaku terbaru di README ini. |
| `work/` | Fixture, skrip uji, helper migrasi, screenshot. **Jangan menjalankan ulang helper integrasi/migrasi**: beberapa memakai penggantian teks sekali pakai. |
| `outputs/` | Contoh hasil dan paket `Precise-Vector-Studio.zip`. |

Contoh menjalankan tes dari root proyek dengan Node tersedia di PATH (tes browser memerlukan server aktif dan Playwright pada path runtime yang tertulis dalam skrip):

```bat
node work\test-ink-palette.cjs
node work\test-color-logo.cjs check
node work\test-strip.cjs
```

Sebagian tes lama masih mengasumsikan UI/fallback versi sebelumnya. Sesuaikan dengan perilaku terbaru sebelum menjadikannya pemeriksaan regresi; jangan mengubah assertion hanya untuk menyembunyikan kegagalan.

## Animasi Line Icon (fitur baru)

Pada hasil profil **Line Icon**, klik **Animasi garis** di toolbar preview. Pilih durasi 5/10/15 detik, landscape 1920×1080 atau portrait 1080×1920, urutan atas–bawah/kiri–kanan/garis panjang, serta draw-on berurutan atau serentak. Warna garis/latar dan pengali ketebalan dapat diubah. Play/Pause dan Ulang tersedia. Artwork dipusatkan dengan margin, tanpa merusak proporsi; hasil lengkap ditahan pada 10% akhir durasi.

**Unduh MP4 · 60 fps** merender frame di browser, memakai WebCodecs H.264 dan muxer MP4 lokal (tanpa audio). Tidak memerlukan FFmpeg atau API. Browser harus menyediakan encoder AVC; jika tidak, ekspor menampilkan pesan dukungan. Ekspor memiliki progress frame dan tombol batal. Durasi/frame tidak bergantung pada kecepatan preview. Setiap ekspor mengambil hasil file yang aktif saat dialog dibuka; hasil tracing bidang biasa belum didukung.

Diuji di Edge headless: MP4 landscape 5 detik dan portrait 15 detik dapat dibaca kembali dengan ukuran/durasi benar; tabel sample 15 detik berisi 900 frame dengan timebase 60. Kompleksitas artwork memengaruhi waktu rendering. Ini bukan ekspor animasi bulk.

## Morphing
Fitur Morph A → B dihapus atas permintaan pengguna. Animasi draw-on dan ekspor MP4 tetap tersedia.

### Panel pengaturan ringkas
Pilihan utama: Jenis gambar, Detail, dan Warna. Jumlah warna tampil saat mode manual. Pengaturan lanjutan berisi kehalusan kurva, pembersihan area kecil, resolusi, dan latar. Profil Line Icon menampilkan lebar garis dan bagian Perbaikan garis.


### Fitting kurva adaptif
Fitting jalur terbuka memakai sampling jarak seragam, deteksi sudut dua skala, dan fairing terbatas. Pembagian rekursif mempertahankan arah tangen. Diuji pada kurva berpiksel, sudut, diagonal, input degenerat, serta worker ilustrasi/Line Icon. Hasil setiap gambar tetap perlu diperiksa; validasi topologi dapat mempertahankan kurva sebelumnya.


### P1 warna lokal
Mode warna otomatis kini menilai dukungan warna pada area 32 × 32 piksel, selain frekuensi global. Aksen dengan interior stabil dapat dipertahankan meski kecil secara global. Palet datar mendukung hingga 64 warna tanpa fallback 16 warna hanya karena melewati 32 warna. Ini analisis area lokal, belum segmentasi setiap ikon. Mode manual dan Line Icon tidak memakai detektor ini. Uji: aksen 8 × 8 pada gambar 1000 × 1000, lembar 40 warna, dua warna, serta tinta hitam putih.

### P2 warna campuran pada tepi
Koreksi label warna otomatis memakai interior dengan dukungan tetangga, pencarian lokal radius 3 piksel, serta pasangan warna pada sisi berlawanan. Maksimal empat kandidat lokal membatasi biaya. Campuran ambigu dipertahankan; warna detail yang cocok persis dan alpha parsial tidak diubah oleh tahap ini. Koreksi hanya mengubah label, bukan piksel sumber; penyesuaian batas subpiksel tetap memakai sumber. Uji sintetis: campuran tepi, aksen satu piksel, alpha parsial, dan warna di luar campuran; smoke test worker ilustrasi dan Line Icon. Belum divalidasi visual pada file ikon asli pengguna.

### P3 perlindungan detail kecil berwarna
Sebelum menggabungkan area kecil, mode color memeriksa kecocokan piksel sumber dengan warna area (minimal separuh piksel, jarak RGB maksimal 24), lalu kontras terhadap tujuan penggabungan (jarak RGB minimal 60 atau perbedaan alpha di atas 128). Aksen dan lubang transparan yang didukung sumber dipertahankan; jumlahnya tersedia di analysis.protectedDetails. Mode mono/ink/Line Icon tetap seperti sebelumnya. Ini heuristik konservatif, bukan pengenalan mata/simbol: noise kontras tinggi bisa ikut dipertahankan, sedangkan detail yang sudah hilang saat kuantisasi tidak dapat dipulihkan. Uji graph nyata: aksen 1 piksel, lubang transparan, noise kontras rendah, warna tanpa bukti sumber, serta regresi mono; smoke test browser lulus.

### P4 konsistensi batas bersama
Batas bersama sudah memakai satu geometri untuk dua bidang. Audit tambahan sekarang memeriksa arah kepemilikan, penggunaan tepat sekali per sisi, serta kesamaan segmen kontur hasil dengan graph. Audit ringan berjalan saat validasi dan sebelum SVG/EPS dibuat; kontur yang tidak sinkron ditolak. Tidak menggantikan pemeriksaan interseksi topologi dan tidak menjamin bebas artefak antialiasing pada semua viewer. Uji: pertemuan tiga warna setelah smoothing, kontur bergeser, arah salah, referensi ganda, dan sinkronisasi edit bersama.

### P5 model geometri
Fitting jalur kini mencoba model garis lurus dengan ujung terkunci, batas deviasi, dan pemeriksaan gerak balik sebelum Bézier. Detektor lingkaran/elips/persegi/sudut membulat hanya menerima kontur tertutup dan menghormati toleransi di bawah 0,7 px (minimum 0,1). Model yang gagal tetap memakai kurva hasil fitting. Uji lingkaran, persegi, penolakan busur terbuka, diagonal, endpoint, toleransi, dan pembalikan arah lulus; konversi browser ilustrasi dan Line Icon lulus. Belum dievaluasi pada lembar ikon asli pengguna; pengenalan geometri kompleks tetap terbatas.

### P6 evaluasi visual
Hasil SVG dirender ulang pada maksimal 768 px dan dibandingkan dengan sumber di atas latar putih. Panel Pemeriksaan file menampilkan selisih RGB rata-rata, area dengan selisih rata-rata kanal >32/255, tepi tanpa pasangan (ambang gradien 40/255, toleransi posisi 1 piksel), dan heatmap. Metrik tersimpan pada result.visualAudit untuk hasil yang sedang dievaluasi; ini diagnostik, bukan skor kelulusan atau optimasi otomatis. Transparansi terhadap latar selain putih dan detail di bawah resolusi evaluasi belum tercakup. Uji browser render identik (nol), objek dihapus (25% area, 100% tepi hilang), dan tampilan heatmap lulus.
`nPalet hasil: Hapus menjadikan warna transparan; Gabung ke warna menyamakan warna semua objek terkait dengan warna palet tujuan, tanpa union geometri. Undo warna tersedia untuk 20 aksi hapus/gabung terakhir per hasil. Tracing ulang mengganti edit. Uji browser gabung/hapus/undo lulus.

### Regresi labu 17 September
Diuji pada ChatGPT Image 17 Sep 2026, 20.11.47.png, profil balanced 1200 px. Perbaikan: fallback smoothing lokal berdasarkan error.edges, maksimal 32 percobaan; serpihan kecil warna campuran digabung ke tetangga; centroid palet otomatis yang berjarak RGB <24 dikonsolidasikan. Sebelum: 3577 path/33958 segmen, fallback 9887 batas. Sesudah: 2250 path/13193 segmen, fallback 63 batas. Error RGB 0,8914% menjadi 0,9093%; tepi tambahan 1,7895% menjadi 1,1504%, tepi hilang 0,1365% menjadi 0,3347%. Topologi masih belum lulus: hasil lebih sederhana bukan jaminan seluruh geometri valid. SVG/PNG contoh di outputs/pumpkin-refined.*. Uji palet lokal dan perlindungan detail lulus.

### Lindungi outline gelap
Toggle baru aktif default untuk mode color: pulihkan label piksel gelap berkontras lokal, lindungi komponen gelap minimal 4 piksel dari pembersihan, dan batasi fitting batas gelap ke 0,25 px / smoothing 0,35 px. Tidak menambahkan stroke ke semua bidang; membutuhkan warna gelap dalam palet. Pada labu: 3551 label dipulihkan, segmen 30641, mean difference 0,8521%, missing edges 0,1585%; sebelumnya 0,9093% dan 0,3347%. Topologi masih belum lulus; ini perlindungan berbasis raster, bukan rekonstruksi centerline sempurna. Dapat mempertahankan noise gelap dan menambah node.
Outline continuity: ridge gelap antialias dipulihkan jika lebih gelap dari kedua sisi. Celah satu piksel disambung hanya bila sumber masih gelap dan kedua ujung cocok. Toleransi fitting outline 0,5 / smart 0,65. Labu: 17508 segmen, MAE 0,8263%, tepi hilang 0,1233%, topologi masih belum lulus. Uji celah terang/transparan tidak ditutup.
Outline mask: mask netral gelap dibangun sebelum kuantisasi, pertumbuhan lemah dibatasi satu piksel. Label mask dikunci ulang sesudah koreksi warna, dilindungi saat cleanup, batas gelap difairing terbatas sebelum fitting. Bukan layer stroke/centerline terpisah. Labu: 13109 segmen, MAE 0,7440%, missing edges 0,0330%, extra edges 1,2404%; topologi tetap belum lulus. Test mask, transparansi, dan pembatasan pertumbuhan lulus.
Outline refinement: alias palet berjarak RGB <32 dari outline utama disatukan sebelum graph. Fitting khusus outline hanya berlaku pada label outline utama, radius fairing 3 dengan perpindahan tetap dibatasi 0,5 px; toleransi fitting maksimal 0,85 dan smart 1 px. Sampel labu menghasilkan 9498 segmen; topologi masih belum lulus dan ujung tipis masih bisa putus. Preview terbaru outputs/pumpkin-outline.png.
Outline layer: mask traced independently as binary graph, dark contours exported last over color fills. Overlay has 1px processing-width edge stroke (0,5 px expansion per side), SVG and EPS. Lasso excludes overlay; palette color merge/delete follows original palette index. Labu crop 3x shows smoother long curve but small green edge fragments remain; topology still unchecked/failed. Not a complete bleed fix; expansion changes thickness. Artifact outputs/outline-layer-crop.png.

### Outline reconciliation (18 September)
Overlay now uses the final restored ink labels instead of the pre-restoration threshold mask. A frozen one-ring neighborhood repairs incorrect color labels only when source RGB supports ink or an ink-dominant local mixture; source-matching colors and transparent pixels are retained. Pumpkin regression: 1416 labels repaired, 1466 paths / 10311 segments, 6.26 s. Crop at 3x: long edge green fragments removed; small corner irregularities remain. Global RGB difference increased to 0.8700%, so this is a local outline improvement, not universal fidelity improvement. Main and overlay topology checks still report intersections. Tests: reconciliation, mask growth, continuity, and shared-boundary ownership pass. Latest crop: outputs/outline-reconciled-crop.png.

Thin outline recovery: source-supported ridge hysteresis connects weak antialias pixels to established ink, capped at 64 pixels of growth. Requires darker source than both flanks and ink mixture evidence from at least one flank, and excludes source-matching palette colors and transparent pixels. Synthetic tail/gap and existing reconciliation/continuity tests pass. Pumpkin: 1207 recovered pixels, 1375 paths, 9943 segments, 7.69 seconds. Crop outputs/outline-thin-crop.png shows fewer detached dots, but the endpoint is still blunt and does not reproduce the full source taper. Global difference 0.8911%; topology still fails. This is partial recovery, not completed variable-width taper reconstruction.
