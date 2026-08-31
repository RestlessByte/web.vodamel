import React, { useState, useEffect } from "react";
import {
  Monitor,
  Scale,
  Camera,
  Bell,
  ShieldAlert,
  Server,
  User as UserIcon,
  Layers,
  Activity,
  LogOut,
  ChevronRight,
  Wifi,
  Users,
  Settings,
  HelpCircle,
  Database,
  Laptop,
  Folder,
  FileText,
  Zap
} from "lucide-react";
import {
  User,
  UserRole,
  Computer,
  CartridgeModel,
  TonerTub,
  WeighingLog,
  AuditLog,
  AlertSettings,
  ServiceMemo
} from "./types";
import {
  initialUsers,
  initialComputers,
  initialCartridgeModels,
  initialTonerTubs,
  initialWeighingLogs,
  defaultAlertSettings,
  initialAuditLogs,
  initialServiceMemos,
  mockTelemetryHistory
} from "./data";

// Components
import PhotoStudio from "./components/PhotoStudio";
import ComputerInventory from "./components/ComputerInventory";
import GrafanaDashboard from "./components/GrafanaDashboard";
import TonerWarehouse from "./components/TonerWarehouse";
import AlertConfig from "./components/AlertConfig";
import AuditLogView from "./components/AuditLogView";
import DockerGuide from "./components/DockerGuide";
import DatabaseConsole from "./components/DatabaseConsole";
import ITDepartmentDashboard from "./components/ITDepartmentDashboard";
import ServiceMemosFolder from "./components/ServiceMemosFolder";
import ParsingDashboard from "./components/ParsingDashboard";
import { dbService } from "./services/apiClient";

export default function App() {
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // --- Persistent State from PostgreSQL Database ---
  const [computers, setComputers] = useState<Computer[]>(initialComputers);
  const [cartridgeModels, setCartridgeModels] = useState<CartridgeModel[]>(initialCartridgeModels);
  const [tonerTubs, setTonerTubs] = useState<TonerTub[]>(initialTonerTubs);
  const [weighingLogs, setWeighingLogs] = useState<WeighingLog[]>(initialWeighingLogs);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(defaultAlertSettings);
  const [memos, setMemos] = useState<ServiceMemo[]>(initialServiceMemos);

  // --- Active Operator and Role State ---
  const [currentOperatorId, setCurrentOperatorId] = useState<string>("u-2"); // Dmitry Kozlov (Admin) by default
  const [currentTab, setCurrentTab] = useState<string>("computers");

  // Initialize PostgreSQL data on load
  useEffect(() => {
    async function loadData() {
      try {
        const [c, m, t, l, a, s, mem] = await Promise.all([
          dbService.getComputers(),
          dbService.getCartridgeModels(),
          dbService.getTonerTubs(),
          dbService.getWeighingLogs(),
          dbService.getAuditLogs(),
          dbService.getAlertSettings(),
          dbService.getServiceMemos()
        ]);
        setComputers(c || []);
        setCartridgeModels(m || []);
        setTonerTubs(t || []);
        setWeighingLogs(l || []);
        setAuditLogs(a || []);
        setAlertSettings(s || defaultAlertSettings);
        setMemos(mem || []);
      } catch (err) {
        console.error("Failed to load initial data from PostgreSQL:", err);
      } finally {
        setIsDbLoaded(true);
      }
    }
    loadData();
  }, []);

  // Update callbacks for entities with direct PostgreSQL sync and robust deletions
  const handleUpdateComputers = async (updated: Computer[]) => {
    setComputers(updated);
    // Sync with PostgreSQL
    for (const item of updated) {
      await dbService.saveComputer(item);
    }
  };

  const handleUpdateCartridges = async (updated: CartridgeModel[]) => {
    setCartridgeModels(updated);
    for (const item of updated) {
      await dbService.saveCartridgeModel(item);
    }
  };

  const handleUpdateTonerTubs = async (updated: TonerTub[]) => {
    setTonerTubs(updated);
    for (const item of updated) {
      await dbService.saveTonerTub(item);
    }
  };

  const handleUpdateWeighingLogs = async (updated: WeighingLog[]) => {
    setWeighingLogs(updated);
    for (const item of updated) {
      await dbService.saveWeighingLog(item);
    }
  };

  const handleUpdateAuditLogs = async (updated: AuditLog[]) => {
    setAuditLogs(updated);
  };

  const handleUpdateAlertSettings = async (updated: AlertSettings) => {
    setAlertSettings(updated);
    await dbService.saveAlertSettings(updated);
  };

  const handleUpdateMemos = async (updated: ServiceMemo[]) => {
    setMemos(updated);
    for (const item of updated) {
      await dbService.saveServiceMemo(item);
    }
  };

  // Find active operator specs
  const activeOperator = initialUsers.find((u) => u.id === currentOperatorId) || initialUsers[1];
  const currentUserRole = activeOperator.role;
  const currentUserName = activeOperator.name;

  // --- Helper state mutation callbacks ---
  const handleAddAuditLog = (action: string, type: "info" | "success" | "warning" | "error", details: string) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleString("ru-RU"),
      user: currentUserName,
      role: currentUserRole,
      action: action,
      type: type,
      details: details,
      ip: currentUserRole === UserRole.ADMIN ? "192.168.1.10" : "192.168.1.50"
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    dbService.saveAuditLog(newLog).catch(console.error);
  };

  const handleTriggerTelemetryAlert = (metric: string, val: number) => {
    const newLog: AuditLog = {
      id: `audit-alert-${Date.now()}`,
      timestamp: new Date().toLocaleString("ru-RU"),
      user: "Служба Телеметрии (Grafana)",
      role: UserRole.ADMIN,
      action: "Срабатывание порога телеметрии",
      type: "error",
      details: `Зафиксировано критическое превышение ${metric}: ${val}%. Сработал триггер тревоги в Telegram/SMS.`,
      ip: "127.0.0.1"
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    dbService.saveAuditLog(newLog).catch(console.error);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold font-mono">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight font-display">ARCHON IT & WAREHOUSE</h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PROD v3.5
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Комплексный рабочий стол управления и контроля целостности инфраструктуры</p>
          </div>
        </div>

        {/* Live Network & PostgreSQL Metrics ribbon */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-950/60 border border-slate-800 px-4 py-1.5 rounded-xl text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-indigo-400" />
            <span>СУБД: <strong className="text-emerald-400">PostgreSQL (Cloud SQL)</strong></span>
          </div>
          <div className="h-3 w-px bg-slate-800"></div>
          <div className="flex items-center gap-1.5">
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            <span>Регион: <strong className="text-slate-200">europe-west1</strong></span>
          </div>
          <div className="h-3 w-px bg-slate-800"></div>
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
            <span>Датчики: <strong className="text-emerald-400">АКТИВНЫ</strong></span>
          </div>
        </div>

        {/* IT Department Role Indicator */}
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-indigo-400 font-semibold uppercase tracking-wider font-mono">Служба:</span>
              <span className="text-xs font-bold text-white">IT-отдел</span>
            </div>
            <p className="text-[10px] text-slate-400">Административный доступ</p>
          </div>
          <div className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[9px] font-bold text-rose-400 whitespace-nowrap tracking-wider">
            ⚙️ АДМИН
          </div>
        </div>
      </header>

      {/* Main Grid Workspace Layout */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Modular Navigation (Col 3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <span className="text-[10px] text-slate-500 font-mono block uppercase mb-4 tracking-widest font-bold">РАЗДЕЛЫ РАБОЧЕГО СТОЛА</span>
            
            <nav className="space-y-1">
              {[
                { id: "computers", label: "Контроль и Спецификации ПК", icon: Monitor, color: "text-indigo-400" },
                { id: "parsing", label: "Парсинг & TigerVNC (Админы)", icon: Zap, color: "text-amber-400" },
                { id: "memos", label: "Папка служебок & Файлы (СЭД)", icon: Folder, color: "text-amber-400" },
                { id: "it_department", label: "Дашборд IT-Отдела", icon: Laptop, color: "text-blue-400" },
                { id: "toner", label: "Заправка весов & Картриджи", icon: Scale, color: "text-emerald-400" },
                { id: "photostudio", label: "Фотостудия 3х4 (ОТК)", icon: Camera, color: "text-teal-400" },
                { id: "grafana", label: "Дашборд Grafana (CPU/RAM)", icon: Activity, color: "text-orange-500" },
                { id: "alerts", label: "Калибровка API Оповещений", icon: Bell, color: "text-rose-500" },
                { id: "audit", label: "Журнал аудита действий", icon: AuditLogView, color: "text-amber-400" },
                { id: "database", label: "Студия СУБД (PostgreSQL)", icon: Database, color: "text-indigo-400" },
                { id: "docker", label: "Контейнеры Docker", icon: Server, color: "text-cyan-400" }
              ].map((tab) => {
                const TabIcon = tab.id === "audit" ? ShieldAlert : tab.icon;
                const isActive = currentTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-semibold transition-all group cursor-pointer ${
                      isActive
                        ? "bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.1)]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <TabIcon className={`h-4.5 w-4.5 ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                      <span>{tab.label}</span>
                    </div>
                    <ChevronRight className={`h-3 w-3 text-slate-600 group-hover:text-slate-400 transition-transform ${isActive ? "translate-x-1 text-indigo-400" : ""}`} />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick status summary widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-widest font-bold">СВОДКА СОСТОЯНИЯ</span>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Компьютеров на мониторинге:</span>
                <span className="font-mono text-slate-200 font-bold">{computers.length} шт</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Исправны (ОК):</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {computers.filter((pc) => pc.status === "OK").length} шт
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Требуют внимания / Сбой:</span>
                <span className="text-rose-400 font-bold font-mono">
                  {computers.filter((pc) => pc.status !== "OK").length} шт
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Весовых замеров сегодня:</span>
                <span className="text-indigo-400 font-bold font-mono">{weighingLogs.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Active Workspace Content (Col 9) */}
        <div className="lg:col-span-9 space-y-6">
          {currentTab === "computers" && (
            <ComputerInventory
              computers={computers}
              users={initialUsers}
              currentUserRole={currentUserRole}
              onUpdateComputers={handleUpdateComputers}
              onAddAuditLog={handleAddAuditLog}
              onOpenITDashboard={() => setCurrentTab("it_department")}
            />
          )}

          {currentTab === "parsing" && (
            <ParsingDashboard
              computers={computers}
              onAddAuditLog={handleAddAuditLog}
              currentUserRole={currentUserRole}
            />
          )}

          {currentTab === "memos" && (
            <ServiceMemosFolder
              memos={memos}
              onSaveMemos={handleUpdateMemos}
              currentUserRole={currentUserRole}
              currentOperatorName={currentUserName}
            />
          )}

          {currentTab === "it_department" && (
            <ITDepartmentDashboard
              currentUserRole={currentUserRole}
              currentUserName={currentUserName}
              computers={computers}
              onNavigateToComputers={(dept) => {
                setCurrentTab("computers");
              }}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {currentTab === "toner" && (
            <TonerWarehouse
              cartridgeModels={cartridgeModels}
              tonerTubs={tonerTubs}
              weighingLogs={weighingLogs}
              users={initialUsers}
              currentUserRole={currentUserRole}
              currentUserName={currentUserName}
              onUpdateCartridges={handleUpdateCartridges}
              onUpdateTonerTubs={handleUpdateTonerTubs}
              onUpdateWeighingLogs={handleUpdateWeighingLogs}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {currentTab === "photostudio" && (
            <PhotoStudio
              currentUserRole={currentUserRole}
              currentUserName={currentUserName}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {currentTab === "grafana" && (
            <GrafanaDashboard
              telemetryHistory={mockTelemetryHistory}
              currentUserRole={currentUserRole}
              onAddAuditLog={handleAddAuditLog}
              onTriggerTelemetryAlert={handleTriggerTelemetryAlert}
            />
          )}

          {currentTab === "alerts" && (
            <AlertConfig
              alertSettings={alertSettings}
              currentUserRole={currentUserRole}
              onUpdateSettings={handleUpdateAlertSettings}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {currentTab === "audit" && (
            <AuditLogView
              logs={auditLogs}
              currentUserRole={currentUserRole}
              onClearLogs={() => {
                setAuditLogs([]);
                dbService.clearAuditLogs().catch(console.error);
              }}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {currentTab === "docker" && (
            <DockerGuide />
          )}

          {currentTab === "database" && (
            <DatabaseConsole
              computers={computers}
              cartridgeModels={cartridgeModels}
              tonerTubs={tonerTubs}
              weighingLogs={weighingLogs}
              auditLogs={auditLogs}
              alertSettings={alertSettings}
              currentUserRole={currentUserRole}
              onUpdateComputers={handleUpdateComputers}
              onUpdateCartridges={handleUpdateCartridges}
              onUpdateTonerTubs={handleUpdateTonerTubs}
              onUpdateWeighingLogs={handleUpdateWeighingLogs}
              onUpdateAuditLogs={handleUpdateAuditLogs}
              onUpdateAlertSettings={handleUpdateAlertSettings}
              onAddAuditLog={handleAddAuditLog}
            />
          )}
        </div>
      </main>

      {/* Decorative footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-[10px] text-slate-500 font-mono mt-auto tracking-wider uppercase">
        Archon OS • IT & Warehouse Integrity Management Dashboard © 2026 • Cloud SQL PostgreSQL on europe-west1.
      </footer>
    </div>
  );
}
