#!/bin/bash

# ==============================================================================
# Asisten Saham BEI - CLI Start Script (Ultra-Lightweight & Dev Mode)
# ==============================================================================

export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls -1 "$HOME/.nvm/versions/node" 2>/dev/null | tail -n 1)/bin:$PATH"

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

mkdir -p "$DIR/logs"

MODE="prod"
if [ "$1" == "--dev" ]; then
    MODE="dev"
fi

echo "=================================================="
if [ "$MODE" == "prod" ]; then
    echo "🚀 Memulai Asisten Saham BEI (Ultra-Light Single Process)"
    echo "💡 Node.js Server: NON-AKTIF (Frontend disajikan langsung oleh FastAPI)"
    echo "⚡ RAM: ~100 MB saat aktif | 0 MB otomatis saat browser ditutup"
else
    echo "🛠️  Memulai Asisten Saham BEI (Development Mode - Hot Reload)"
fi
echo "=================================================="

# Function to test port availability
is_port_open() {
    local port=$1
    lsof -i :$port -sTCP:LISTEN >/dev/null 2>&1
}

# Function to check HTTP 200 with strict timeout (prevents hanging on zombie processes)
is_http_ready() {
    local url=$1
    local code=$(curl -s --connect-timeout 2 --max-time 3 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    [ "$code" = "200" ] || [ "$code" = "304" ]
}

# Function to start 9Router if not already running
start_9router_if_needed() {
    if is_port_open 20128; then
        echo "✅ 9Router AI Gateway sudah aktif di port 20128."
        return 0
    fi

    echo "🔀 Menjalankan 9Router AI Gateway (Port 20128)..."
    local NINEROUTER_BIN=$(which 9router 2>/dev/null)
    if [ -z "$NINEROUTER_BIN" ]; then
        NINEROUTER_BIN=$(ls -1 "$HOME/.nvm/versions/node"/*/bin/9router 2>/dev/null | tail -n 1)
    fi

    if [ -n "$NINEROUTER_BIN" ] && [ -x "$NINEROUTER_BIN" ]; then
        nohup "$NINEROUTER_BIN" -t --host 127.0.0.1 >> "$DIR/logs/9router.log" 2>&1 &
        local NR_PID=$!
        echo $NR_PID > "$DIR/logs/9router.pid"
        echo "⏳ Menunggu 9Router siap..."
        local WAITED=0
        while [ $WAITED -lt 20 ]; do
            if is_port_open 20128; then
                echo "✅ 9Router AI Gateway siap (PID: $NR_PID)!"
                return 0
            fi
            sleep 0.5
            WAITED=$((WAITED + 1))
        done
        echo "⚠️  9Router belum merespons dalam 10s, melanjutkan ke proses berikutnya..."
    else
        echo "⚠️  Binary 9router tidak ditemukan di PATH. Menjalankan fallback rule-based."
    fi
}

# ==============================================================================
# STEP 1: Run 9Router AI Gateway First
# ==============================================================================
start_9router_if_needed

# ==============================================================================
# STEP 2: Run Backend and Frontend
# ==============================================================================
if [ "$MODE" == "prod" ]; then
    # Check if backend is already running and healthy on 8000
    if is_http_ready "http://127.0.0.1:8000/api/v1/health"; then
        echo "ℹ️  Server backend sudah aktif dan sehat."
        echo "🌐 Membuka browser: http://localhost:8000"
        open "http://localhost:8000"
        exit 0
    fi

    # Cleanup stuck/unresponsive port 8000
    if is_port_open 8000; then
        echo "⚠️  Port 8000 terisi tetapi tidak merespons, membersihkan proses lama..."
        kill -9 $(lsof -ti :8000) 2>/dev/null
        sleep 0.5
    fi

    # Build static export if missing
    if [ ! -d "$DIR/frontend/out" ]; then
        echo "⚙️  Mengekspor Frontend statis..."
        (cd "$DIR/frontend" && npm run build >> "$DIR/logs/frontend_build.log" 2>&1)
    fi

    # Start FastAPI (serving API + Web Frontend)
    echo "📦 Menjalankan FastAPI (melayani API + Web) di http://localhost:8000 ..."
    cd "$DIR/backend"
    nohup "$DIR/backend/venv/bin/uvicorn" main:app --host 127.0.0.1 --port 8000 >> "$DIR/logs/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$DIR/logs/backend.pid"

    # Wait for readiness
    echo "⏳ Menunggu server siap..."
    MAX_WAIT=20
    WAITED=0
    while [ $WAITED -lt $MAX_WAIT ]; do
        if is_http_ready "http://127.0.0.1:8000/api/v1/health"; then
            echo "✅ Server siap!"
            break
        fi
        sleep 0.5
        WAITED=$((WAITED + 1))
    done

    echo "🌐 Membuka browser: http://localhost:8000 ..."
    open "http://localhost:8000"
    osascript -e 'display notification "Asisten Saham & 9Router siap di http://localhost:8000" with title "Asisten Saham BEI" subtitle "Ultra-Light Server Aktif 🚀"' 2>/dev/null || true

else
    # Dev Mode with Next.js Dev Server
    echo "📦 Menjalankan FastAPI Backend di http://localhost:8000 ..."
    cd "$DIR/backend"
    "$DIR/backend/venv/bin/uvicorn" main:app --host 127.0.0.1 --port 8000 --reload >> "$DIR/logs/backend.log" 2>&1 &
    echo $! > "$DIR/logs/backend.pid"

    echo "💻 Menjalankan Next.js Dev Server di http://localhost:3000 ..."
    cd "$DIR/frontend"
    npm run dev >> "$DIR/logs/frontend.log" 2>&1 &
    echo $! > "$DIR/logs/frontend.pid"

    sleep 2
    open "http://localhost:3000"
fi

echo "=================================================="
echo "🎯 Akses Aplikasi: http://localhost:8000"
echo "🔀 9Router Gate  : http://localhost:20128"
echo "📜 Log Server    : tail -f logs/backend.log logs/9router.log"
echo "🛑 Untuk Stop    : ./stop_app.sh"
echo "=================================================="
