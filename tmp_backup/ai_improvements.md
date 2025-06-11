# Perbaikan Algoritma Deteksi dan Penghitungan Kendaraan

## Masalah yang Diatasi

Algoritma sebelumnya memiliki masalah saat menghitung kendaraan:

1. Kendaraan yang sama dihitung berkali-kali
2. Deteksi ganda untuk objek yang sama
3. Threshold deteksi yang terlalu rendah (0.25)
4. Tidak ada filter ukuran minimum

## Solusi yang Diterapkan

1. **Object Fingerprinting**:

   - Membuat sidik jari unik untuk setiap kendaraan berdasarkan:
     - Tipe kendaraan (mobil, motor, dll)
     - Rasio aspek (lebar:tinggi)
     - Ukuran bounding box
     - Posisi relatif dalam frame

2. **Validasi Ganda untuk Penghitungan**:

   - Kendaraan hanya dihitung jika:
     - Melewati garis perhitungan
     - Belum pernah dihitung berdasarkan ID pelacakan
     - Belum pernah dihitung berdasarkan sidik jari objek
     - Sudah lewat minimal beberapa frame sejak perhitungan terakhir

3. **Parameter yang Dioptimalkan**:

   - Threshold IoU ditingkatkan menjadi 0.5
   - Threshold deteksi confidence dinaikkan ke 0.4
   - Filter ukuran minimum ditingkatkan ke 3% dari frame

4. **UI Improvements**:
   - Tampilan total kendaraan berdasarkan kategori
   - Kotak informasi transparan dengan jumlah kendaraan
   - Warna yang berbeda untuk setiap jenis kendaraan

## Hasil

Algoritma ini secara signifikan mengurangi perhitungan ganda dan false positive,
memberikan hasil yang lebih akurat dalam penghitungan kendaraan.
