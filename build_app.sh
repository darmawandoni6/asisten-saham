#!/bin/bash

# ==============================================================================
# Asisten Saham BEI - 1-Click Frontend Build Script
# ==============================================================================

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR/frontend"

echo "=================================================="
echo "🔨 Memulai Build Frontend (Static Web Export)..."
echo "=================================================="

export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls -1 "$HOME/.nvm/versions/node" 2>/dev/null | tail -n 1)/bin:$PATH"

npm run build

if [ $? -eq 0 ]; then
    echo "=================================================="
    echo "✅ Build Berhasil! Aset statis siap di frontend/out."
    echo "🚀 Perubahan tampilan sudah siap digunakan di aplikasi."
    echo "=================================================="
    osascript -e 'display notification "Build frontend berhasil! Aset statis siap." with title "Asisten Saham BEI" subtitle "Build Sukses ✅"' 2>/dev/null || true
else
    echo "❌ Terjadi error saat proses build. Silakan periksa pesan error di atas."
fi
