from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import random
import json
from datetime import datetime

from starlette.responses import StreamingResponse, JSONResponse

app = FastAPI()

# 允许前端跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ===============================
# 全局传感器数据缓存
# ===============================
MAX_HISTORY = 60  # 最多保留最近 60 条数据
history_data = []  # 缓存队列


def add_sensor_data():
    """生成模拟数据并加入历史记录"""
    data = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "temperature": round(random.uniform(20, 30), 2),
        "humidity": round(random.uniform(30, 70), 2)
    }
    history_data.append(data)
    if len(history_data) > MAX_HISTORY:
        history_data.pop(0)
    return data


# ===============================
# 1️⃣ SSE 实时推送
# ===============================
@app.get("/sse/sensor")
async def sse_sensor():
    async def event_stream():
        while True:
            data = add_sensor_data()
            yield f"data: {json.dumps(data)}\n\n"
            await asyncio.sleep(2)
    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ===============================
# 2️⃣ WebSocket 实时推送
# ===============================
@app.websocket("/ws/sensor")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = add_sensor_data()
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(2)
    except Exception as e:
        print(f"WebSocket断开: {e}")
    finally:
        await websocket.close()


# ===============================
# 3️⃣ 历史数据接口
# ===============================
@app.get("/history/sensor")
async def get_history():
    """返回最近 N 条历史数据"""
    return JSONResponse(content=history_data)


# ===============================
# 启动服务
# ===============================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765)
