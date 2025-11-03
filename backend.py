from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import random
import uvicorn
import json
from datetime import datetime

app = FastAPI()

# 允许前端跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.websocket("/ws/sensor")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        # 模拟传感器数据
        data = {
            "timestamp": datetime.now().isoformat(),
            "temperature": round(random.uniform(20, 30), 2),
            "humidity": round(random.uniform(30, 70), 2)
        }
        await websocket.send_text(json.dumps(data))
        await asyncio.sleep(2)  # 每秒发送一次
        

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8765)
