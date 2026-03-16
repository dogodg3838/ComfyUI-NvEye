import subprocess
import threading
import json
import time
from aiohttp import web
from server import PromptServer

# ============================================================
# 資料快取
# ============================================================
_data = {
    "gpu_name": "讀取中...",
    "gpu_util": 0,
    "mem_used": 0.0,
    "mem_total": 0.0,
    "mem_pct": 0,
    "temp": 0,
    "cpu_util": 0,
    "ram_used": 0.0,
    "ram_total": 0.0,
    "ram_pct": 0,
}
_lock = threading.Lock()

def fetch_gpu():
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu",
             "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=3
        )
        parts = result.stdout.strip().split(",")
        if len(parts) >= 5:
            name = parts[0].strip().replace("NVIDIA GeForce ", "").replace("NVIDIA ", "")
            mem_used = round(int(parts[2].strip()) / 1024, 1)
            mem_total = round(int(parts[3].strip()) / 1024, 1)
            mem_pct = round(int(parts[2].strip()) / int(parts[3].strip()) * 100)
            with _lock:
                _data["gpu_name"] = name
                _data["gpu_util"] = int(parts[1].strip())
                _data["mem_used"] = mem_used
                _data["mem_total"] = mem_total
                _data["mem_pct"] = mem_pct
                _data["temp"] = int(parts[4].strip())
    except Exception:
        pass

def fetch_cpu_ram():
    try:
        import psutil
        with _lock:
            _data["cpu_util"] = int(psutil.cpu_percent(interval=0.5))
            ram = psutil.virtual_memory()
            _data["ram_used"] = round(ram.used / (1024**3), 1)
            _data["ram_total"] = round(ram.total / (1024**3), 1)
            _data["ram_pct"] = ram.percent
    except Exception:
        pass

def background_loop():
    while True:
        fetch_gpu()
        fetch_cpu_ram()
        time.sleep(1)

# 背景執行緒
t = threading.Thread(target=background_loop, daemon=True)
t.start()

# ============================================================
# API 路由
# ============================================================
@PromptServer.instance.routes.get("/nveye/stats")
async def get_stats(request):
    with _lock:
        data = dict(_data)
    return web.json_response(data)

# ============================================================
# ComfyUI 節點註冊（空的，只是讓 ComfyUI 認識這個 node）
# ============================================================
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

WEB_DIRECTORY = "./web"

print("[NvEye] 硬體監控已啟動 ✓")
