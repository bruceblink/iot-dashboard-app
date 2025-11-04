from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import random
import json
from datetime import datetime

from starlette.responses import StreamingResponse

app = FastAPI()

# 允许前端跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# 使用WebSocket服务
@app.websocket("/ws/sensor")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        # 模拟传感器数据
        data = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "temperature": round(random.uniform(20, 30), 2),
            "humidity": round(random.uniform(30, 70), 2)
        }
        await websocket.send_text(json.dumps(data))
        await asyncio.sleep(2)  # 每秒发送一次

async def generate_sensor_data():
    """异步生成模拟传感器数据"""
    while True:
        data = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "temperature": round(random.uniform(20, 30), 2),
            "humidity": round(random.uniform(30, 70), 2)
        }
        # SSE 格式：每条消息以 "data: ..." 开头，结尾两个换行符
        yield f"data: {json.dumps(data)}\n\n"
        await asyncio.sleep(2)  # 每 2 秒推送一次

# 使用http协议的sse模式
@app.get("/sse/sensor")
async def sse_sensor():
    return StreamingResponse(generate_sensor_data(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765)
