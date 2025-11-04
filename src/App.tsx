import { useRef, useEffect } from "react";
import * as echarts from "echarts";
import { useRealtimeData } from "./hooks/useRealtimeData";

function App() {
    const chartRef = useRef<HTMLDivElement | null>(null);
    const data = useRealtimeData("http://localhost:8765/sse/sensor", "sse"); // 改成 'ws://...' 使用 WebSocket
    const chartRefInstance = useRef<echarts.EChartsType | null>(null);

    // 初始化图表
    useEffect(() => {
        if (!chartRef.current) return;
        const instance = echarts.init(chartRef.current);
        chartRefInstance.current = instance;

        const handleResize = () => instance.resize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            instance.dispose();
        };
    }, []);

    // 更新图表
    useEffect(() => {
        const chart = chartRefInstance.current;
        if (!chart) return;

        chart.setOption(
            {
                title: { text: "实时温湿度仪表盘" },
                tooltip: { trigger: "axis" },
                legend: { data: ["温度", "湿度"] },
                xAxis: { type: "category", data: data.timestamps },
                yAxis: { type: "value" },
                series: [
                    { name: "温度", type: "line", data: data.temperature },
                    { name: "湿度", type: "line", data: data.humidity },
                ],
            },
            { notMerge: true }
        );
    }, [data]);

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                background: "#f5f5f5",
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