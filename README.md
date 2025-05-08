# Traffic Vision AI Hub

Aplikasi Traffic Vision AI Hub adalah solusi analisis lalu lintas berbasis AI yang menggunakan YOLOv8 untuk mendeteksi, melacak, dan menghitung kendaraan dalam rekaman video lalu lintas.

## Fitur Utama

- Deteksi kendaraan otomatis (mobil, motor, truk, bus)
- Pelacakan kendaraan secara real-time
- Penghitungan kendaraan saat melintasi garis batas
- Visualisasi hasil dengan bounding box dan statistik
- Autentikasi pengguna untuk keamanan data
- Upload, download, dan manajemen video
- Dashboard analitik untuk melihat hasil

## Persyaratan Sistem

- Python 3.10 atau lebih baru
- Node.js 18 atau lebih baru
- Docker dan Docker Compose (opsional, untuk deployment mudah)
- Ruang disk minimum 5GB (untuk model AI dan pemrosesan video)
- GPU opsional, tetapi direkomendasikan untuk performa yang lebih baik

## Struktur Direktori

```
traffic-vision-ai-hub/
├── backend/               # Backend FastAPI
│   ├── app/               # Kode utama backend
│   │   ├── ai.py          # Implementasi AI menggunakan YOLOv8
│   │   ├── auth.py        # Autentikasi dan keamanan
│   │   ├── database.py    # Koneksi database
│   │   ├── main.py        # Aplikasi utama FastAPI
│   │   ├── models.py      # Model database
│   │   └── schemas.py     # Schema validasi
│   ├── models/            # Model AI YOLOv8
│   ├── results/           # Hasil pemrosesan video
│   ├── uploads/           # Video yang di-upload
│   ├── requirements.txt   # Dependensi Python
│   ├── run.py             # Script untuk menjalankan backend
│   └── Dockerfile         # Docker configuration untuk backend
├── src/                   # Frontend React
│   ├── components/        # Komponen UI React
│   ├── pages/             # Halaman aplikasi
│   ├── services/          # Service API
│   └── contexts/          # Context React
├── public/                # Aset publik
├── docker-compose.yml     # Konfigurasi Docker Compose
└── package.json           # Dependensi frontend
```

## Cara Menjalankan Aplikasi

### Metode 1: Menggunakan Docker Compose (Direkomendasikan)

1. Pastikan Docker dan Docker Compose sudah terinstall
2. Clone repository ini ke komputer anda
3. Buka terminal dan navigasi ke direktori proyek
4. Jalankan perintah:

```bash
docker-compose up -d
```

5. Akses aplikasi di browser:
   - Frontend: http://localhost:5173 (saat menggunakan docker-compose) atau http://localhost:3000 (saat menjalankan langsung dengan npm)
   - API Backend: http://localhost:8000
   - Dokumentasi API: http://localhost:8000/docs

### Metode 2: Menjalankan Frontend dan Backend Secara Terpisah

#### Setup Backend:

1. Buat dan aktifkan virtual environment Python:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Pada Windows: venv\Scripts\activate
```

2. Install dependensi backend:

```bash
pip install -r requirements.txt
```

3. Jalankan server backend (gunakan run.py):

```bash
python run.py
```

Atau bisa juga dengan uvicorn langsung:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Setup Frontend:

1. Di terminal terpisah, navigasi ke direktori utama proyek
2. Install dependensi frontend:

```bash
npm install
```

3. Jalankan server development:

```bash
npm run dev
```

4. Akses frontend di browser: http://localhost:3000

## Cara Menggunakan Aplikasi

1. **Registrasi/Login**: Buat akun pengguna baru atau masuk dengan akun yang ada
2. **Upload Video**: Upload video lalu lintas dari halaman utama
3. **Proses Video**: Sistem akan secara otomatis memproses video menggunakan YOLOv8
4. **Lihat Hasil**: Setelah pemrosesan selesai, lihat hasil deteksi dan statistik kendaraan
5. **Download Hasil**: Unduh video hasil atau data JSON untuk analisis lebih lanjut

## Membuat User

Untuk membuat user baru, jalankan script berikut:

```bash
# Di dalam direktori backend dengan virtual environment yang aktif
python create_user.py
```

Script ini akan membuat user dengan credential berikut:

- Email: test@example.com
- Password: password123

Untuk membuat user dengan credential khusus, ubah script create_user.py sesuai kebutuhan.

## Troubleshooting

### Video tidak diproses:

- Pastikan model YOLOv8 sudah terdownload di `/backend/models/`
- Periksa format video (MP4 direkomendasikan)
- Pastikan ukuran video tidak melebihi batas upload (default: 200MB)
- Periksa log backend untuk error spesifik

### Masalah Login:

- Reset browser cookies dan cache
- Pastikan backend API berjalan dengan baik
- Periksa koneksi ke database (app.db)

### Masalah Performa:

- Untuk perangkat dengan GPU terbatas, gunakan parameter `--workers=1` pada run.py
- Kurangi resolusi video sebelum upload untuk pemrosesan lebih cepat
- Gunakan parameter timeout yang lebih lama di docker-compose.yml

## Tools Tambahan

Repository ini berisi beberapa script bantuan:

- `backend/fix_database.py`: Memperbaiki masalah pada database
- `backend/optimize_videos.py`: Mengoptimalkan video untuk pemrosesan lebih cepat
- `backend/check_video_format.py`: Memeriksa kompatibilitas format video

## Keamanan

- Semua endpoint API yang penting dilindungi dengan JWT authentication
- Password dienkripsi menggunakan bcrypt
- Video dan hasil hanya dapat diakses oleh pengguna yang mengunggahnya

## License

MIT License
