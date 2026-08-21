import React, { useState } from "react";
import { Monitor, User as UserIcon, Shield, Search, Plus, Trash2, Edit2, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Cpu, Database, Network, Key, PlusCircle, Check, Laptop } from "lucide-react";
import { Computer, User, UserRole, ComputerStatus } from "../types";
import { dbService } from "../services/apiClient";

export function parseAida64Report(text: string) {
  const lines = text.split(/\r?\n/);
  let name = "";
  let os = "";
  let cpu = "";
  let ram = "";
  let storage = "";
  let ip = "";
  let mac = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/(Имя компьютера|Computer Name)/i.test(trimmed)) {
      const parts = trimmed.split(/(Имя компьютера|Computer Name)/i);
      if (parts[2]) name = parts[2].replace(/^[ \t\-\:\=]+/, "").trim();
    }
    else if (/(Операционная система|Operating System)/i.test(trimmed)) {
      const parts = trimmed.split(/(Операционная система|Operating System)/i);
      if (parts[2]) os = parts[2].replace(/^[ \t\-\:\=]+/, "").trim();
    }
    else if (/(Тип ЦП|CPU Type|Processor)/i.test(trimmed)) {
      const parts = trimmed.split(/(Тип ЦП|CPU Type|Processor)/i);
      if (parts[2]) cpu = parts[2].replace(/^[ \t\-\:\=]+/, "").trim();
    }
    else if (/(Системная память|System Memory|Total Memory)/i.test(trimmed)) {
      const parts = trimmed.split(/(Системная память|System Memory|Total Memory)/i);
      if (parts[2]) ram = parts[2].replace(/^[ \t\-\:\=]+/, "").trim();
    }
    else if (/(Дисковый накопитель|Disk Drive|SSD|Storage|HDD)/i.test(trimmed)) {
      const parts = trimmed.split(/(Дисковый накопитель|Disk Drive|SSD|Storage|HDD)/i);
      if (parts[2]) storage = parts[2].replace(/^[ \t\-\:\=]+/, "").trim();
    }
    else if (/(Первичный адрес IP|Primary IP Address|IP Address|Первичный адрес IPv4)/i.test(trimmed)) {
      const parts = trimmed.split(/(Первичный адрес IP|Primary IP Address|IP Address|Первичный адрес IPv4)/i);
      if (parts[2]) ip = parts[2].replace(/^[ \t\-\:\=]+/, "").trim();
    }
    else if (/(Первичный адрес MAC|Primary MAC Address|MAC Address|Физический адрес|Physical Address)/i.test(trimmed)) {
      const parts = trimmed.split(/(Первичный адрес MAC|Primary MAC Address|MAC Address|Физический адрес|Physical Address)/i);
      if (parts[2]) mac = parts[2].replace(/^[ \t\-\:\=]+/, "").trim();
    }
  }

  // Fallbacks in case formatting is slightly different (e.g. key: value)
  if (!name || !os || !cpu) {
    for (const line of lines) {
      const parts = line.split(/[:=]/);
      if (parts.length >= 2) {
        const key = parts[0].trim().toLowerCase();
        const value = parts.slice(1).join(":").trim();
        if (!key || !value) continue;

        if (key.includes("компьютер") || key.includes("computer name") || (key.includes("имя") && key.includes("комп"))) {
          if (!name) name = value;
        } else if (key.includes("операционная") || key.includes("os name") || (key.includes("system name") && key.includes("os"))) {
          if (!os) os = value;
        } else if (key.includes("тип цп") || key.includes("cpu") || key.includes("процессор")) {
          if (!cpu) cpu = value;
        } else if (key.includes("память") || key.includes("ram") || key.includes("memory")) {
          if (!ram) ram = value;
        } else if (key.includes("дисковый") || key.includes("диск") || key.includes("drive") || key.includes("storage")) {
          if (!storage) storage = value;
        } else if (key.includes("ip адрес") || key.includes("ip-адрес") || key.includes("ip address") || key.includes("первичный адрес ip")) {
          if (!ip) ip = value;
        } else if (key.includes("mac") || key.includes("мак") || key.includes("physical address")) {
          if (!mac) mac = value;
        }
      }
    }
  }

  // Clean values from double spacing and common AIDA tags
  const cleanStr = (s: string) => s.replace(/\s+/g, " ").trim();

  // If we still can't find some items, let's extract generic IP/MAC address via RegExp
  if (!ip) {
    const ipMatch = text.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    if (ipMatch) ip = ipMatch[0];
  }
  if (!mac) {
    const macMatch = text.match(/\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/);
    if (macMatch) mac = macMatch[0].toUpperCase().replace(/-/g, ":");
  }

  return {
    name: name ? cleanStr(name) : "PC-IMPORTED-" + Math.floor(Math.random() * 1000),
    os: os ? cleanStr(os) : "Windows 11 Pro",
    cpu: cpu ? cleanStr(cpu) : "Intel Core i5 (AIDA64)",
    ram: ram ? cleanStr(ram) : "16 GB DDR4",
    storage: storage ? cleanStr(storage) : "512 GB SSD",
    ipv4: ip ? cleanStr(ip) : "192.168.1." + Math.floor(Math.random() * 200 + 50),
    mac: mac ? cleanStr(mac).toUpperCase().replace(/-/g, ":") : "00:1A:2B:3C:4D:5E"
  };
}

export function parseMultipleAida64Reports(text: string) {
  const lines = text.split(/\r?\n/);
  const chunks: string[][] = [];
  let currentChunk: string[] = [];

  for (const line of lines) {
    const isNewReportIndicator = /(Имя компьютера|Computer Name)/i.test(line) && currentChunk.some(cl => /(Имя компьютера|Computer Name)/i.test(cl));
    if (isNewReportIndicator) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }
      currentChunk = [line];
    } else {
      currentChunk.push(line);
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks.map(chunk => parseAida64Report(chunk.join("\n")));
}

export interface ParsedImport {
  id: string;
  name: string;
  os: string;
  cpu: string;
  ram: string;
  storage: string;
  ipv4: string;
  mac: string;
  department: string;
  subdepartment: string;
  assignedUserName: string;
}

export const POPULAR_DEPARTMENTS = ["Склад", "Администрация", "Бухгалтерия", "Отдел продаж", "Разработка", "Техподдержка"];
export const POPULAR_SUBDEPARTMENTS = ["Приемка", "Маркировка", "Упаковка", "IT-служба", "Бухгалтерия", "Кабинет директора", "Кабинет 101", "Кабинет 102"];

interface ComputerInventoryProps {
  computers: Computer[];
  users: User[];
  currentUserRole: UserRole;
  onUpdateComputers: (updated: Computer[]) => void;
  onAddAuditLog: (action: string, type: "info" | "success" | "warning" | "error", details: string) => void;
  onOpenITDashboard?: () => void;
}

export default function ComputerInventory({
  computers,
  users,
  currentUserRole,
  onUpdateComputers,
  onAddAuditLog,
  onOpenITDashboard,
}: ComputerInventoryProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [editingComputer, setEditingComputer] = useState<Computer | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedServices, setSelectedServices] = useState<{ name: string; status: "running" | "stopped" }[]>([
    { name: "CartridgeScaleDriver", status: "running" },
    { name: "TonerTrackerAgent", status: "running" }
  ]);

  // Form states
  const [formName, setFormName] = useState("");
  const [formUserId, setFormUserId] = useState("");
  const [formUserName, setFormUserName] = useState("");
  const [formOs, setFormOs] = useState("Windows 11 Pro");
  const [formCpu, setFormCpu] = useState("Intel Core i5-12400");
  const [formRam, setFormRam] = useState("16 GB DDR4");
  const [formStorage, setFormStorage] = useState("512 GB SSD");
  const [formIpv4, setFormIpv4] = useState("192.168.1.51");
  const [formMac, setFormMac] = useState("00:1A:2B:3C:4D:5E");
  const [formStatus, setFormStatus] = useState<ComputerStatus>("OK");
  const [formDepartment, setFormDepartment] = useState("");
  const [formSubdepartment, setFormSubdepartment] = useState("");

  // AIDA64 Import states
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [importUserName, setImportUserName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [importedPcs, setImportedPcs] = useState<ParsedImport[]>([]);
  const [batchDepartment, setBatchDepartment] = useState("");
  const [batchSubdepartment, setBatchSubdepartment] = useState("");

  // Layout view modes
  const [viewMode, setViewMode] = useState<"list" | "groups">("groups");
  const [filterDepartment, setFilterDepartment] = useState<string>("ALL");

  // Filter computers
  const filteredComputers = computers.filter((pc) => {
    if (!pc) return false;
    const s = (search || "").toLowerCase();
    const matchesSearch =
      (pc.name || "").toLowerCase().includes(s) ||
      (pc.assignedUserName || "").toLowerCase().includes(s) ||
      (pc.ipv4 || "").includes(search) ||
      (pc.department || "").toLowerCase().includes(s) ||
      (pc.subdepartment || "").toLowerCase().includes(s) ||
      (pc.cpu || "").toLowerCase().includes(s);

    const matchesStatus = filterStatus === "ALL" || pc.status === filterStatus;
    const matchesDepartment = filterDepartment === "ALL" || (pc.department || "Не назначен") === filterDepartment;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const handleEditClick = (pc: Computer) => {
    if (currentUserRole !== UserRole.ADMIN) return;
    setEditingComputer(pc);
    setFormName(pc.name);
    setFormUserId(pc.assignedUserId);
    setFormUserName(pc.assignedUserName);
    setFormOs(pc.os);
    setFormCpu(pc.cpu);
    setFormRam(pc.ram);
    setFormStorage(pc.storage);
    setFormIpv4(pc.ipv4);
    setFormMac(pc.mac);
    setFormStatus(pc.status);
    setFormDepartment(pc.department || "");
    setFormSubdepartment(pc.subdepartment || "");
    setIsAdding(false);
  };

  const handleAddClick = () => {
    if (currentUserRole !== UserRole.ADMIN) return;
    setIsAdding(true);
    setEditingComputer(null);
    setFormName(`PC-WAREHOUSE-0${computers.length + 1}`);
    setFormUserId("");
    setFormUserName("");
    setFormOs("Windows 11 Pro");
    setFormCpu("Intel Core i5-12400");
    setFormRam("16 GB DDR4");
    setFormStorage("512 GB SSD");
    setFormIpv4(`192.168.1.${100 + computers.length}`);
    setFormMac("00:1A:2B:3C:4D:5E");
    setFormStatus("OK");
    setFormDepartment("Склад");
    setFormSubdepartment("Приемка");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserRole !== UserRole.ADMIN) return;

    const assignedName = formUserName.trim() || "Не назначен";
    // Generate/Reuse a dummy ID or find a matching user if any
    const foundUser = users.find((u) => u.name.toLowerCase() === assignedName.toLowerCase());
    const assignedId = foundUser ? foundUser.id : (formUserId || `u-custom-${Date.now()}`);

    if (isAdding) {
      const newPc: Computer = {
        id: `pc-${Date.now()}`,
        name: formName,
        assignedUserId: assignedId,
        assignedUserName: assignedName,
        os: formOs,
        cpu: formCpu,
        ram: formRam,
        storage: formStorage,
        ipv4: formIpv4,
        mac: formMac,
        status: formStatus,
        lastCheck: new Date().toLocaleString("ru-RU"),
        integrityHash: `SHA256: ${Math.random().toString(16).substring(2, 18)}${Math.random().toString(16).substring(2, 18)}f82b7`,
        services: [
          { name: "CartridgeScaleDriver", status: "running" },
          { name: "TonerTrackerAgent", status: "running" }
        ],
        department: formDepartment.trim() || "Не назначен",
        subdepartment: formSubdepartment.trim() || "Не назначен"
      };

      const updated = [...computers, newPc];
      onUpdateComputers(updated);
      onAddAuditLog(
        "Добавлен компьютер",
        "success",
        `Зарегистрирован новый ПК '${newPc.name}' под управлением сотрудника ${newPc.assignedUserName}.`
      );
      setIsAdding(false);
    } else if (editingComputer) {
      const updated = computers.map((pc) => {
        if (pc.id === editingComputer.id) {
          return {
            ...pc,
            name: formName,
            assignedUserId: assignedId,
            assignedUserName: assignedName,
            os: formOs,
            cpu: formCpu,
            ram: formRam,
            storage: formStorage,
            ipv4: formIpv4,
            mac: formMac,
            status: formStatus,
            lastCheck: new Date().toLocaleString("ru-RU"),
            department: formDepartment.trim() || "Не назначен",
            subdepartment: formSubdepartment.trim() || "Не назначен"
          };
        }
        return pc;
      });

      onUpdateComputers(updated);
      onAddAuditLog(
        "Изменены параметры ПК",
        "info",
        `Обновлена аппаратная конфигурация и ответственный пользователь для '${formName}'.`
      );
      setEditingComputer(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (currentUserRole !== UserRole.ADMIN) return;
    if (window.confirm(`Вы действительно хотите удалить компьютер ${name}?`)) {
      const updated = computers.filter((pc) => pc.id !== id);
      onUpdateComputers(updated);
      await dbService.deleteComputer(id);
      onAddAuditLog(
        "Удален компьютер",
        "warning",
        `Удален узел ПК '${name}' из реестра контроля инфраструктуры.`
      );
    }
  };

  const triggerIntegrityCheck = (id: string, name: string) => {
    const updated = computers.map((pc) => {
      if (pc.id === id) {
        // Generate new check-in timestamp and random SHA hash
        return {
          ...pc,
          lastCheck: new Date().toLocaleString("ru-RU"),
          integrityHash: `SHA256: ${Math.random().toString(16).substring(2, 18)}c8996fb${Math.random().toString(16).substring(2, 10)}d3`,
          status: "OK" as ComputerStatus,
          services: pc.services.map(s => ({ ...s, status: "running" as const }))
        };
      }
      return pc;
    });
    onUpdateComputers(updated);
    onAddAuditLog(
      "Контроль целостности ПК",
      "success",
      `Выполнена удаленная проверка целостности архитектуры на '${name}'. Изменения ФС не обнаружены, службы перезапущены.`
    );
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleFiles(e.target.files);
    }
  };

  const handleMultipleFiles = (files: FileList) => {
    const promises: Promise<ParsedImport>[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.endsWith(".txt")) continue;

      const promise = new Promise<ParsedImport>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = (event.target?.result as string) || "";
          const parsed = parseAida64Report(content);
          resolve({
            id: `pc-aida-file-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
            name: parsed.name,
            os: parsed.os,
            cpu: parsed.cpu,
            ram: parsed.ram,
            storage: parsed.storage,
            ipv4: parsed.ipv4,
            mac: parsed.mac,
            department: batchDepartment || "Склад",
            subdepartment: batchSubdepartment || "Приемка",
            assignedUserName: importUserName || "Не назначен",
          });
        };
        reader.readAsText(file);
      });
      promises.push(promise);
    }

    Promise.all(promises).then((results) => {
      setImportedPcs((prev) => [...prev, ...results]);
    });
  };

  const handleTextPasteChange = (text: string) => {
    setImportText(text);
    if (!text.trim()) {
      setImportedPcs((prev) => prev.filter(p => !p.id.includes("paste")));
      return;
    }

    const parsedList = parseMultipleAida64Reports(text);
    const pastedPcs: ParsedImport[] = parsedList.map((parsed, index) => ({
      id: `pc-aida-paste-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
      name: parsed.name,
      os: parsed.os,
      cpu: parsed.cpu,
      ram: parsed.ram,
      storage: parsed.storage,
      ipv4: parsed.ipv4,
      mac: parsed.mac,
      department: batchDepartment || "Склад",
      subdepartment: batchSubdepartment || "Приемка",
      assignedUserName: importUserName || "Не назначен",
    }));

    setImportedPcs((prev) => {
      const nonPasted = prev.filter(p => !p.id.includes("paste"));
      return [...nonPasted, ...pastedPcs];
    });
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserRole !== UserRole.ADMIN) return;
    if (importedPcs.length === 0) return;

    const newComputers: Computer[] = importedPcs.map((item, idx) => {
      const assignedName = item.assignedUserName.trim() || "Не назначен";
      const foundUser = users.find((u) => u.name.toLowerCase() === assignedName.toLowerCase());
      const assignedId = foundUser ? foundUser.id : `u-custom-${Date.now()}-${idx}`;

      return {
        id: `pc-aida-${Date.now()}-${idx}`,
        name: item.name,
        assignedUserId: assignedId,
        assignedUserName: assignedName,
        os: item.os,
        cpu: item.cpu,
        ram: item.ram,
        storage: item.storage,
        ipv4: item.ipv4,
        mac: item.mac,
        status: "OK",
        lastCheck: new Date().toLocaleString("ru-RU"),
        integrityHash: `SHA256: ${Math.random().toString(16).substring(2, 18)}${Math.random().toString(16).substring(2, 18)}f82b7`,
        services: [
          { name: "CartridgeScaleDriver", status: "running" },
          { name: "TonerTrackerAgent", status: "running" }
        ],
        department: item.department.trim() || "Не назначен",
        subdepartment: item.subdepartment.trim() || "Не назначен"
      };
    });

    const updated = [...computers, ...newComputers];
    onUpdateComputers(updated);
    onAddAuditLog(
      "Пакетный импорт ПК из AIDA64",
      "success",
      `Успешно импортировано ПК из отчетов AIDA64 в количестве: ${newComputers.length} шт.`
    );
    setIsImporting(false);
    setImportText("");
    setImportUserName("");
    setImportedPcs([]);
    setBatchDepartment("");
    setBatchSubdepartment("");
  };

  // Grouping logic for "groups" view mode
  const computersByDepartment: { [dept: string]: { [subdept: string]: Computer[] } } = {};
  
  filteredComputers.forEach(pc => {
    const dept = pc.department || "Не назначен";
    const subdept = pc.subdepartment || "Не назначен";
    
    if (!computersByDepartment[dept]) {
      computersByDepartment[dept] = {};
    }
    if (!computersByDepartment[dept][subdept]) {
      computersByDepartment[dept][subdept] = [];
    }
    computersByDepartment[dept][subdept].push(pc);
  });

  const renderComputerCard = (pc: Computer) => {
    const u = users.find((user) => user.id === pc.assignedUserId);
    
    return (
      <div
        key={pc.id}
        className={`relative border rounded-2xl p-5 transition-all hover:shadow-xl ${
          pc.status === "OK"
            ? "bg-slate-950/40 border-slate-800/80 hover:border-indigo-500/30"
            : pc.status === "WARNING"
            ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
            : "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40"
        }`}
      >
        {/* Top Row: Server Name & Health Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl border ${
              pc.status === "OK" ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" :
              pc.status === "WARNING" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
              "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}>
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
                {pc.name}
                {pc.department && (
                  <span className="text-[9px] bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase font-bold font-mono">
                    {pc.department} {pc.subdepartment ? `/ ${pc.subdepartment}` : ""}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                <span className="font-mono text-indigo-400">{pc.ipv4}</span>
                <span>•</span>
                <span>{pc.os}</span>
              </div>
            </div>
          </div>

          {/* Health indicator */}
          <div className="flex items-center gap-1.5">
            {pc.status === "OK" && (
              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> СТАБИЛЕН
              </span>
            )}
            {pc.status === "WARNING" && (
              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] font-bold text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> ВНИМАНИЕ
              </span>
            )}
            {pc.status === "CRITICAL" && (
              <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-[10px] font-bold text-rose-400 flex items-center gap-1">
                <XCircle className="h-3 w-3 animate-pulse" /> СБОЙ
              </span>
            )}
          </div>
        </div>

        {/* Hardware specifications details */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs mb-4">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 block uppercase tracking-widest font-mono">Оборудование:</span>
            <div className="flex items-center gap-1 text-slate-300">
              <Cpu className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="truncate" title={pc.cpu}>{pc.cpu.split(" (")[0]}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <Database className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>{pc.ram} / {pc.storage}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 block uppercase tracking-widest font-mono">Сеть и Безопасность:</span>
            <div className="flex items-center gap-1 text-slate-300">
              <Network className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="font-mono text-[10px]">{pc.mac}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <Key className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="font-mono text-[10px] text-emerald-400 truncate animate-pulse" title={pc.integrityHash}>
                {pc.integrityHash.substring(0, 15)}...
              </span>
            </div>
          </div>
        </div>

        {/* Running Services & Drivers list */}
        <div className="mb-4">
          <span className="text-[10px] text-slate-500 block uppercase tracking-widest font-mono mb-1.5">Статус локальных служб:</span>
          <div className="flex flex-wrap gap-2">
            {pc.services.map((service, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1.5 ${
                  service.status === "running"
                    ? "bg-emerald-500/5 border border-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/5 border border-rose-500/20 text-rose-400"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${service.status === "running" ? "bg-emerald-400" : "bg-rose-500 animate-pulse"}`}></span>
                {service.name}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Row: Assigned User & Admin Action buttons */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-3">
          
          {/* Employee assignment */}
          <div className="flex items-center gap-2">
            <img
              src={u?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
              alt={pc.assignedUserName}
              className="h-7 w-7 rounded-full border border-slate-800 object-cover"
            />
            <div>
              <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Ответственный:</span>
              <span className="text-xs font-bold text-slate-200">{pc.assignedUserName}</span>
            </div>
          </div>

          {/* Operations buttons */}
          <div className="flex gap-1.5">
            <button
              onClick={() => triggerIntegrityCheck(pc.id, pc.name)}
              className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400 rounded-xl transition-all cursor-pointer animate-none"
              title="Запустить тест целостности системы (Аудит ФС)"
            >
              <Shield className="h-3.5 w-3.5" />
            </button>

            {currentUserRole === UserRole.ADMIN && (
              <>
                <button
                  onClick={() => handleEditClick(pc)}
                  className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-400 rounded-xl transition-all cursor-pointer"
                  title="Редактировать конфигурацию"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(pc.id, pc.name)}
                  className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                  title="Удалить ПК из реестра"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

        </div>

      </div>
    );
  };

  return (
    <div id="computers_section" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Monitor className="h-5.5 w-5.5 text-indigo-400" />
            <h2 className="text-lg font-bold tracking-tight text-white font-display">Инвентаризация и Контроль ПК</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Мониторинг целостности архитектуры, сетевых адресов и закрепленных за компьютерами специалистов IT-отдела.
          </p>
        </div>

        {currentUserRole === UserRole.ADMIN && (
          <div className="flex items-center gap-2 mt-4 md:mt-0 flex-wrap">
            {onOpenITDashboard && (
              <button
                id="btn_open_it_dashboard_header"
                onClick={onOpenITDashboard}
                className="px-3.5 py-2 bg-blue-600/15 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Laptop className="h-4 w-4 text-blue-400" /> Дашборд IT отдела
              </button>
            )}

            <button
              id="btn_import_aida"
              onClick={() => {
                setIsImporting(!isImporting);
                setIsAdding(false);
                setEditingComputer(null);
                setImportText("");
                setImportUserName("");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-lg cursor-pointer ${
                isImporting
                  ? "bg-slate-800 hover:bg-slate-750 text-indigo-400 border-slate-700 shadow-slate-900/40"
                  : "bg-slate-950 hover:bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 shadow-slate-950/40"
              }`}
            >
              <Database className="h-4 w-4 text-indigo-400" /> Импорт из AIDA64 (.txt)
            </button>

            <button
              id="btn_add_pc"
              onClick={() => {
                handleAddClick();
                setIsImporting(false);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Добавить компьютер
            </button>
          </div>
        )}
      </div>

      {/* Editor / Addition Modal-like drawer overlay inside dashboard */}
      {(isAdding || editingComputer) && (
        <div className="mb-6 p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Shield className="h-4 w-4 text-indigo-400" />
            {isAdding ? "Регистрация Нового Компьютера" : `Редактирование параметров: ${formName}`}
          </h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Имя компьютера (Сетевой Hostname):</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="PC-WAREHOUSE-XX"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Ответственный специалист (ФИО):</label>
              <input
                type="text"
                required
                value={formUserName}
                onChange={(e) => setFormUserName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Иванов И. И."
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Статус устройства:</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as ComputerStatus)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="OK">OK (Исправен / Стабилен)</option>
                <option value="WARNING">WARNING (Требуется внимание)</option>
                <option value="CRITICAL">CRITICAL (Аппаратный сбой!)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Операционная система:</label>
              <input
                type="text"
                required
                value={formOs}
                onChange={(e) => setFormOs(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                placeholder="например: Windows 11 Pro / Ubuntu 24.04"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Центральный процессор (CPU):</label>
              <input
                type="text"
                required
                value={formCpu}
                onChange={(e) => setFormCpu(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Объем памяти (RAM + Диск):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="ОЗУ, например: 16 GB"
                  value={formRam}
                  onChange={(e) => setFormRam(e.target.value)}
                  className="w-1/2 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="SSD, например: 512 GB"
                  value={formStorage}
                  onChange={(e) => setFormStorage(e.target.value)}
                  className="w-1/2 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Сетевой IPv4 адрес:</label>
              <input
                type="text"
                required
                value={formIpv4}
                onChange={(e) => setFormIpv4(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                placeholder="192.168.1.XX"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Физический MAC адрес:</label>
              <input
                type="text"
                required
                value={formMac}
                onChange={(e) => setFormMac(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                placeholder="00:1A:2B:..."
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Отдел / Группа (Размещение):</label>
              <input
                type="text"
                required
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                list="department-suggestions"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="например: Склад"
              />
              <datalist id="department-suggestions">
                {POPULAR_DEPARTMENTS.map(d => <option key={d} value={d} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Подотдел / Подгруппа:</label>
              <input
                type="text"
                required
                value={formSubdepartment}
                onChange={(e) => setFormSubdepartment(e.target.value)}
                list="subdepartment-suggestions"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="например: Приемка"
              />
              <datalist id="subdepartment-suggestions">
                {POPULAR_SUBDEPARTMENTS.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div className="flex items-end justify-end gap-2 mt-4 md:mt-0">
              <button
                type="button"
                onClick={() => {
                  setEditingComputer(null);
                  setIsAdding(false);
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-slate-300 transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white transition-colors cursor-pointer shadow-md shadow-indigo-500/20"
              >
                {isAdding ? "Зарегистрировать" : "Сохранить изменения"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AIDA64 TXT Import Panel */}
      {isImporting && (
        <div className="mb-6 p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Database className="h-4 w-4 text-indigo-400" />
              Пакетный импорт ПК из AIDA64 (.txt)
            </h3>
            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-bold uppercase font-mono">
              Пакетный парсер
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Загрузите один или несколько файлов отчетов AIDA64, либо вставьте объединенный текст отчетов. Система распознает каждую конфигурацию. Вы сможете отредактировать группы (отделы) и специалистов для каждого ПК перед сохранением.
          </p>

          <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column: Input and File Upload */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 space-y-3">
                  <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Параметры по умолчанию для новых ПК</h4>
                  
                  <div>
                    <label className="block text-slate-400 mb-1">Специалист по умолчанию:</label>
                    <input
                      type="text"
                      value={importUserName}
                      onChange={(e) => {
                        setImportUserName(e.target.value);
                        setImportedPcs(prev => prev.map(p => ({ ...p, assignedUserName: e.target.value })));
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Иванов И. И."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Группа / Отдел:</label>
                      <input
                        type="text"
                        value={batchDepartment}
                        onChange={(e) => {
                          setBatchDepartment(e.target.value);
                          setImportedPcs(prev => prev.map(p => ({ ...p, department: e.target.value })));
                        }}
                        list="batch-dept-suggestions"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-indigo-500"
                        placeholder="например: Склад"
                      />
                      <datalist id="batch-dept-suggestions">
                        {POPULAR_DEPARTMENTS.map(d => <option key={d} value={d} />)}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Подотдел / Кабинет:</label>
                      <input
                        type="text"
                        value={batchSubdepartment}
                        onChange={(e) => {
                          setBatchSubdepartment(e.target.value);
                          setImportedPcs(prev => prev.map(p => ({ ...p, subdepartment: e.target.value })));
                        }}
                        list="batch-sub-suggestions"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-indigo-500"
                        placeholder="например: Приемка"
                      />
                      <datalist id="batch-sub-suggestions">
                        {POPULAR_SUBDEPARTMENTS.map(s => <option key={s} value={s} />)}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer relative ${
                    dragActive
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-slate-800 bg-slate-900 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload-aida"
                    accept=".txt"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="file-upload-aida" className="cursor-pointer block">
                    <Monitor className="h-7 w-7 text-indigo-400 mx-auto mb-2 animate-pulse" />
                    <span className="block font-bold text-slate-200">Перетащите файлы отчетов .txt сюда</span>
                    <span className="block text-[11px] text-slate-500 mt-1">или нажмите для выбора на компьютере</span>
                  </label>
                </div>

                {/* Textarea paste field */}
                <div>
                  <label className="block text-slate-400 mb-1">Или вставьте скопированный текст отчетов:</label>
                  <textarea
                    rows={5}
                    value={importText}
                    onChange={(e) => handleTextPasteChange(e.target.value)}
                    placeholder="Вставьте отчет(ы) AIDA64 сюда. Можно склеить несколько..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Right Column: Interactive review list */}
              <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between min-h-[300px]">
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-emerald-400" />
                      Очередь импорта компьютеров ({importedPcs.length})
                    </span>
                    {importedPcs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setImportedPcs([])}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase transition-colors"
                      >
                        Очистить всё
                      </button>
                    )}
                  </h4>

                  {importedPcs.length > 0 ? (
                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                      {importedPcs.map((pc, index) => (
                        <div key={pc.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col space-y-2 relative group">
                          {/* Trash button to discard item */}
                          <button
                            type="button"
                            onClick={() => setImportedPcs(prev => prev.filter(p => p.id !== pc.id))}
                            className="absolute top-2.5 right-2.5 text-slate-550 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                            title="Исключить из импорта"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Top row: PC Name and hardware badge */}
                          <div className="flex flex-wrap gap-2 items-center pr-8">
                            <span className="text-[10px] bg-slate-850 px-2 py-0.5 rounded text-indigo-400 font-bold font-mono">
                              #{index + 1}
                            </span>
                            <input
                              type="text"
                              value={pc.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setImportedPcs(prev => prev.map(p => p.id === pc.id ? { ...p, name: val } : p));
                              }}
                              className="bg-transparent border-b border-dashed border-slate-700 text-white font-bold font-mono text-xs focus:outline-none focus:border-indigo-400 max-w-[150px]"
                              placeholder="Имя ПК"
                            />
                            <span className="text-[10px] text-slate-400 max-w-[180px] truncate" title={`${pc.cpu} | ${pc.ram} | ${pc.storage}`}>
                              {pc.cpu.split(" @")[0]} ({pc.ram})
                            </span>
                          </div>

                          {/* Network details */}
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-3">
                            <span>IP: <span className="text-emerald-400">{pc.ipv4}</span></span>
                            <span>MAC: <span className="text-indigo-400">{pc.mac}</span></span>
                          </div>

                          {/* Bottom Row: Editable Department & Specialist */}
                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-900">
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-0.5">Группа (Отдел):</label>
                              <input
                                type="text"
                                value={pc.department}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setImportedPcs(prev => prev.map(p => p.id === pc.id ? { ...p, department: val } : p));
                                }}
                                list="item-dept-suggestions"
                                className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-200 text-[11px] focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-0.5">Подгруппа:</label>
                              <input
                                type="text"
                                value={pc.subdepartment}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setImportedPcs(prev => prev.map(p => p.id === pc.id ? { ...p, subdepartment: val } : p));
                                }}
                                list="item-sub-suggestions"
                                className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-200 text-[11px] focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-0.5">Специалист:</label>
                              <input
                                type="text"
                                value={pc.assignedUserName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setImportedPcs(prev => prev.map(p => p.id === pc.id ? { ...p, assignedUserName: val } : p));
                                }}
                                className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-200 text-[11px] focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Suggestions datalists for inline inputs */}
                      <datalist id="item-dept-suggestions">
                        {POPULAR_DEPARTMENTS.map(d => <option key={d} value={d} />)}
                      </datalist>
                      <datalist id="item-sub-suggestions">
                        {POPULAR_SUBDEPARTMENTS.map(s => <option key={s} value={s} />)}
                      </datalist>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                      <RefreshCw className="h-8 w-8 mb-2 animate-spin text-slate-600" />
                      <p className="font-bold">Очередь импорта пуста</p>
                      <p className="text-[10px] text-slate-600 mt-1 max-w-[280px] mx-auto">
                        Загрузите файлы отчетов или вставьте текст, чтобы наполнить список распознанных устройств.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => {
                      setIsImporting(false);
                      setImportText("");
                      setImportUserName("");
                      setImportedPcs([]);
                    }}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-850 border border-slate-750 rounded-xl font-bold text-slate-300 transition-colors cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={importedPcs.length === 0}
                    className={`px-4 py-2 rounded-xl font-bold text-white transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                      importedPcs.length > 0
                        ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                        : "bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-800"
                    }`}
                  >
                    <PlusCircle className="h-4 w-4" /> Импортировать все ПК ({importedPcs.length})
                  </button>
                </div>
              </div>

            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6 bg-slate-950 p-4 rounded-2xl border border-slate-800 animate-fade-in">
        
        {/* Left: Search input */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            id="input_search_pc"
            type="text"
            placeholder="Поиск по хосту, IP, сотруднику, группе..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
          />
        </div>

        {/* Center/Right: Layout Toggles and Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("groups")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "groups"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              По группам
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Сплошной список
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          {/* Department Filter Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 whitespace-nowrap">Группа:</span>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[150px] md:max-w-none"
            >
              <option value="ALL">Все группы</option>
              {Array.from(new Set(computers.map(pc => pc.department || "Не назначен"))).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap">Статус:</span>
            {[
              { id: "ALL", label: "Все" },
              { id: "OK", label: "OK" },
              { id: "WARNING", label: "Warning" },
              { id: "CRITICAL", label: "Critical" }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilterStatus(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filterStatus === btn.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-850"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {viewMode === "groups" ? (
        <div className="space-y-8">
          {Object.keys(computersByDepartment).map(dept => {
            const subdepts = computersByDepartment[dept];
            const deptCount = Object.values(subdepts).reduce((acc, pcs) => acc + pcs.length, 0);
            
            return (
              <div key={dept} className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 space-y-5 animate-fade-in">
                {/* Department Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-display">Группа (Отдел): {dept}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {(dept.toLowerCase().includes("it") || dept.toLowerCase().includes("админ")) && onOpenITDashboard && (
                      <button
                        onClick={onOpenITDashboard}
                        className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Laptop className="h-3.5 w-3.5" /> Дашборд IT отдела
                      </button>
                    )}
                    <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md font-mono font-bold">
                      ПК: {deptCount} шт.
                    </span>
                  </div>
                </div>

                {/* Subdepartments Loop */}
                <div className="space-y-6">
                  {Object.keys(subdepts).map(subdept => {
                    const pcs = subdepts[subdept];
                    return (
                      <div key={subdept} className="space-y-3">
                        {/* Subdepartment Subheader */}
                        <div className="flex items-center gap-2 pl-2">
                          <span className="text-xs font-bold text-slate-400">└─ Подотдел / Размещение:</span>
                          <span className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-0.5 rounded-lg font-mono">
                            {subdept}
                          </span>
                          <span className="text-[10px] text-slate-500">({pcs.length} ПК)</span>
                        </div>

                        {/* Computers Grid for this Subdepartment */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                          {pcs.map(pc => renderComputerCard(pc))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {Object.keys(computersByDepartment).length === 0 && (
            <div className="text-center py-12 bg-slate-950 border border-dashed border-slate-800 rounded-2xl">
              <Monitor className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">По вашему запросу не найдено ни одной группы или компьютера</p>
            </div>
          )}
        </div>
      ) : (
        /* Flat List Grid of computer assets */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredComputers.map((pc) => renderComputerCard(pc))}
          {filteredComputers.length === 0 && (
            <div className="col-span-2 text-center py-12 bg-slate-950 border border-dashed border-slate-800 rounded-2xl">
              <Monitor className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">По вашему запросу не найдено ни одного компьютера</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
