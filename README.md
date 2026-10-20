# KusoTV - Live Sports & TV Streaming

Website live sports streaming dan TV online gratis dengan antarmuka modern, interaktif, responsif, dan bebas iklan popunder.

---

## 🚀 Fitur Utama KusoTV

* **Live Sports Matches**: Jadwal pertandingan sepak bola, basket, dsb. dengan hitung mundur waktu lokal.
* **Server Switcher**: Pilihan server streaming HD/SD untuk tiap pertandingan.
* **Android TV / Saluran TV**: Saluran TV lokal & internasional (beIN 1-3, SPOTV, Trans 7, RCTI, Metro TV, TVRI, Kompas TV, dsb.).
* **Multi-View (2-Grid & 4-Grid)**: Fitur menonton 2 atau 4 pertandingan sekaligus di satu layar.
* **Universal Player**: Mendukung siaran format DASH `.mpd` (ClearKey DRM), `.m3u8` (HLS.js), dan embed player.
* **Fast Search**: Pencarian cepat berdasarkan nama tim atau liga.
* **Live Chat**: Widget CBox chat terintegrasi.
* **Offline Resilient**: Fallback otomatis ke data lokal jika koneksi API terputus.

Setelah melakukan audit dan deobfuskasi terhadap kode aset halaman target, ditemukan seluruh rantai infrastruktur sumber data, player, enkripsi, dan CDN streaming yang digunakan:

### 1. Data Backend & Katalog API
Situs aslinya menggunakan Cloudflare Pages sebagai penyedia katalog data JSON terenkripsi:
* **API Origin**: `https://kltratv-web.pages.dev`
* **Endpoint Pertandingan & Jadwal Live**: `https://kltratv-web.pages.dev/bro/luffy.json`
* **Endpoint Server Streaming**: `https://kltratv-web.pages.dev/bro/zoro.json`
* **Endpoint Saluran Live TV (Android TV)**: `https://kltratv-web.pages.dev/bro/sanji.json`
* **Endpoint Manifest Stream & Kunci DRM ClearKey**: `https://kltratv-web.pages.dev/bro/usop.json`

### 2. Mekanisme Enkripsi Data
Respons dari endpoint di atas dienkripsi dengan metode **Base64 + Bitwise XOR**:
* **Enkripsi Key (`FEED_MATERIAL_V2`)**:
  ```text
  KLTRATV_WEBSTREAM_KEY_fBAot5pTmCjRk5Jxr5d373ZUX2vp6bopSi5hFRCLcYPwd1kNYsD8CtY6iJ8ZAH9644080qDtHHnC94p26mh1WOKsyPg7vM9K8lRavVtzAbxVfukrHzSlGWhyCaGrzApzxXUGdOLIjNm10iwYKtb89ASvKD74ry4eKUxMHbGmN9NzOlTjBIanSfclCaF2WopHJ6_QhCr_twTWTZrEmUbWomAyedMuJqf4RBCnzH1QVKzrO1gTZukfWD7iEGpAL2k8Hjg_Ntw0JcdyeT_NWH3o0KZpEKUajU6NSByzRITJRGTa53KQCAvei_d1ekWefIbHOgeGMAl0gG0Y574OIxRbKDFplMxYj7eOndp3IBfqDpHoqkP3e5ulAjsGO9aeXbRlvRFaXr5HUmw_l2JYcOmp5QyOdBHkW7_UnI08I1Nnxww3lghy4Q3WhXFILZeGwUapgytJ8VFwixuh5nhY4edWSrNNu02rFG7rPdlxhYuMv6QnEyARcvavkQi_Nz2OLC73hmRsAozhNer1cCrAt0HnSkTY3_QrYC6p5xcU2hbHGBzwnapjhLQ4Pm3udlthzOyDd2jdWap1rDXZPjsM_wnWWIoIXPsEgU62pHRW9z47kkJ5YMLvGjROKPqj9KcqoGMdyT061fXgs6LrWe0GcX3O_SH2yWjhTwERdI_eEEQ4B5t6eSvCdTuZ_pJ429BjMZGN1Kw3MSx2MFbFPWWC4p4SljlNwT9U5gD6OOm8dw8AnskQp7EUNiTxIdlHIjhwvF5rgNHcuTJI46RSU4vWXXPnOsC3rIFrcNIrfvZRN53h7i_Y45ODJtYk3lYFzrDE3ttyMEyKycnfxFLqz3WwXa2SLO2b0oZTD5AhES7mVeCf3aG2dXHfwLAaUrXM0GwcH0JvN7E2GOOuXTE1S0tLMSRW8GGKnICQTVRNv4JnGqPuACjVGkSTT2RClJFBEQVrEd3eE1kKt5ixZI81E_ivVY
  ```
* **Cara Dekripsi**:
  ```javascript
  const bin = atob(encryptedPayload);
  const keyBytes = new TextEncoder().encode(FEED_MATERIAL_V2);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
      out[i] = bin.charCodeAt(i) ^ keyBytes[i % keyBytes.length];
  }
  const jsonData = JSON.parse(new TextDecoder().decode(out));
  ```

### 3. Server Asal Stream & Player
* **MPEG-DASH (.mpd) dengan ClearKey DRM**: Menggunakan Google **Shaka Player** (contoh: beIN Sports, Starzplay, Abu Dhabi Sports, TNT Sports).
* **HLS (.m3u8)**: Menggunakan **HLS.js / Clappr** (contoh: Dens.tv, Vision+, TVRI, Detik, Streamview, Gkykp).
* **Embed Iframe**: Player fallback untuk web eksternal (contoh: `online878.com`, `vivo155.com`).
* **Chat Widget**: Menggunakan CBox iframe (`boxid=3538770&boxtag=Dn3dpG`).
* **Donasi**: Mengarah ke Saweria (`https://saweria.co/KltraTV`).

### 4. Proteksi & Domain Whitelist yang Berhasil Dilewati
Situs aslinya memblokir siapapun yang mencoba meng-copy script-nya dengan:
1. `ALLOWED_HOSTS` check di `config.js` & `testa.js`: Merestriksi eksekusi hanya pada blog Blogger dan subdomain Cloudflare mereka, jika dibuka dari host lain langsung di-redirect ke `about:blank`.
2. `disable-devtool`: Memblokir F12 / DevTools.
3. `anti-iframe.js`: Memblokir embed iframe dari domain asing.

Pada project ini, proteksi tersebut telah di-bypass secara bersih, sehingga web dapat dijalankan di `localhost`, server lokal, atau hosting manapun tanpa ada pemblokiran.

---

## 📁 Struktur File Project

```text
streaming-tv/
├── index.html            # Halaman utama (desain, layout, sidebar & kontrol identik)
├── player.html           # Universal Player (Shaka DASH ClearKey DRM + HLS.js + Embed)
├── scripts/
│   └── local-server.js   # Local development web server Node.js dengan CORS aktif
├── package.json          # Script npm start
├── vercel.json           # Konfigurasi static hosting Vercel
├── .vercelignore         # Ignore server scripts dari build Vercel
├── css/
│   ├── style.css         # Styling modern dark mode responsif dari KLTRATV
│   ├── playermpd.css     # CSS player MPD
│   ├── sdplayer.css      # CSS player SD
│   └── playertv.css      # CSS player TV
├── js/
│   ├── config.js         # Konfigurasi endpoint, kunci dekripsi, dan whitelist
│   └── testa.js          # Controller UI, live match countdown, kategori & multi-view
├── data/                 # Backup data terdekripsi (fallback otomatis jika offline)
│   ├── luffy.json        # Katalog jadwal live pertandingan
│   ├── zoro.json         # Katalog daftar server live stream
│   ├── sanji.json        # Katalog daftar saluran Android TV
│   └── usop.json         # Katalog manifest URL & Kunci DRM
└── images/
    ├── index.png         # Poster cover video player
    └── sportsicon/       # Ikon olahraga (Soccer, Basketball, Baseball)
```

---

## 🚀 Cara Menjalankan

### Menggunakan Node.js (Lokal)
1. Buka terminal di folder `streaming-tv`:
   ```bash
   npm start
   ```
   *Atau:*
   ```bash
   node local-server.js
   ```
2. Buka browser dan akses:
   [http://localhost:3000](http://localhost:3000)

### Fitur yang Tersedia:
* ✅ **Live Event Match Grid**: Jadwal pertandingan bola, basket, dsb. otomatis terupdate sesuai zona waktu lokal.
* ✅ **Live Countdown**: Hitung mundur jam & menit sebelum pertandingan dimulai lengkap dengan logo klub dan poster.
* ✅ **Server Switcher**: Pilihan server streaming HD/SD untuk tiap pertandingan.
* ✅ **Android TV / Live TV**: Saluran TV lokal dan internasional (beIN Sports, SPOTV, Trans7, RCTI, MetroTV, TVRI, dsb.).
* ✅ **Multi-View**: Nonton 2 atau 4 pertandingan sekaligus dalam layout split-screen.
* ✅ **Search Bar**: Pencarian instan berdasarkan nama tim atau liga.
* ✅ **Interactive Chat**: Widget CBox terhubung langsung.
* ✅ **Saweria Donation**: Tombol traktir / donasi terhubung ke halaman resmi.
* ✅ **Offline Resilient**: Otomatis fallback ke data lokal jika koneksi API sedang gangguan.
