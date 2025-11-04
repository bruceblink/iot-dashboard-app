import { useEffect, useState } from "react";

export interface SensorData {
    timestamp: string;
    temperature: number;
    humidity: number;
}

export interface ChartData {
    timestamps: string[];
    temperature: number[];
    humidity: number[];
}

/**
 * useRealtimeData Hook
 * @param url SSE/WS URL
 * @param protocol "sse" | "ws"
 * @param maxLen 最大保留数据条数
 * @param historyUrl 可选，获取历史数据的 HTTP 接口
 */
export function useRealtimeData(
    url: string,
    protocol: "sse" | "ws" = "sse",
    maxLen = 60,
    historyUrl?: string
) {
    const [data, setData] = useState<ChartData>({
        timestamps: [],
        temperature: [],
        humidity: [],
    });

    useEffect(() => {
        // 1️⃣ 先请求历史数据
        if (historyUrl) {
            fetch(historyUrl)
                .then(res => res.json())
                .then((history: SensorData[]) => {
                    setData({
                        timestamps: history.map(d => d.timestamp).slice(-maxLen),
                        temperature: history.map(d => d.temperature).slice(-maxLen),
                        humidity: history.map(d => d.humidity).slice(-maxLen),
                    });
                })
                .catch(err => console.error("获取历史数据失败", err));
        }

        // 2️⃣ 连接 SSE / WS
        let ws: WebSocket | null = null;
        let evtSource: EventSource | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout>;

        if (protocol === "ws") {
            const connectWS = () => {
                ws = new WebSocket(url);

                ws.onopen = () => console.log("WebSocket 已连接");
                ws.onmessage = (event) => {
                    const msg: SensorData = JSON.parse(event.data);
                    setData((prev) => ({
                        timestamps: [...prev.timestamps, msg.timestamp].slice(-maxLen),
                        temperature: [...prev.temperature, msg.temperature].slice(-maxLen),
                        humidity: [...prev.humidity, msg.humidity].slice(-maxLen),
                    }));
                };
                ws.onclose = () => {
                    console.warn("WebSocket 已断开，尝试重连...");
                    reconnectTimer = setTimeout(connectWS, 2000);
                };
                ws.onerror = (err) => {
                    console.error("WebSocket 错误：", err);
                    ws?.close();
                };
            };
            connectWS();
        } else {
            const connectSSE = () => {
                evtSource = new EventSource(url);

                evtSource.onmessage = (event) => {
                    const msg: SensorData = JSON.parse(event.data);
                    setData((prev) => ({
                        timestamps: [...prev.timestamps, msg.timestamp].slice(-maxLen),
                        temperature: [...prev.temperature, msg.temperature].slice(-maxLen),
                        humidity: [...prev.humidity, msg.humidity].slice(-maxLen),
                    }));
                };

                evtSource.onerror = (err) => {
                    console.error("SSE 错误，尝试重连", err);
                    evtSource?.close();
                    reconnectTimer = setTimeout(connectSSE, 2000);
                };
            };
            connectSSE();
        }

        return () => {
            clearTimeout(reconnectTimer);
            ws?.close();
            evtSource?.close();
        };
    }, [url, protocol, maxLen, historyUrl]);

    return data;
}
