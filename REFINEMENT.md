# Kontrol tracing dan Refine Geometri

Jalankan `node server.cjs`, lalu buka http://127.0.0.1:4173/.

- Detail (0–100) menggantikan toleransi kurva: nilai tinggi mengikuti detail lebih dekat. Pemetaan toleransi adalah 3 − 2,9 × Detail/100 piksel pemrosesan.
- Smoothing (0–100) menggantikan toleransi Smart Curve: nilai tinggi menyederhanakan kurva. Pemetaan toleransi adalah 0,5 + 3,5 × Smoothing/100 piksel pemrosesan. Kontrol ini nonaktif ketika Smart Curve dimatikan dan disembunyikan pada Line Icon.
- Pertahankan sudut tajam masih berupa toggle; tidak ada slider Corner smoothness karena mesin belum menyediakan kontrol kontinu tersebut.
- Slider dan input angka tersinkron; perubahan memicu tracing otomatis. Profil Line Icon tetap dipertahankan.
- AI Refine dihapus dari antarmuka dan tidak ada permintaan AI dari browser.

Untuk Refine Geometri, aktifkan Refine node dan klik kontur. Pilih bentuk, klik Pratinjau geometri, lalu Terapkan atau Batal. Pilih dua node untuk garis atau kurva sebagian. Undo mengembalikan segmen sebelumnya. Batas deviasi diperiksa dengan sampling terhadap kontur vektor saat ini; periksa juga gambar asli dan sambungan sebelum ekspor.

## P0: koreksi toleransi dan kualitas

Toleransi aplikasi menggunakan jarak piksel pemrosesan. Nilai ini dikuadratkan saat diteruskan sebagai ltres/qtres ke ImageTracer, yang membandingkan jarak kuadrat. Fitter centerline dan Smart Curve tetap menerima jarak biasa. Hasil pada pengaturan Detail lama dapat berubah.

Sampler Smart Curve kini mengevaluasi cubic dengan kedua control point dan endpoint yang benar. Indikator hasil menjelaskan penutupan path saat ekspor, bukan mengklaim validasi topologi. Self-intersection, hole containment, celah dan overlap masih perlu diperiksa; validator topologi lengkap berada di tahap berikutnya.

## P1: shared-boundary graph

Mode warna dan mono kini memakai ImageTracer hanya untuk quantization. Peta label dibagi menjadi komponen terhubung; batas yang memisahkan dua face disimpan satu kali dalam graph. Setiap loop face mereferensikan edge tersebut dengan arah yang sesuai. Titik pertemuan dan sudut artboard dikunci. Detail mengatur fitting awal dalam jarak piksel, Smoothing mengatur fitting lanjutan; tidak ada lagi fitting ltres/qtres ImageTracer pada cabang graph aktif.

Refine memilih edge graph. Straighten, geometri, dan Undo memperbarui semua face yang memakai edge itu. Layer untuk SVG/EPS dimaterialisasi dari graph sebagai sumber data utama. File SVG/EPS menyimpan kontur bidang biasa dengan koordinat batas identik; hubungan graph editable tetap berada di sesi aplikasi, bukan metadata editor eksternal. Segmen batas unik pada laporan berbeda dari jumlah segmen ekspor yang dapat menyertakan kedua sisi batas.

Pembersihan area kecil menggabungkan komponen berperimeter pendek ke tetangga sebelum membuat graph, sehingga tidak menghapus face dan meninggalkan celah. Mode Line Icon tetap memakai skeleton dan stroke seragam.

Pemeriksaan P1 meliputi sambungan segmen, closure loop, koordinat finite, penguncian junction, dan pencarian induk hole. Shared boundaries tidak menjamin bebas persilangan antarbatas atau self-intersection setelah fitting; validasi topologi lengkap tetap P3. Anti-aliasing sub-pixel dan denoise tetap P2.

Pengujian: 512 pola label biner 3×3 untuk kepemilikan edge dan cakupan warna eksklusif; junction diagonal/tiga bidang; hole transparan; edit bersama dan Undo; penguncian endpoint; ekspor SVG/EPS; penggabungan area kecil; regresi circle/ellipse/rectangle/rounded rectangle/rotated rectangle dan bentuk organik; interaksi klik browser dan cabang Line Icon.

## Perbaikan hubungan induk lubang

Graph versi 2 menyimpan indeks induk untuk setiap hole berdasarkan topologi raster sebelum fitting. Materialisasi SVG/EPS memakai hubungan ini, bukan menguji titik raster lama terhadap kurva hasil edit. Referensi induk yang rusak tetap ditolak. Setelah memperbarui aplikasi, lakukan tracing ulang agar hasil memakai metadata baru. Tes meliputi perpindahan batas bersama yang valid, clone graph, pemulihan Undo, pola label, serta Refine dan ekspor melalui browser. Pemeriksaan self-intersection lengkap tetap terpisah dari perbaikan ini.

## Line Icon refinement

Pilih profil Line Icon dan aktifkan Refine line art. Semua path tetap memakai satu strokeWidth; lebar otomatis/manual tidak diganti oleh refinement. Tahap tambahan: recenter dengan penampang luminansi/alpha bilinear; kontraksi junction pendek dan penghapusan spur kecil; fitting geometri tertutup dan busur terbuka; penyelarasan tangent G1 pada sambungan cubic yang hampir searah; sambung celah dengan endpoint berhadapan; simetri vertikal/horizontal/180 derajat per kelompok garis.

Celah nonaktif secara default: aktifkan slider hanya jika dibutuhkan. Simetri otomatis memerlukan kemiripan sumber minimal 0,93, menjaga jumlah ujung/percabangan/loop/komponen, lalu memilih kandidat melalui render. Kelompok ditentukan dari overlap/kedekatan bounding box, bukan pengenalan semantik ikon. Rotasi yang didukung saat ini hanya 180 derajat.

Kandidat dirender dengan OffscreenCanvas, dibandingkan dengan tinta sumber pada maksimum 768 px per evaluasi. Error yang dilaporkan adalah selisih tinta dibagi jumlah tinta sumber, bukan skor akurasi atau persentase piksel seluruh gambar. Perubahan celah boleh menambah error tinta hingga 0,5 poin persentase; simetri memakai kelonggaran 0,1 poin. Hasil akhir di-rollback bila error naik lebih dari 0,6 poin. Evaluator yang tidak tersedia atau gambar lebih dari 1.500 path membatasi refinement; laporan menyebut keterbatasan ini.

Ini belum merupakan validasi lengkap self-intersection/G2 atau rekonstruksi semantik. Kandidat dapat ditolak dan hasil tetap perlu diperiksa. Pratinjau Original/Vector/Overlay, pilihan parameter, serta Undo untuk edit manual tetap tersedia.

Tes meliputi centerline yang sengaja bergeser, gap selektif, spur dan cluster junction, tangent G1, pemotongan cubic dengan beberapa persilangan sumbu, kesetaraan kurva hasil refleksi/rotasi, penolakan bentuk asimetris, busur terbuka, dan lembar laundry pengguna beserta ekspor SVG/EPS dan lebar manual.

## P2: denoise konservatif dan sub-pixel

Mode warna/mono membersihkan variasi RGB kecil dengan filter lokal 3×3 berbobot spasial/rentang (selisih kanal maksimal 18). Alpha dipertahankan; sampel semi-transparan dan detail kontras tinggi tidak dibaurkan. Ini bukan restorasi JPEG/deblur atau penghapusan seluruh noise. Sumber upload tidak dimutasi.

Sebelum fitting graph, Subpixel.adjust mengestimasi posisi batas melalui proyeksi warna premultiplied RGBA pada pasangan palette dan pencarian crossing bilinear sepanjang normal lokal. Threshold alpha/mono mengikuti pengaturan; warna memakai coverage 0,5. Pergeseran dibatasi 0,65 piksel dan ditolak pada kontras lemah, residual campuran besar, atau crossing yang tidak didukung. Junction, dua sampel dekat endpoint, serta batas artboard tetap. Kedua face tetap mereferensikan satu edge yang sama. Fitting berikutnya masih dipengaruhi Detail/Smoothing.

Tidak mengklaim rekonstruksi posisi asli yang eksak: bilinear coverage memiliki bias, terutama pada sudut, gambar blur dan beberapa warna yang bertemu. P2 tidak menambah validasi persilangan P3. Line Icon memakai pipeline centerline/refinement sebelumnya. Statistik sampel bergeser tersedia pada catatan hasil.

Validasi: fixture batas pecahan untuk warna opaque dan alpha, endpoint terkunci, sumber immutable, reduksi variasi kecil dan retensi titik kontras tinggi; 512 pola graph P1; browser klik shared edge, straighten, geometri Apply/Undo, EPS download, serta cabang Line Icon.

## P3: validasi geometri graph

Topology.check membagi Bézier adaptif sampai deviasi kontrol terhadap chord <=0,05 px, memakai grid spasial untuk persilangan proper dan overlap kolinear termasuk self-intersection, serta memeriksa winding/luas dan containment hole. Endpoint bersama diperbolehkan. Validasi dipanggil saat tracing, commit Refine, serta pembuatan SVG/EPS. Kandidat tracing yang gagal dikembalikan ke seluruh kontur raster sebelum sub-pixel; fallback divalidasi ulang. Kontur fallback dapat lebih jagged dan lebih banyak node. Edit tidak valid tetap memakai rollback transaksi Refine.

Batas: ini validasi numerik polygonal, bukan solusi persilangan Bézier eksak. Kontak tangensial, kontak endpoint non-junction, komponen terpisah yang berpindah utuh ke dalam komponen lain, dan geometri di bawah toleransi belum dijamin. Line Icon belum memakai validator bidang ini. Batas 2 juta cell insertions/5 juta perbandingan menghentikan kasus terlalu kompleks, bukan menandainya lulus. Fallback tidak mengubah palet/topologi label.

Tes: self-intersection, crossing antar edge, overlap kolinear, junction sah, hole keluar induk, injeksi fitter rusak dan pemulihan raster; regresi 512 pola P1, bentuk geometris/organik, browser Refine Apply/Undo dan EPS.

## House fixture: ink edges
Auto palette recognizes neutral black/white artwork only when intermediate gray lacks broad local interiors. Manual colors are unaffected. Ink contours receive a triangular five-sample filter capped at 0.5 processing px; sharp turns and locked endpoints stay fixed. Actual house PNG: 4 colors/54,168 exported segments before, 2 colors/11,840 after at balanced 1200 px; final run 5.4 seconds. Crop artifacts show staircase rail improvement. Gray-region and colored-art fixtures preserved; shared-edge browser refine/export regression passes. This does not guarantee all thin gray details are semantically recognized.

## Small color artwork
For non-ink outlines, fitting tolerances scale down below 800 processing pixels (minimum factor 0.25). Automatic color labels use locally supported palette pairs to reassign edge mixtures; manual palette and ink branch are excluded. On the actual 283x270 INSIDE OUT PNG: 146 to 28 filled objects, 1392 to 678 exported segments; RGB MAE 1.343 to 1.220 (0–255 scale); P3 polygonal check passes. Fine flag and corner details remain limited and are not claimed exact.

## Bulk convert
Buat vektor dipindah ke kanan atas preview. Bulk convert membuka antrean maksimal 30 PNG/150 MB. Worker berurutan, pengaturan dan sisi ekspor disnapshot saat mulai, tiap file divalidasi PNG/ukuran, timeout 2 menit per file. File gagal dapat dicoba ulang; Hentikan mempertahankan hasil selesai. Nama editable dan dibersihkan saat download, collision case-insensitive diberi suffix. ZIP store berisi SVG/EPS/both; preview per hasil. Antrean hanya selama halaman terbuka; hasil maksimal 150 MB.
