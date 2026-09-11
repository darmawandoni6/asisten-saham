# 💻 Frontend — Asisten Saham IDX

Antarmuka web modern untuk **Asisten Saham** berbasis Next.js 16 (Static Export), TypeScript, Tailwind CSS, dan TradingView Lightweight Charts.

---

## 🛠️ Scripts & Perintah

Di direktori `frontend/`:

```bash
# 1. Jalankan Next.js development server (:3000)
npm run dev

# 2. Build Static HTML Export (output ke folder `frontend/out/`)
npm run build

# 3. Linter Check (ESLint)
npm run lint

# 4. Format Seluruh Kode (Prettier + Import Sorter)
npm run format

# 5. Cek Format Kode (Prettier Check)
npm run format:check
```

---

## 🎨 Code Formatting & Standards

- **Prettier**: Dikonfigurasi di [`.prettierrc`](./.prettierrc)
  - Single quote: `true`
  - Semi: `true`
  - Trailing comma: `all`
  - Tab width: `2`
  - Print width: `120`
  - Plugin: `@trivago/prettier-plugin-sort-imports` (mengurutkan import React, Next.js, third-party, alias `@/*`, dan relative paths)
- **Ignore List**: Dikonfigurasi di [`.prettierignore`](./.prettierignore) (`.next/`, `out/`, `build/`, `node_modules/`, `package-lock.json`).
