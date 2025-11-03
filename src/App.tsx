import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";

interface ChartData {
    timestamps: string[];
    temperature: number[];
    humidity: number[];
}

function App() {
    const chartRef = useRef<HTMLDivElement | null>(null);
    const [chart, setChart] = useState<echarts.EChartsType | null>(null);
    const [data, setData] = useState<ChartData>({
        timestamps: ["t1", "t2", "t3"],
        temperature: [25, 26, 27],
        humidity: [50, 52, 54],
    });

    // 初始化图表
    useEffect(() => {
        if (!chartRef.current) return;
        const instance = echarts.init(chartRef.current);
        setChart(instance);
        return () => instance.dispose();
    }, []);

    // 更新图表
    useEffect(() => {
        if (!chart) return;

        const option: echarts.EChartsOption = {
            title: { text: "实时温湿度仪表盘" },
            tooltip: { trigger: "axis" },
            legend: { data: ["温度", "湿度"] },
            xAxis: { type: "category", data: data.timestamps },
            yAxis: { type: "value" },
            series: [
                { name: "温度", type: "line", data: data.temperature },
                { name: "湿度", type: "line", data: data.humidity },
            ],
        };

        chart.setOption(option);
    }, [chart, data]);

    // websocket 连接
    // WebSocket 连接
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8765/ws/sensor");
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            setData((prev) => {
                const maxLen = 30; // 显示最近30条数据
                return {
                    timestamps: [...prev.timestamps, msg.timestamp].slice(-maxLen),
                    temperature: [...prev.temperature, msg.temperature].slice(-maxLen),
                    humidity: [...prev.humidity, msg.humidity].slice(-maxLen),
                };
            });
        };
        return () => ws.close();
    }, []);

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center", // 水平居中
                alignItems: "center",     // 垂直居中（可选）
                height: "100vh",          // 占满整个视口高度
                background: "#f5f5f5",    // 可选：背景更明显
            }}
        >
            <div
                ref={chartRef}
                style={{
                    width: "800px",
                    height: "500px",
                    background: "#fff",
                    borderRadius: "10px",
                    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                }}
            />
        </div>
    );
}

export default App;
