import time
import os
import sys
import signal
import threading
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/system", tags=["System"])

# Global state
STARTUP_TIME = time.time()
LAST_HEARTBEAT_TIME = time.time()

# Auto shutdown is disabled in development / reload mode to prevent hanging reload supervisors
is_dev_mode = "--reload" in sys.argv or os.getenv("ENVIRONMENT") == "development" or os.getenv("AUTO_SHUTDOWN", "true").lower() in ("0", "false", "no")
AUTO_SHUTDOWN_ENABLED = not is_dev_mode
GRACE_PERIOD_SECONDS = 90  # 90 seconds after boot to allow browser launch
IDLE_TIMEOUT_SECONDS = 75  # 75 seconds without any heartbeat from browser tabs

def safe_exit():
    """Safely terminate the server process and its parent supervisor if any."""
    try:
        ppid = os.getppid()
        if ppid > 1:
            try:
                os.kill(ppid, signal.SIGTERM)
            except Exception:
                pass
    except Exception:
        pass
    os._exit(0)

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
            safe_exit()

# Start monitor thread on module load
thread = threading.Thread(target=monitor_idle_heartbeat, daemon=True)
thread.start()

@router.post("/heartbeat")
@router.post("/heartbeat/")
def receive_heartbeat():
    global LAST_HEARTBEAT_TIME
    LAST_HEARTBEAT_TIME = time.time()
    return {"status": "ok", "timestamp": LAST_HEARTBEAT_TIME}

@router.post("/shutdown")
@router.post("/shutdown/")
def trigger_shutdown():
    def delayed_exit():
        time.sleep(0.5)
        safe_exit()
    threading.Thread(target=delayed_exit, daemon=True).start()
    return {"status": "shutting_down"}

@router.get("/status")
@router.get("/status/")
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
@router.get("/market-status/")
def get_idx_market_status():
    from services.market_calendar import get_market_status
    return get_market_status()

