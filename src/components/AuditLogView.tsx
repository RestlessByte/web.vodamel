import React, { useState } from "react";
import { ListFilter, Search, ShieldCheck, AlertOctagon, Info, AlertTriangle, FileSpreadsheet, Trash2 } from "lucide-react";
import { AuditLog, UserRole } from "../types";

interface AuditLogViewProps {
  logs: AuditLog[];
  currentUserRole: UserRole;
  onClearLogs: () => void;
  onAddAuditLog: (action: string, type: "info" | "success" | "warning" | "error", details: string) => void;
}

export default function AuditLogView({
  logs,
  currentUserRole,
  onClearLogs,
  onAddAuditLog
}: AuditLogViewProps) {
  
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  const safeLogs = Array.isArray(logs) ? logs : [];

  const filteredLogs = safeLogs.filter(log => {
    if (!log) return false;
    const searchLower = (search || "").toLowerCase();
    const userStr = String(log.user || "").toLowerCase();
    const actionStr = String(log.action || "").toLowerCase();
    const detailsStr = String(log.details || "").toLowerCase();
    const ipStr = String(log.ip || "");

    const matchesSearch =
      userStr.includes(searchLower) ||
      actionStr.includes(searchLower) ||
      detailsStr.includes(searchLower) ||
      ipStr.includes(searchLower);

    const matchesType = filterType === "ALL" || log.type === filterType;

    return matchesSearch && matchesType;
  });

  const handleClear = () => {
    if (currentUserRole !== UserRole.ADMIN) return;
    if (window.confirm("Вы уверены, что хотите безвозвратно очистить журнал безопасности?")) {
      onClearLogs();
      onAddAuditLog("Очистка журнала", "warning", "Администратор очистил системный журнал аудита.");
    }
  };

  return (
    <div id="audit_logs_section" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5.5 w-5.5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight font-display">Журнал безопасности и Логи аудита</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Сквозное логирование всех пользовательских действий, изменений веса тонера, калибровки весов и тестов целостности систем.
          </p>
        </div>

        {currentUserRole === UserRole.ADMIN && logs.length > 0 && (
          <button
            id="btn_clear_logs"
            onClick={handleClear}
            className="mt-4 md:mt-0 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" /> Очистить журнал безопасности
          </button>
        )}
      </div>

      {/* Search and Filters panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
        
        {/* Search */}
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="input_search_audit_logs"
            type="text"
            placeholder="Поиск по оператору, действию, ключевым фразам, IP адресу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 placeholder-slate-500"
          />
        </div>

        {/* Categories selector */}
        <div className="md:col-span-6 flex items-center gap-2 justify-end overflow-x-auto">
          <ListFilter className="h-4 w-4 text-slate-400" />
          <span className="text-slate-400 whitespace-nowrap">Уровень события:</span>
          {[
            { id: "ALL", label: "Все события" },
            { id: "info", label: "Инфо" },
            { id: "success", label: "Успех" },
            { id: "warning", label: "Предупр." },
            { id: "error", label: "Ошибки" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterType(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === cat.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800/60"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* Log Feed Ledger */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredLogs.map((log) => {
          let indicatorColor = "bg-sky-500/10 text-sky-400 border-sky-500/20";
          let Icon = Info;

          if (log.type === "success") {
            indicatorColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            Icon = ShieldCheck;
          } else if (log.type === "warning") {
            indicatorColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
            Icon = AlertTriangle;
          } else if (log.type === "error") {
            indicatorColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
            Icon = AlertOctagon;
          }

          return (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                
                {/* Event state Icon */}
                <div className={`p-2 rounded-xl border shrink-0 ${indicatorColor}`}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-white">{log.action}</span>
                    <span className="text-[10px] font-mono text-slate-500">{log.timestamp}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">IP: {log.ip}</span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">{log.details}</p>
                </div>
              </div>

              {/* User badge */}
              <div className="text-left md:text-right shrink-0 border-t md:border-t-0 border-slate-800 pt-2 md:pt-0">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Исполнитель:</span>
                <span className="text-xs font-bold text-slate-300">{log.user}</span>
                <span className="text-[9px] text-indigo-400 block font-mono font-bold uppercase tracking-wider">
                  {log.role === UserRole.ADMIN ? "IT-Администратор" : "IT-Служба"}
                </span>
              </div>

            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 bg-slate-950 border border-dashed border-slate-800 rounded-2xl">
            <ShieldCheck className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Записи в журнале безопасности не обнаружены</p>
          </div>
        )}
      </div>

    </div>
  );
}
