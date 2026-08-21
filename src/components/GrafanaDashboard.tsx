import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  Activity as ActivityIcon,
  AlertOctagon,
  Cpu as CpuIcon,
  HardDrive as HardDriveIcon,
  Network as NetworkIcon,
  Flame as FlameIcon,
  Sliders as SlidersIcon,
  Zap as ZapIcon,
  CheckCircle as CheckCircleIcon,
  AlertTriangle,
  Database
} from "lucide-react";
import { TelemetryMetric, UserRole } from "../types";

interface GrafanaDashboardProps {
  telemetryHistory: TelemetryMetric[];
  currentUserRole: UserRole;
  onAddAuditLog: (action: string, type: "info" | "success" | "warning" | "error", details: string) => void;
  onTriggerTelemetryAlert: (metricType: string, value: number) => void;
}

export default function GrafanaDashboard({
  telemetryHistory,
  currentUserRole,
  onAddAuditLog,
  onTriggerTelemetryAlert
}: GrafanaDashboardProps) {
  const [data, setData] = useState<TelemetryMetric[]>(telemetryHistory);
  const [stressLevel, setStressLevel] = useState<number>(0); // 0 (Normal) to 100 (Overload)
  const [isStressActive, setIsStressActive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"system" | "network">("system");

  // Live updates simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) => {
        const lastItem = prevData[prevData.length - 1];
        const lastTime = lastItem ? lastItem.timestamp : "22:35";
        
        // Parse last time to calculate next minute
        const [h, m] = lastTime.split(":").map(Number);
        const nextMin = (m + 5) % 60;
        const nextHour = nextMin === 0 ? (h + 1) % 24 : h;
        const nextTimeStr = `${String(nextHour).padStart(2, "0")}:${String(nextMin).padStart(2, "0")}`;

        // Base values affected by stress level slider
        const multiplier = isStressActive ? 1 + stressLevel / 100 : 1;
        
        let cpuLoad = Math.round((35 + Math.random() * 20) * multiplier);
        let ramUsage = Math.round((55 + Math.random() * 8) * multiplier);
        let diskIo = Math.round((12 + Math.random() * 8) * multiplier);
        let bandwidth = Math.round((4.0 + Math.random() * 2) * multiplier);

        // Clamping to 100 max
        if (cpuLoad > 100) cpuLoad = 100;
        if (ramUsage > 100) ramUsage = 100;
        if (diskIo > 100) diskIo = 100;

        // Check if thresholds are breached
        if (cpuLoad > 85) {
          onTriggerTelemetryAlert("Нагрузка CPU", cpuLoad);
        }
        if (ramUsage > 90) {
          onTriggerTelemetryAlert("Заполнение ОЗУ", ramUsage);
        }

        const newItem: TelemetryMetric = {
          timestamp: nextTimeStr,
          cpu: cpuLoad,
          ram: ramUsage,
          disk: diskIo,
          bandwidth: Number(bandwidth.toFixed(1))
        };

        // Shift array to keep standard 6 points
        const sliced = prevData.length >= 8 ? prevData.slice(1) : prevData;
        return [...sliced, newItem];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isStressActive, stressLevel]);

  // Handle stress slider change
  const handleStressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setStressLevel(value);
    if (value > 0 && !isStressActive) {
      setIsStressActive(true);
    } else if (value === 0) {
      setIsStressActive(false);
    }

    if (value > 80) {
      onAddAuditLog(
        "Тест перегрузки системы",
        "warning",
        `Инициирован стресс-тест ОЗУ/ЦП с множителем нагрузки +${value}%. Наблюдается пиковая активность.`
      );
    }
  };

  const latest = data[data.length - 1] || { cpu: 45, ram: 60, disk: 15, bandwidth: 5.0 };

  return (
    <div id="grafana_section" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-100">
      
      {/* Grafana Navigation Style Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <ActivityIcon className="h-5.5 w-5.5 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-mono text-indigo-400 tracking-wider font-semibold uppercase bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">REALTIME TELEMETRY</span>
            <h2 className="text-lg font-bold text-white tracking-tight font-display">Панель Метрик и Телеметрии</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Мониторинг вычислительной инфраструктуры склада и запущенных API-сервисов в реальном времени.
          </p>
        </div>

        {/* System Simulation Stresser (Admin only) */}
        <div className="mt-4 lg:mt-0 flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2">
          <div className="flex items-center gap-2">
            <SlidersIcon className="h-4 w-4 text-indigo-400" />
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-bold">Стресс-тест нагрузки:</span>
              <span className={`text-xs font-mono font-bold ${stressLevel > 75 ? "text-rose-400" : "text-emerald-400"}`}>
                {stressLevel === 0 ? "НОРМА" : `ПЕРЕГРУЗКА +${stressLevel}%`}
              </span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={stressLevel}
            onChange={handleStressChange}
            className="w-24 h-1 bg-slate-800 rounded-xl appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>

      {/* Grid of Sparkline Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        
        {/* CPU Panel */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between transition-all hover:border-slate-700">
          <div>
            <span className="text-[10px] text-slate-500 font-mono block uppercase">CPU LOAD</span>
            <h3 className={`text-2xl font-bold font-mono tracking-tight ${latest.cpu > 80 ? "text-rose-500" : "text-emerald-400"}`}>
              {latest.cpu}%
            </h3>
            <span className="text-[9px] text-slate-400">Частота ядра: 3.6 GHz</span>
          </div>
          <div className={`p-3 rounded-xl ${latest.cpu > 80 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
            <CpuIcon className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* RAM Panel */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between transition-all hover:border-slate-700">
          <div>
            <span className="text-[10px] text-slate-500 font-mono block uppercase">RAM USAGE</span>
            <h3 className={`text-2xl font-bold font-mono tracking-tight ${latest.ram > 85 ? "text-rose-500" : "text-cyan-400"}`}>
              {latest.ram}%
            </h3>
            <span className="text-[9px] text-slate-400">Занято: {(16 * (latest.ram / 100)).toFixed(1)} GB / 16 GB</span>
          </div>
          <div className={`p-3 rounded-xl ${latest.ram > 85 ? "bg-rose-500/10 text-rose-400" : "bg-cyan-500/10 text-cyan-400"}`}>
            <Database className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Disk I/O Panel */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between transition-all hover:border-slate-700">
          <div>
            <span className="text-[10px] text-slate-500 font-mono block uppercase">DISK I/O RATE</span>
            <h3 className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
              {latest.disk} MB/s
            </h3>
            <span className="text-[9px] text-slate-400">Скорость SSD чтения/записи</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <HardDriveIcon className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Network Panel */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between transition-all hover:border-slate-700">
          <div>
            <span className="text-[10px] text-slate-500 font-mono block uppercase">NET THROUGHPUT</span>
            <h3 className="text-2xl font-bold font-mono text-indigo-400 tracking-tight">
              {latest.bandwidth} MB/s
            </h3>
            <span className="text-[9px] text-slate-400">Активный линк: 1 Gbps</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <NetworkIcon className="h-5.5 w-5.5" />
          </div>
        </div>

      </div>

      {/* Main Graph Area */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ZapIcon className="h-4 w-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">График нагрузки в реальном времени (5-мин интервалы)</h3>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab("system")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === "system" ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              Вычисления (CPU/RAM)
            </button>
            <button
              onClick={() => setActiveTab("network")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === "network" ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              Сетевой поток & Диск
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === "system" ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#f8fafc" }}
                  labelClassName="text-slate-400 font-mono text-xs"
                  itemStyle={{ fontSize: "11px", fontWeight: "bold" }}
                />
                <Area
                  name="Загрузка ЦП (%)"
                  type="monotone"
                  dataKey="cpu"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorCpu)"
                  strokeWidth={2}
                />
                <Area
                  name="Память ОЗУ (%)"
                  type="monotone"
                  dataKey="ram"
                  stroke="#06b6d4"
                  fillOpacity={1}
                  fill="url(#colorRam)"
                  strokeWidth={2}
                />
              </AreaChart>
            ) : (
              <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#f8fafc" }}
                  labelClassName="text-slate-400 font-mono text-xs"
                />
                <Line
                  name="Поток Сети (MB/s)"
                  type="monotone"
                  dataKey="bandwidth"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  name="Скорость диска (MB/s)"
                  type="monotone"
                  dataKey="disk"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Database Connection pools & API Latencies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Service health logs */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] text-slate-500 font-mono block uppercase mb-3">ИНТЕГРАЦИЯ БАЗЫ ДАННЫХ И ХОСТИНГА</span>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 bg-slate-900/60 border border-slate-800/80 rounded-xl">
              <span className="text-slate-300">Состояние Docker-контейнера</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircleIcon className="h-3.5 w-3.5" /> Активен (24 суток)
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-900/60 border border-slate-800/80 rounded-xl">
              <span className="text-slate-300">Подключение SQLite / Локальный кэш</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircleIcon className="h-3.5 w-3.5" /> 100% Синхронизирован
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-900/60 border border-slate-800/80 rounded-xl">
              <span className="text-slate-300">Пул соединений (Pool size)</span>
              <span className="text-slate-300 font-mono">12 активных / 50 макс</span>
            </div>
          </div>
        </div>

        {/* API response latencies */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] text-slate-500 font-mono block uppercase mb-3">ЗАДЕРЖКА ВНЕШНИХ API-ШЛЮЗОВ</span>
          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>SMS.RU API Gateway (СМС Оповещения)</span>
                <span className="font-mono text-emerald-400">142 ms</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "35%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Telegram Bot BotFather API Webhook</span>
                <span className="font-mono text-emerald-400">185 ms</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "45%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Электронные Весы МИДЛ COM-драйвер</span>
                <span className="font-mono text-amber-400">5 ms</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "5%" }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
