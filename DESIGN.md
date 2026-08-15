---
name: J1 AI Chat
description: Sleek zinc dark mode personal AI companion with real-time WebGL chroma key avatar
colors:
  bg-app: "#09090b"
  bg-surface: "#121215"
  bg-surface-elevated: "#1e1e24"
  bg-capsule: "#18181c"
  bg-capsule-hover: "#222227"
  bg-input: "#18181c"
  bg-user-msg: "#27272a"
  bg-ai-msg: "#141417"
  border-subtle: "rgba(255, 255, 255, 0.08)"
  border-medium: "rgba(255, 255, 255, 0.16)"
  border-focus: "rgba(59, 130, 246, 0.5)"
  text-primary: "#f4f4f5"
  text-secondary: "#a1a1aa"
  text-muted: "#71717a"
  text-faint: "#52525b"
  accent-blue: "#3b82f6"
  accent-blue-hover: "#2563eb"
  accent-emerald: "#10b981"
  accent-amber: "#f59e0b"
  accent-rose: "#ef4444"
  accent-rose-hover: "#dc2626"
  accent-rose-text: "#fca5a5"
  backdrop-overlay: "rgba(0, 0, 0, 0.65)"
  shadow-ambient: "rgba(0, 0, 0, 0.5)"
  shadow-modal: "rgba(0, 0, 0, 0.6)"
  shadow-capsule: "rgba(0, 0, 0, 0.25)"
  neutral-black: "#000000"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.35
  code:
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.45
rounded:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent-blue}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  button-capsule:
    backgroundColor: "{colors.bg-capsule}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  input-dock:
    backgroundColor: "{colors.bg-input}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "10px 14px"
---

# Design System: J1 AI Chat

## Overview

**Creative North Star: "The Noir Persona"**

J1 mengusung estetika *dark zinc mode* yang sleek, minimalis, dan berfokus pada konten. Desain antarmuka dirancang tenang agar fokus visual pengguna tertuju secara natural pada **avatar kepala berbicara WebGL real-time** di bagian atas dan alur percakapan di bawahnya. 

Karakter visualnya bernuansa *Refined & Tactile*: sudut kurva membulat lembut (*pill & rounded card*), garis pembatas halus semi-transparan (*subtle borders*), dan kontras tipografi yang jernih tanpa ornamen visual berlebihan.

**Key Characteristics:**
- **Sleek Deep Palette**: Dominasi Zinc `#09090b` hingga `#18181c` yang elegan dan ramah mata.
- **Tactile Floating Controls**: Input dock berbentuk kapsul melayang dengan mikro-interaksi responsif.
- **Dynamic Avatar Stage**: Panggung visual WebGL chroma key yang seamlessly terintegrasi di atas latar belakang hitam.

---

## Colors

Palet warna bernuansa *Dark Zinc* dengan kontras tinggi untuk keterbacaan teks dan aksen fungsional yang terukur:

- **Surface & Backgrounds**:
  - `bg-app` (`#09090b`): Warna kanvas utama gelap pekat.
  - `bg-surface` (`#121215`): Permukaan kartu dan modal.
  - `bg-capsule` (`#18181c`): Latar tombol aksi dan input dock.
  - `bg-user-msg` (`#27272a`): Gelembung chat pesan pengguna (Zinc 800).
  - `bg-ai-msg` (`#141417`): Area pesan respon AI.
- **Text & Hierarchy**:
  - `text-primary` (`#f4f4f5`): Teks utama putih cerah.
  - `text-secondary` (`#a1a1aa`): Teks sekunder dan label interaktif.
  - `text-muted` (`#71717a`): Teks redup, timestamps, dan hints.
- **Accents & Status**:
  - `accent-blue` (`#3b82f6`): Aksen tombol kirim dan link interaktif.
  - `accent-emerald` (`#10b981`): Indikator status online avatar.
  - `border-subtle` (`rgba(255, 255, 255, 0.08)`): Garis pembatas halus.

---

## Typography

Tipografi mengandalkan **Inter** sebagai keluarga font sans-serif modern dengan legibilitas tinggi, dipadukan dengan monospaced font untuk blok kode:

- **Display & Header**: `Inter`, 600 weight, 16px, -0.01em letter-spacing.
- **Body Text**: `Inter`, 400 weight, 14px, 1.55 line-height untuk kenyamanan membaca pesan panjang.
- **Code & Syntax**: `'JetBrains Mono', monospace`, 13px, dengan syntax highlighting GitHub Dark.

---

## Layout

- **Shell Container**: Lebar maksimal `720px` terpusat (*centered single-column container*) dengan padding responsif (`12px 16px`).
- **Floating Head Area**: Bagian atas fleksibel untuk avatar 200px x 200px dengan indikator status di bawahnya.
- **Message Feed**: Alur percakapan vertikal dengan auto-scroll ke bawah saat respon streaming masuk.
- **Bottom Dock**: Input bar melayang (*docked capsule*) di bagian bawah layar dengan dukungan textarea auto-expanding.

---

## Elevation & Depth

Desain menggunakan pendekatan *Tonal Layering & Soft Ambient Shadows*:
- Kedalaman tidak dibuat dengan drop shadow tajam, melainkan melalui perbedaan kontras tonal surface (`#09090b` -> `#121215` -> `#18181c`).
- Border tipis `1px solid rgba(255, 255, 255, 0.08)` memberikan pemisahan tepi yang tegas namun halus.
- Floating head avatar memiliki soft drop shadow `0 10px 30px rgba(0, 0, 0, 0.5)`.

---

## Shapes

- **Pill Radii (`9999px`)**: Digunakan pada status badge, tombol aksi cepat, chip rekomendasi pertanyaan, dan tombol kontrol floating.
- **Container Radii (`14px` - `20px`)**: Digunakan pada kartu pesan pengguna, input box, dan modal dialog.
- **Subtle Radii (`8px`)**: Digunakan pada code block copy buttons dan dropdown items.

---

## Components

- **Floating Head Stage**: Area avatar WebGL canvas dengan swap mulus antara idle PNG dan chroma-keyed video loop saat AI aktif berbicara.
- **Input Capsule**: Textarea transparan di dalam container `#18181c` dengan tombol submit aksen biru ikonik di sebelah kanan.
- **Chat Bubbles**: Bubble pengguna di sisi kanan dengan background `#27272a`; bubble AI di sisi kiri dengan typography bersih dan rendering markdown.
- **Status Indicator**: Pill mini dengan green pulse dot untuk status "Online".

---

## Do's and Don'ts

### Do's:
- Pertahankan latar belakang hitam pekat `#09090b` agar WebGL chroma key avatar menyatu sempurna tanpa artefak tepi.
- Gunakan border semi-transparan `rgba(255, 255, 255, 0.08)` untuk memisahkan section.
- Jaga agar semua animasi mikro (hover, transitions) berada di rentang `150ms - 250ms` yang halus (*ease-out*).

### Don'ts:
- Jangan gunakan warna background terang (light mode) yang akan merusak blending WebGL video chroma key.
- Jangan menambahkan gradient ungu/pink generik atau glassmorphism berlebihan (*AI slop*).
- Jangan mengubah rasio aspek canvas avatar dari `16:9` (`480x270`) yang sudah disinkronkan dengan video head.
