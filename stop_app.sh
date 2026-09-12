#!/bin/bash

# ==============================================================================
# Asisten Saham BEI - CLI Stop Script
# ==============================================================================

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "=================================================="
echo "🛑 Menghentikan Layanan Asisten Saham BEI..."
echo "=================================================="

STOPPED=0

# Stop by PID if exists
if [ -f "$DIR/logs/backend.pid" ]; then
    PID=$(cat "$DIR/logs/backend.pid")
    if kill -0 "$PID" 2>/dev/null; then
        echo "🛑 Menghentikan Backend (PID: $PID)..."
        kill "$PID" 2>/dev/null
        STOPPED=1
    fi
    rm -f "$DIR/logs/backend.pid"
fi

if [ -f "$DIR/logs/frontend.pid" ]; then
    PID=$(cat "$DIR/logs/frontend.pid")
    if kill -0 "$PID" 2>/dev/null; then
        echo "🛑 Menghentikan Frontend (PID: $PID)..."
        kill "$PID" 2>/dev/null
        STOPPED=1
    fi
    rm -f "$DIR/logs/frontend.pid"
fi

if [ -f "$DIR/logs/9router.pid" ]; then
    PID=$(cat "$DIR/logs/9router.pid")
    if kill -0 "$PID" 2>/dev/null; then
        echo "🛑 Menghentikan 9Router Gateway (PID: $PID)..."
        kill "$PID" 2>/dev/null
        STOPPED=1
    fi
    rm -f "$DIR/logs/9router.pid"
fi

# Fallback: kill by port 8000 & 3000 if still running
if lsof -i :8000 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "🛑 Menghentikan sisa proses di port 8000..."
    kill -9 $(lsof -ti :8000) 2>/dev/null
    STOPPED=1
fi

if lsof -i :3000 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "🛑 Menghentikan sisa proses di port 3000..."
    kill -9 $(lsof -ti :3000) 2>/dev/null
    STOPPED=1
fi

if lsof -i :20128 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "🛑 Menghentikan sisa proses di port 20128 (9Router)..."
    kill -9 $(lsof -ti :20128) 2>/dev/null
    STOPPED=1
fi

if [ $STOPPED -eq 1 ]; then
    echo "✅ Semua layanan Asisten Saham berhasil dihentikan."
    osascript -e 'display notification "Layanan backend & frontend telah dimatikan" with title "Asisten Saham BEI" subtitle "Aplikasi Dihentikan"' 2>/dev/null || true
else
    echo "ℹ️  Tidak ada layanan Asisten Saham yang sedang berjalan."
fi
echo "=================================================="
