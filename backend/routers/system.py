import time
import os
import sys
import threading
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/system", tags=["System"])

# Global state
STARTUP_TIME = time.time()
LAST_HEARTBEAT_TIME = time.time()
AUTO_SHUTDOWN_ENABLED = True
GRACE_PERIOD_SECONDS = 90  # 90 seconds after boot to allow browser launch
IDLE_TIMEOUT_SECONDS = 75  # 75 seconds without any heartbeat from browser tabs

def monitor_idle_heartbeat():
    """Background daemon thread checking for active browser tab heartbeats."""
    global LAST_HEARTBEAT_TIME, STARTUP_TIME
    while True:
        time.sleep(10)
        if not AUTO_SHUTDOWN_ENABLED:
            continue
            
        now = time.time()
        # Do not shutdown during initial grace period
        if now - STARTUP_TIME < GRACE_PERIOD_SECONDS:
            continue
            
        idle_duration = now - LAST_HEARTBEAT_TIME
        if idle_duration > IDLE_TIMEOUT_SECONDS:
            print(f"[AutoShutdown] Tidak ada tab browser yang aktif selama {int(idle_duration)} detik.")
            print("[AutoShutdown] Mematikan server secara otomatis untuk menghemat RAM (0 MB idle mode)...")
            sys.stdout.flush()
            # Clean exit
            os._exit(0)

# Start monitor thread on module load
thread = threading.Thread(target=monitor_idle_heartbeat, daemon=True)
thread.start()

@router.post("/heartbeat")
def receive_heartbeat():
    global LAST_HEARTBEAT_TIME
    LAST_HEARTBEAT_TIME = time.time()
    return {"status": "ok", "timestamp": LAST_HEARTBEAT_TIME}

@router.post("/shutdown")
def trigger_shutdown():
    def delayed_exit():
        time.sleep(0.5)
        os._exit(0)
    threading.Thread(target=delayed_exit, daemon=True).start()
    return {"status": "shutting_down"}

@router.get("/status")
def get_system_status():
    global LAST_HEARTBEAT_TIME, STARTUP_TIME
    now = time.time()
    return {
        "uptime_seconds": int(now - STARTUP_TIME),
        "last_heartbeat_ago": int(now - LAST_HEARTBEAT_TIME),
        "auto_shutdown_enabled": AUTO_SHUTDOWN_ENABLED,
        "idle_timeout_seconds": IDLE_TIMEOUT_SECONDS
    }

@router.get("/market-status")
def get_idx_market_status():
    from services.market_calendar import get_market_status
    return get_market_status()

