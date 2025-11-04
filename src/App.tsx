import { useRef, useEffect } from "react";
import * as echarts from "echarts";
import { useRealtimeData } from "./hooks/useRealtimeData";

function App() {
    const chartRef = useRef<HTMLDivElement | null>(null);
    const chartInstanceRef = useRef<echarts.EChartsType | null>(null);

    // 使用 SSE 或 WS
    const data = useRealtimeData(
        "http://localhost:8765/sse/sensor",
        "sse",
        60
    );

    // 初始化图表
    useEffect(() => {
        if (!chartRef.current) return;
        const instance = echarts.init(chartRef.current);
        chartInstanceRef.current = instance;

        const handleResize = () => instance.resize();
        window.addEventListener("resize", handleResize);

        // 初始化 option，只设置一次
        instance.setOption({
            title: { text: "实时温湿度仪表盘" },
            tooltip: { trigger: "axis" },
            legend: { data: ["温度", "湿度"] },
            xAxis: { type: "category", data: [] },
            yAxis: { type: "value" },
            series: [
                { name: "温度", type: "line", data: [] },
                { name: "湿度", type: "line", data: [] },
            ],
        });

        return () => {
            window.removeEventListener("resize", handleResize);
            instance.dispose();
        };
    }, []);

    // 数据更新
    useEffect(() => {
        const chart = chartInstanceRef.current;
        if (!chart || data.timestamps.length === 0) return;

        chart.setOption({
            xAxis: { data: data.timestamps },
            series: [
                { name: "温度", data: data.temperature },
                { name: "湿度", data: data.humidity },
            ],
        });
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
                    width: "100%",
                    maxWidth: "900px",
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