.PHONY: help dev dev-be dev-fe be fe start stop build install sync-eod clean test 9router

# Default target
all: help

## ---------------------------------------------------------
## 🛠️ DEVELOPMENT (HOT-RELOAD)
## ---------------------------------------------------------

## Menjalankan 9Router, Frontend & Backend secara bersamaan dalam mode Development
dev:
	@./start_app.sh --dev

## Menjalankan hanya 9Router AI Gateway di latar belakang (Port 20128)
9router:
	@echo "🔀 Memulai 9Router AI Gateway di port 20128..."
	@bash -c 'source ~/.zshrc 2>/dev/null || true; which 9router >/dev/null && 9router -t --host 127.0.0.1 || "$$HOME/.nvm/versions/node/$$(ls -1 "$$HOME/.nvm/versions/node" 2>/dev/null | tail -n 1)/bin/9router" -t --host 127.0.0.1'
	@echo "✅ 9Router siap di http://localhost:20128"

## Menjalankan hanya Backend FastAPI dalam mode Hot-Reload
dev-be be:
	@echo "📦 Menjalankan FastAPI Backend di http://127.0.0.1:8000 (Docs: /docs)..."
	@cd backend && ./venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --reload

## Menjalankan hanya Frontend Next.js Dev Server
dev-fe fe:
	@echo "💻 Menjalankan Next.js Dev Server di http://localhost:3000..."
	@cd frontend && npm run dev

## ---------------------------------------------------------
## ⚡ PRODUCTION & ULTRA-LIGHT SINGLE PROCESS
## ---------------------------------------------------------

## Menjalankan Single-Process Ultra-Light Server (FastAPI melayani Web + API di port 8000)
start prod:
	@./start_app.sh

## Menghentikan seluruh proses server yang sedang berjalan (Port 8000, 3000 & 20128)
stop:
	@echo "🛑 Menghentikan server..."
	@./stop_app.sh 2>/dev/null || true
	@kill -9 $$(lsof -ti :8000) 2>/dev/null || true
	@kill -9 $$(lsof -ti :3000) 2>/dev/null || true
	@kill -9 $$(lsof -ti :20128) 2>/dev/null || true
	@echo "✅ Seluruh proses Asisten Saham berhasil dihentikan."

## ---------------------------------------------------------
## 📦 BUILD & INSTALLATION
## ---------------------------------------------------------

## Membangun aset statis Frontend (Static Export ke frontend/out)
build:
	@echo "⚙️  Membangun Frontend Static Export..."
	@cd frontend && npm run build

## Menginstal dependensi untuk Backend (pip) dan Frontend (npm)
install:
	@echo "📥 Menginstal dependensi Backend..."
	@cd backend && ./venv/bin/pip install -r requirements.txt
	@echo "📥 Menginstal dependensi Frontend..."
	@cd frontend && npm install
	@echo "✅ Seluruh dependensi berhasil diinstal."

## ---------------------------------------------------------
## 📈 UTILITIES & DATA MARKET
## ---------------------------------------------------------

## Sinkronisasi data closing EOD dari Yahoo Finance untuk seluruh portofolio
sync-eod:
	@echo "🔄 Menjalankan sinkronisasi data pasar EOD..."
	@./backend/venv/bin/python .agents/skills/idx-eod-sync/scripts/sync_eod.py

## Menjalankan pengujian backend & status kalender pasar
test:
	@cd backend && ./venv/bin/python -c "\
	from services.market_calendar import get_market_status, is_active_trading_day;\
	from datetime import date;\
	print('Market Status:', get_market_status());\
	print('Is Active Today:', is_active_trading_day(date.today()));\
	print('✅ Backend & Calendar Test Passed!')"

## Membersihkan file cache, log, dan build temporary
clean:
	@echo "🧹 Membersihkan cache dan temporary files..."
	@rm -rf logs/*.log logs/*.pid
	@rm -rf backend/__pycache__ backend/routers/__pycache__ backend/services/__pycache__
	@rm -rf frontend/.next frontend/out
	@echo "✅ Selesai dibersihkan."

## ---------------------------------------------------------
## 📖 BANTUAN
## ---------------------------------------------------------

## Menampilkan daftar perintah yang tersedia
help:
	@echo "=================================================================="
	@echo "              📈 ASISTEN SAHAM BEI — MAKEFILE COMMANDS            "
	@echo "=================================================================="
	@echo ""
	@echo "  🛠️  DEVELOPMENT:"
	@echo "    make dev        - Jalankan 9Router (:20128), Backend (:8000) & Frontend (:3000)"
	@echo "    make 9router    - Jalankan hanya 9Router AI Gateway (:20128)"
	@echo "    make dev-be     - Jalankan hanya Backend FastAPI (Hot Reload)"
	@echo "    make dev-fe     - Jalankan hanya Frontend Next.js (Hot Reload)"
	@echo ""
	@echo "  ⚡ SINGLE-PROCESS & PRODUCTION:"
	@echo "    make start      - Jalankan Ultra-Light Single Process di :8000 & 9Router di :20128"
	@echo "    make stop       - Hentikan seluruh proses (:8000, :3000 & :20128)"
	@echo "    make build      - Build Frontend Static Export (Next.js)"
	@echo ""
	@echo "  📦 SETUP & DATA:"
	@echo "    make install    - Install dependensi Python & Node.js"
	@echo "    make sync-eod   - Tarik & sinkronkan data penutupan pasar EOD"
	@echo "    make test       - Jalankan uji kalender & koneksi backend"
	@echo "    make clean      - Bersihkan log, cache .pyc, & build artifacts"
	@echo ""
	@echo "=================================================================="
