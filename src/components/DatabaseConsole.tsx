import React, { useState, useEffect } from "react";
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Search,
  FileText,
  Trash2,
  Play,
  Terminal,
  Code2,
  Table,
  Layers,
  Sparkles,
  Copy,
  Check,
  HardDrive,
  Cpu,
  Server,
  Zap,
  RotateCcw
} from "lucide-react";
import { Computer, CartridgeModel, TonerTub, WeighingLog, AuditLog, AlertSettings, UserRole } from "../types";
import { dbService } from "../services/apiClient";

interface DatabaseConsoleProps {
  computers: Computer[];
  cartridgeModels: CartridgeModel[];
  tonerTubs: TonerTub[];
  weighingLogs: WeighingLog[];
  auditLogs: AuditLog[];
  alertSettings: AlertSettings;
  currentUserRole: UserRole;
  onUpdateComputers: (updated: Computer[]) => void;
  onUpdateCartridges: (updated: CartridgeModel[]) => void;
  onUpdateTonerTubs: (updated: TonerTub[]) => void;
  onUpdateWeighingLogs: (updated: WeighingLog[]) => void;
  onUpdateAuditLogs: (updated: AuditLog[]) => void;
  onUpdateAlertSettings: (updated: AlertSettings) => void;
  onAddAuditLog: (action: string, type: "info" | "success" | "warning" | "error", details: string) => void;
}

export default function DatabaseConsole({
  computers,
  cartridgeModels,
  tonerTubs,
  weighingLogs,
  auditLogs,
  alertSettings,
  currentUserRole,
  onUpdateComputers,
  onUpdateCartridges,
  onUpdateTonerTubs,
  onUpdateWeighingLogs,
  onUpdateAuditLogs,
  onUpdateAlertSettings,
  onAddAuditLog
}: DatabaseConsoleProps) {
  const [activeMode, setActiveMode] = useState<"tables" | "sql_editor" | "schema">("sql_editor");
  const [selectedTable, setSelectedTable] = useState<string>("computers");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [copiedQuery, setCopiedQuery] = useState(false);

  // SQL Query Execution State
  const [sqlInput, setSqlInput] = useState<string>("SELECT * FROM computers;");
  const [sqlResults, setSqlResults] = useState<{
    columns: string[];
    rows: any[];
    rowCount: number;
    execTimeMs: number;
    rawMessage?: string;
  } | null>(null);
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [dbStatus, setDbStatus] = useState<string>("Подключение к SQLite...");

  useEffect(() => {
    fetch("/api/health")
      .then(res => res.json())
      .then(data => {
        if (data.status === "ok") {
          setDbStatus("SQLite 3 (Локальный файл: archon_inventory.sqlite) • Подключено");
        } else {
          setDbStatus("Ошибка подключения к СУБД");
        }
      })
      .catch(() => setDbStatus("SQLite 3 (Локальный режим)"));

    executeUserSql("SELECT name as table_name, type FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;");
  }, []);

  const sqlPresets = [
    {
      label: "📋 Все компьютеры в реестре",
      query: "SELECT id, name, assigned_user_name, department, ipv4, status, last_check FROM computers ORDER BY created_at DESC;"
    },
    {
      label: "🖨️ Каталог картриджей и нормы заправки",
      query: "SELECT id, name, printer_model, empty_weight, full_weight, toner_weight FROM cartridge_models ORDER BY name;"
    },
    {
      label: "⚖️ История взвешиваний (ОТК)",
      query: "SELECT date, model_name, measured_weight, fill_percentage, status, operator FROM weighing_logs ORDER BY created_at DESC LIMIT 20;"
    },
    {
      label: "🚨 Заявки Helpdesk (Инциденты)",
      query: "SELECT id, title, priority, status, category, assignee, requester FROM it_tickets ORDER BY created_at DESC;"
    },
    {
      label: "🖥️ Серверы и узлы инфраструктуры",
      query: "SELECT name, role, ip, status, cpu_usage, ram_usage, disk_usage, uptime FROM it_servers ORDER BY status DESC;"
    },
    {
      label: "📁 Служебные записки (СЭД)",
      query: "SELECT number, title, category, priority, status, author, deadline_date, estimated_cost FROM service_memos ORDER BY created_at DESC;"
    },
    {
      label: "📊 Сводная статистика количества строк в SQLite",
      query: `SELECT 'computers' as "Таблица", count(*) as "Количество записей" FROM computers
UNION ALL SELECT 'cartridge_models', count(*) FROM cartridge_models
UNION ALL SELECT 'toner_tubs', count(*) FROM toner_tubs
UNION ALL SELECT 'weighing_logs', count(*) FROM weighing_logs
UNION ALL SELECT 'it_tickets', count(*) FROM it_tickets
UNION ALL SELECT 'it_servers', count(*) FROM it_servers
UNION ALL SELECT 'it_vlans', count(*) FROM it_vlans
UNION ALL SELECT 'it_licenses', count(*) FROM it_licenses
UNION ALL SELECT 'service_memos', count(*) FROM service_memos
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs;`
    }
  ];

  const executeUserSql = async (customQuery?: string) => {
    const sqlToRun = (customQuery !== undefined ? customQuery : sqlInput).trim();
    if (!sqlToRun) return;

    setIsExecutingSql(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await dbService.executeSql(sqlToRun);
      setSqlResults({
        columns: res.columns,
        rows: res.rows,
        rowCount: res.rowCount,
        execTimeMs: res.durationMs
      });

      const isMutation = /^(INSERT|UPDATE|DELETE|TRUNCATE|DROP|ALTER|CREATE)/i.test(sqlToRun);
      if (isMutation) {
        onAddAuditLog("Выполнение SQLite SQL", "info", `Выполнен запрос: ${sqlToRun.slice(0, 100)}...`);
        // Refresh client data
        const [c, m, t, l, a] = await Promise.all([
          dbService.getComputers(),
          dbService.getCartridgeModels(),
          dbService.getTonerTubs(),
          dbService.getWeighingLogs(),
          dbService.getAuditLogs()
        ]);
        onUpdateComputers(c);
        onUpdateCartridges(m);
        onUpdateTonerTubs(t);
        onUpdateWeighingLogs(l);
        onUpdateAuditLogs(a);
        setSuccessMsg(`Запрос успешно выполнен на SQLite 3. Затронуто строк: ${res.rowCount}`);
      }
    } catch (err: any) {
      setErrorMsg(`Ошибка SQLite: ${err.message || String(err)}`);
      setSqlResults(null);
    } finally {
      setIsExecutingSql(false);
    }
  };

  const handleSeedDatabase = async () => {
    try {
      await dbService.seedDefaultData();
      const [c, m, t, l, a] = await Promise.all([
        dbService.getComputers(),
        dbService.getCartridgeModels(),
        dbService.getTonerTubs(),
        dbService.getWeighingLogs(),
        dbService.getAuditLogs()
      ]);
      onUpdateComputers(c);
      onUpdateCartridges(m);
      onUpdateTonerTubs(t);
      onUpdateWeighingLogs(l);
      onUpdateAuditLogs(a);
      onAddAuditLog("Заполнение базы данных", "success", "База данных SQLite наполнена эталонным парком ПК (включая Склад 1502, Бухгалтерию, Отдел продаж) и каталогом картриджей.");
      setSuccessMsg("Эталонные данные успешно загружены в SQLite! Загружено компьютеров: " + c.length + ", картриджей: " + m.length);
      executeUserSql("SELECT name as table_name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;");
    } catch (err: any) {
      setErrorMsg(`Ошибка загрузки данных: ${err.message}`);
    }
  };

  const handleResetAllTables = async () => {
    if (!confirm("ВНИМАНИЕ! Вы действительно хотите очистить все таблицы базы данных SQLite? Все элементы будут безвозвратно удалены.")) {
      return;
    }

    try {
      await dbService.resetAll();
      onUpdateComputers([]);
      onUpdateCartridges([]);
      onUpdateTonerTubs([]);
      onUpdateWeighingLogs([]);
      onUpdateAuditLogs([]);
      onAddAuditLog("Очистка базы данных", "warning", "Все таблицы SQLite очищены по запросу администратора.");
      setSuccessMsg("Все таблицы SQLite успешно очищены (DELETE). База данных полностью пуста.");
      executeUserSql("SELECT name as table_name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;");
    } catch (err: any) {
      setErrorMsg(`Ошибка очистки базы данных: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 animate-fade-in">
      {/* Top Banner & SQLite Connection Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight font-display">Студия СУБД SQLite 3 (Локальная база)</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                SQLite 3 / Embedded
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{dbStatus}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSeedDatabase}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
            title="Заполнить базу эталонным парком ПК (Склад 1502, Бухгалтерия, Отдел продаж) и картриджами"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Заполнить парк и склад (Seed)
          </button>

          <button
            onClick={() => executeUserSql()}
            disabled={isExecutingSql}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Выполнить SQL
          </button>

          {currentUserRole === UserRole.ADMIN && (
            <button
              onClick={handleResetAllTables}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Очистить все таблицы базы данных"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Очистить таблицы
            </button>
          )}
        </div>
      </div>

      {/* Nav Tabs: SQL Editor, Tables, Schema */}
      <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
        {[
          { id: "sql_editor", label: "SQL-Терминал запросов", icon: Terminal },
          { id: "tables", label: "Инспектор таблиц данных", icon: Table },
          { id: "schema", label: "Схема таблиц DDL", icon: Layers }
        ].map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMode(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <TabIcon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MODE 1: SQL TERMINAL */}
      {activeMode === "sql_editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Query Editor & Presets (Col 7) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Редактор SQL-запросов (DQL / DML)</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">SQLite 3 Dialect</span>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Быстрые пресеты запросов:</span>
              <div className="flex flex-wrap gap-1.5">
                {sqlPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSqlInput(preset.query);
                      executeUserSql(preset.query);
                    }}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer text-left"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="flex-1 flex flex-col space-y-2">
              <label className="text-[10px] text-slate-400 font-mono">SQLite Запрос:</label>
              <textarea
                rows={6}
                value={sqlInput}
                onChange={(e) => setSqlInput(e.target.value)}
                placeholder="SELECT * FROM computers WHERE status = 'OK';"
                className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-2xl p-4 text-amber-400 focus:outline-none focus:border-amber-500 shadow-inner resize-y leading-relaxed"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-mono">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-mono">
                {successMsg}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 font-mono">Поддерживаются команды SELECT, INSERT, UPDATE, DELETE, PRAGMA</span>
              <button
                onClick={() => executeUserSql()}
                disabled={isExecutingSql}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Play className="h-4 w-4 fill-current" />
                {isExecutingSql ? "Выполняется..." : "Запустить (Run SQL)"}
              </button>
            </div>
          </div>

          {/* Results Table (Col 5) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Table className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Результат выполнения</h3>
              </div>
              {sqlResults && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {sqlResults.rowCount} строк ({sqlResults.execTimeMs} ms)
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto max-h-[450px] border border-slate-800 rounded-2xl bg-slate-950">
              {sqlResults && sqlResults.rows && sqlResults.rows.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 sticky top-0">
                      {sqlResults.columns.map((col, i) => (
                        <th key={i} className="py-2.5 px-3 whitespace-nowrap font-bold text-[11px] text-slate-300">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sqlResults.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-slate-800/40 hover:bg-slate-900/40 transition-colors">
                        {sqlResults.columns.map((col, colIdx) => {
                          const val = row[col];
                          const displayVal = typeof val === "object" ? JSON.stringify(val) : String(val ?? "NULL");
                          return (
                            <td key={colIdx} className="py-2 px-3 whitespace-nowrap text-[11px] text-slate-300 max-w-xs truncate" title={displayVal}>
                              {displayVal}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-500 font-mono text-xs space-y-2">
                  <Terminal className="h-8 w-8 text-slate-600 mx-auto" />
                  <p>Результаты запроса появятся здесь.</p>
                  <p className="text-[10px] text-slate-600">Нажмите «Выполнить SQL» для запуска выбранного запроса.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: TABLES INSPECTOR */}
      {activeMode === "tables" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div className="flex items-center gap-2">
              <Table className="h-5 w-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Инспектор Таблиц SQLite 3</h3>
                <p className="text-[11px] text-slate-400">Просмотр и мониторинг наполнения локальной базы данных в реальном времени.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: "computers", label: `Компьютеры (${computers.length})` },
                { id: "cartridge_models", label: `Картриджи (${cartridgeModels.length})` },
                { id: "toner_tubs", label: `Тумбы тонера (${tonerTubs.length})` },
                { id: "weighing_logs", label: `Журнал взвешиваний (${weighingLogs.length})` },
                { id: "audit_logs", label: `Аудит (${auditLogs.length})` }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTable(t.id);
                    executeUserSql(`SELECT * FROM ${t.id};`);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTable === t.id
                      ? "bg-amber-600 text-white"
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950 max-h-[500px]">
            {sqlResults && sqlResults.rows && sqlResults.rows.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 sticky top-0">
                    {sqlResults.columns.map((col, i) => (
                      <th key={i} className="py-2.5 px-3 whitespace-nowrap font-bold text-[11px] text-slate-300">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sqlResults.rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-slate-800/40 hover:bg-slate-900/40 transition-colors">
                      {sqlResults.columns.map((col, colIdx) => {
                        const val = row[col];
                        const displayVal = typeof val === "object" ? JSON.stringify(val) : String(val ?? "NULL");
                        return (
                          <td key={colIdx} className="py-2 px-3 whitespace-nowrap text-[11px] text-slate-300 max-w-xs truncate" title={displayVal}>
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs space-y-2">
                <CheckCircle2 className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-slate-400 font-bold">Таблица {selectedTable} пуста</p>
                <p className="text-[11px] text-slate-600">Все записи очищены. Вы можете создавать новые элементы в соответствующих разделах интерфейса.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 3: SCHEMA DDL */}
      {activeMode === "schema" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Структура Схемы Таблиц SQLite 3 (Drizzle ORM)</h3>
            </div>
            <span className="text-xs font-mono text-amber-400">11 Таблиц</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "computers", fields: ["id (PK)", "name", "assigned_user_id", "os", "cpu", "ram", "storage", "ipv4", "mac", "status", "services (JSON)"] },
              { name: "cartridge_models", fields: ["id (PK)", "name", "printer_model", "empty_weight", "full_weight", "toner_weight"] },
              { name: "toner_tubs", fields: ["id (PK)", "name", "brand", "capacity_grams", "remaining_grams", "color"] },
              { name: "weighing_logs", fields: ["id (PK)", "model_id", "model_name", "measured_weight", "fill_percentage", "date", "operator", "status", "notes"] },
              { name: "it_tickets", fields: ["id (PK)", "title", "description", "priority", "status", "category", "assignee", "requester", "department"] },
              { name: "it_servers", fields: ["id (PK)", "name", "role", "ip", "os", "uptime", "cpu_usage", "ram_usage", "disk_usage", "ping_ms", "ports (JSON)"] },
              { name: "it_vlans", fields: ["id (PK)", "name", "subnet", "dhcp_scope", "gateway", "active_hosts", "purpose", "color"] },
              { name: "it_licenses", fields: ["id (PK)", "name", "vendor", "type", "used_seats", "total_seats", "expires_at", "status"] },
              { name: "service_memos", fields: ["id (PK)", "number", "title", "category", "priority", "status", "author", "deadline_date", "attachments (JSON)"] },
              { name: "audit_logs", fields: ["id (PK)", "timestamp", "user", "role", "action", "type", "details", "ip"] },
              { name: "alert_settings", fields: ["id (PK)", "telegram_bot_token", "telegram_chat_id", "sms_api_url", "sms_api_key", "cpu_threshold", "temp_threshold"] }
            ].map(table => (
              <div key={table.name} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <strong className="text-xs font-mono font-bold text-amber-400">{table.name}</strong>
                  <span className="text-[10px] text-slate-500 font-mono">sqlite</span>
                </div>
                <ul className="text-[11px] font-mono text-slate-400 space-y-1">
                  {table.fields.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-slate-600">•</span>
                      <span className={f.includes("PK") ? "text-amber-400 font-bold" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
