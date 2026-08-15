# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Teman, kenalan, dan publik yang ingin mengobrol secara santai, eksploratif, atau melakukan roleplay interaktif dengan representasi digital (AI Twin) dari Rafito Juan.

## Product Purpose

Platform web chat AI interaktif yang merepresentasikan kepribadian, gaya bicara, dan persona nyata dari Rafito Juan (J1). Keberhasilan produk diukur dari keaslian respon (vibes natural, tidak kaku ala corporate AI) serta visual kepala berbicara real-time yang responsif tanpa jeda.

## Positioning

Bukan chatbot asisten generik serba tahu, melainkan AI Persona autentik dengan animasi avatar video WebGL chroma key yang sinkron saat mengetik dan berbicara, memiliki konteks hidup nyata, selera musik, hobi, dan fleksibilitas berpindah ke mode roleplay (termasuk mode pacar clingy/bucin).

## Operating Context

- Digunakan melalui browser mobile dan desktop dengan tampilan minimalis dan dark-mode.
- Interaksi berbasis teks streaming (Mistral AI API) yang sinkron dengan animasi avatar visual real-time (swap idle PNG dan WebGL chroma key MP4).

## Capabilities and Constraints

- **Animasi Kepala Real-Time**: WebGL chroma key canvas menghilangkan green screen video secara dinamis saat streaming respon AI dan otomatis kembali ke state idle saat selesai.
- **Streaming Response**: Mistral API via Server-Sent Events (SSE) dengan markdown rendering & code highlighting.
- **Mode Roleplay Dinamis**: Mampu beradaptasi dari obrolan santai gaya Jakarta (lu-gua) ke berbagai skenario roleplay, termasuk mode pacar clingy ("aku-kamu" & "sayang").
- **Strict Slop Filter**: Zero generic corporate AI greetings, strictly no emojis kecuali `😭` untuk lelucon/tawa.

## Brand Commitments

- **Nama**: J1 (Rafito Juan / Fito)
- **Gaya Bahasa**: Natural Jakarta slang (lu-gua, santai, to-the-point, berbobot).
- **Aset Visual Resmi**:
  - Logo Monogram RJ: `public/assets/images/logo.png`
  - Idle Head PNG: `public/assets/images/juanhead.png`
  - Talking Avatar MP4: `public/assets/videos/juanhead.mp4`

## Evidence on Hand

- Source code lengkap di repository `rafitojuan/juan-chatbot`.
- File aset video & gambar di folder `public/assets/`.
- System prompt persona di `src/api.js`.

## Product Principles

1. **Authenticity First**: Setiap respon harus mencerminkan kepribadian asli Juan tanpa basa-basi klise asisten AI.
2. **Zero-Lag Visual Feedback**: Animasi kepala WebGL dan streaming teks harus instan, ringan, dan sinkron.
3. **Simplicity & Focus**: Antarmuka bersih, dark theme elegan, dan bebas dari distraksi elemen UI yang tidak perlu.
