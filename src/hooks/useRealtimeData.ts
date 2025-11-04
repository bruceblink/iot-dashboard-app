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
 * useRealtimeData
 * @param url SSE 或 WS 的 URL
 * @param protocol 'sse' | 'ws'
 * @param maxLen 最大保留数据条数
 */
export function useRealtimeData(
    url: string,
    protocol: "sse" | "ws" = "sse",
    maxLen = 60
) {
    const [data, setData] = useState<ChartData>({
        timestamps: [],
        temperature: [],
        humidity: [],
    });

    useEffect(() => {
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
    }, [url, protocol, maxLen]);

    return data;
}
