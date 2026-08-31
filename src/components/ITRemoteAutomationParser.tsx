import React, { useState, useEffect, useMemo } from "react";
import { 
  Computer, 
  ParsedRemoteNode, 
  AdminAccountType 
} from "../types";
import { 
  Terminal as TerminalIcon, 
  RefreshCw, 
  Lock, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Monitor, 
  ShieldCheck, 
  Play, 
  Copy, 
  Download, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Cpu, 
  Server, 
  Settings2, 
  Zap, 
  Check, 
  Filter, 
  Search, 
  SlidersHorizontal, 
  Power, 
  Maximize2, 
  CornerDownRight, 
  FolderSync,
  HelpCircle,
  FileCode,
  Shield,
  Layers
} from "lucide-react";

interface ITRemoteAutomationParserProps {
  computers: Computer[];
  onAddAuditLog: (action: string, type: "info" | "success" | "warning" | "error", details: string) => void;
}

export default function ITRemoteAutomationParser({
  computers,
  onAddAuditLog
}: ITRemoteAutomationParserProps) {
  // Parsing and Remote nodes state
  const [nodes, setNodes] = useState<ParsedRemoteNode[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAccount, setFilterAccount] = useState<string>("ALL");
  const [filterDepartment, setFilterDepartment] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Password Automation Settings
  const [passwordMode, setPasswordMode] = useState<"SINGLE" | "UNIQUE">("SINGLE");
  const [globalPassword, setGlobalPassword] = useState("Corp#EsetAdmin2026!");
  const [targetAccountOverride, setTargetAccountOverride] = useState<"DETECTED" | "eset" | "root" | "admin">("DETECTED");
  const [executionProtocol, setExecutionProtocol] = useState<"HYBRID" | "TIGER_VNC" | "WINRM" | "SSH">("HYBRID");
  const [showPasswords, setShowPasswords] = useState(false);

  // Batch Execution Simulation Modal & Console
  const [isExecutingBatch, setIsExecutingBatch] = useState(false);
  const [executingIndex, setExecutingIndex] = useState(0);
  const [executionLogs, setExecutionLogs] = useState<{ time: string; text: string; type: "info" | "success" | "warning" | "error" }[]>([]);
  const [showExecutionModal, setShowExecutionModal] = useState(false);

  // TigerVNC Interactive Session Modal
  const [activeVncNode, setActiveVncNode] = useState<ParsedRemoteNode | null>(null);
  const [vncTerminalInput, setVncTerminalInput] = useState("");
  const [vncConsoleLogs, setVncConsoleLogs] = useState<string[]>([]);
  const [vncCommandRunning, setVncCommandRunning] = useState(false);

  // Script Generator Modal
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptType, setScriptType] = useState<"POWERSHELL" | "BASH" | "VNC_BAT" | "CSV_VAULT">("POWERSHELL");

  // Toast notification
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "info" | "warning" } | null>(null);

  const showToast = (text: string, type: "success" | "info" | "warning" = "info") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Helper: Determine default detected admin account based on OS, services and name
  const detectAdminAccount = (comp: Computer): AdminAccountType => {
    const osLower = (comp.os || "").toLowerCase();
    const nameLower = (comp.name || "").toLowerCase();
    const hasEset = comp.services?.some(s => s.name.toLowerCase().includes("eset") || s.name.toLowerCase().includes("antivirus")) || nameLower.includes("eset");

    if (hasEset || nameLower.includes("sec") || nameLower.includes("srv")) {
      return "eset";
    }
    if (osLower.includes("linux") || osLower.includes("ubuntu") || osLower.includes("astra") || osLower.includes("alt") || osLower.includes("debian")) {
      return "root";
    }
    return "admin";
  };

  // Initialize or synchronize nodes from computers prop
  useEffect(() => {
    const savedNodes = localStorage.getItem("it_remote_parsed_nodes");
    if (savedNodes) {
      try {
        const parsed: ParsedRemoteNode[] = JSON.parse(savedNodes);
        // Ensure all current computers exist
        const updated = computers.map((c, idx) => {
          const existing = parsed.find(p => p.computerId === c.id);
          if (existing) {
            return { ...existing, assignedUser: c.assignedUserName, department: c.department || "Офис", ipv4: c.ipv4 };
          }
          const detected = detectAdminAccount(c);
          return {
            computerId: c.id,
            computerName: c.name,
            assignedUser: c.assignedUserName,
            department: c.department || "Офис",
            ipv4: c.ipv4 || `192.168.1.${100 + idx}`,
            mac: c.mac || "00:1A:2B:3C:4D:5E",
            os: c.os,
            detectedAdminAccount: detected,
            vncPort: 5900,
            vncStatus: "AVAILABLE" as const,
            sshWinrmStatus: "ONLINE" as const,
            passwordStatus: "PENDING_UPDATE" as const,
            selected: true,
            pingMs: Math.floor(Math.random() * 8) + 1
          };
        });
        setNodes(updated);
        return;
      } catch (e) {
        console.error("Failed to parse saved nodes", e);
      }
    }

    // Default generation
    const initialNodes: ParsedRemoteNode[] = computers.map((c, idx) => {
      const detected = detectAdminAccount(c);
      return {
        computerId: c.id,
        computerName: c.name,
        assignedUser: c.assignedUserName,
        department: c.department || "Офис",
        ipv4: c.ipv4 || `192.168.1.${100 + idx}`,
        mac: c.mac || "00:1A:2B:3C:4D:5E",
        os: c.os,
        detectedAdminAccount: detected,
        vncPort: 5900,
        vncStatus: "AVAILABLE",
        sshWinrmStatus: "ONLINE",
        passwordStatus: "PENDING_UPDATE",
        selected: true,
        pingMs: Math.floor(Math.random() * 8) + 1
      };
    });
    setNodes(initialNodes);
  }, [computers]);

  // Save to localStorage when nodes change
  const saveNodesToStorage = (updatedNodes: ParsedRemoteNode[]) => {
    setNodes(updatedNodes);
    localStorage.setItem("it_remote_parsed_nodes", JSON.stringify(updatedNodes));
  };

  // Generate strong random password
  const generateStrongPassword = () => {
    const charsUpper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const charsLower = "abcdefghijkmnopqrstuvwxyz";
    const charsNum = "23456789";
    const charsSpec = "!@#$%^&*";
    
    let pass = "";
    pass += charsUpper[Math.floor(Math.random() * charsUpper.length)];
    pass += charsUpper[Math.floor(Math.random() * charsUpper.length)];
    pass += charsLower[Math.floor(Math.random() * charsLower.length)];
    pass += charsLower[Math.floor(Math.random() * charsLower.length)];
    pass += charsNum[Math.floor(Math.random() * charsNum.length)];
    pass += charsNum[Math.floor(Math.random() * charsNum.length)];
    pass += charsSpec[Math.floor(Math.random() * charsSpec.length)];
    pass += charsSpec[Math.floor(Math.random() * charsSpec.length)];

    // Suffix
    const prefixOptions = ["Eset#", "Admin$", "Corp!", "Tiger&", "Sec#"];
    const prefix = prefixOptions[Math.floor(Math.random() * prefixOptions.length)];
    return `${prefix}${pass}2026`;
  };

  // Run deep network parsing / discovery
  const handleRunNetworkParsing = () => {
    setIsScanning(true);
    setScanProgress(0);
    showToast("Запущен глубокий парсинг сети (TigerVNC 5900, WinRM, SSH)...", "info");

    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setScanProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        setIsScanning(false);

        // Update nodes with parsed results
        const updated = nodes.map(n => {
          const comp = computers.find(c => c.id === n.computerId);
          const detected = comp ? detectAdminAccount(comp) : n.detectedAdminAccount;
          const ping = Math.floor(Math.random() * 6) + 1;
          return {
            ...n,
            detectedAdminAccount: detected,
            vncPort: 5900,
            vncStatus: "AVAILABLE" as const,
            sshWinrmStatus: "ONLINE" as const,
            pingMs: ping
          };
        });
        saveNodesToStorage(updated);
        showToast("Сетевой парсинг завершен! Обнаружены все TigerVNC порты и учетные записи [eset, root, admin].", "success");
        onAddAuditLog("Парсинг сети", "success", `Завершен парсинг ${nodes.length} офисных ПК. Обнаружены TigerVNC и учетки eset/root/admin.`);
      }
    }, 300);
  };

  // Toggle selection for all
  const handleToggleSelectAll = (select: boolean) => {
    const updated = nodes.map(n => ({ ...n, selected: select }));
    saveNodesToStorage(updated);
  };

  // Toggle selection for individual
  const handleToggleSelect = (id: string) => {
    const updated = nodes.map(n => n.computerId === id ? { ...n, selected: !n.selected } : n);
    saveNodesToStorage(updated);
  };

  // Change individual detected account
  const handleChangeAccount = (id: string, account: AdminAccountType) => {
    const updated = nodes.map(n => n.computerId === id ? { ...n, detectedAdminAccount: account } : n);
    saveNodesToStorage(updated);
    showToast(`Учетная запись для ПК изменена на '${account}'`, "info");
  };

  // Execute Batch Password Rotation
  const handleStartBatchRotation = async () => {
    const targetNodes = nodes.filter(n => n.selected);
    if (targetNodes.length === 0) {
      showToast("Выберите хотя бы один компьютер для ротации паролей!", "warning");
      return;
    }

    setShowExecutionModal(true);
    setIsExecutingBatch(true);
    setExecutingIndex(0);
    setExecutionLogs([
      { time: new Date().toLocaleTimeString(), text: `[INIT] Инициализация пакетной смены паролей на ${targetNodes.length} ПК...`, type: "info" },
      { time: new Date().toLocaleTimeString(), text: `[PROTOCOL] Выбранный протокол: ${executionProtocol}. Проверка TigerVNC RFB 3.8 и WinRM...`, type: "info" }
    ]);

    let workingNodes = [...nodes];

    for (let i = 0; i < targetNodes.length; i++) {
      const node = targetNodes[i];
      setExecutingIndex(i + 1);

      const targetAcc = targetAccountOverride === "DETECTED" ? node.detectedAdminAccount : targetAccountOverride;
      const passToSet = passwordMode === "SINGLE" ? globalPassword : generateStrongPassword();

      // Log step 1: Connection
      await new Promise(r => setTimeout(r, 250));
      setExecutionLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `[${i + 1}/${targetNodes.length}] Подключение к ${node.computerName} (${node.ipv4}:${node.vncPort})...`, type: "info" }
      ]);

      // Log step 2: Account match & command
      await new Promise(r => setTimeout(r, 250));
      const cmd = node.os.toLowerCase().includes("linux") || node.detectedAdminAccount === "root"
        ? `echo "${targetAcc}:${passToSet}" | chpasswd && vncpasswd -f <<< "${passToSet}"`
        : `net user ${targetAcc} "${passToSet}" /domain:no && Set-VncPassword -Password "${passToSet}"`;

      setExecutionLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `[EXEC] Выполнение ротации для учетной записи '${targetAcc}': ${cmd.substring(0, 45)}...`, type: "info" }
      ]);

      // Log step 3: Success
      await new Promise(r => setTimeout(r, 200));
      setExecutionLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `[SUCCESS] ${node.computerName} (${node.ipv4}) -> Пароль для '${targetAcc}' успешно изменен и проверен!`, type: "success" }
      ]);

      // Update node state
      workingNodes = workingNodes.map(n => {
        if (n.computerId === node.computerId) {
          return {
            ...n,
            passwordStatus: "ROTATED" as const,
            currentPassword: passToSet,
            generatedPassword: passToSet,
            lastRotatedAt: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
          };
        }
        return n;
      });
      setNodes([...workingNodes]);
    }

    saveNodesToStorage(workingNodes);
    setIsExecutingBatch(false);
    setExecutionLogs(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), text: `[FINISH] Все ${targetNodes.length} компьютеров успешно обновлены без физического присутствия!`, type: "success" }
    ]);
    
    showToast(`Пароли успешно сменены на ${targetNodes.length} компьютерах!`, "success");
    onAddAuditLog("Автоматизация IT", "warning", `Пакетно изменены пароли на ${targetNodes.length} ПК (TigerVNC/WinRM/SSH) под учетками eset/root/admin.`);
  };

  // Launch TigerVNC Session Emulator
  const handleOpenVncSession = (node: ParsedRemoteNode) => {
    setActiveVncNode(node);
    const targetAcc = targetAccountOverride === "DETECTED" ? node.detectedAdminAccount : targetAccountOverride;
    setVncConsoleLogs([
      `[TigerVNC Viewer v1.14.0] Подключение к хосту ${node.ipv4}:${node.vncPort}...`,
      `[RFB Protocol 003.008] Согласование протокола шифрования VeNCrypt...`,
      `[Authentication] Успешная авторизация под учетной записью '${targetAcc}'`,
      `[Desktop Ready] Сессия активна. Разрешение: 1920x1080x32bpp (TrueColor)`,
      `[INFO] Готово к удаленному управлению рабочим столом без необходимости идти в кабинет.`
    ]);
  };

  // Send Command inside TigerVNC modal
  const handleSendVncCommand = (customCmd?: string) => {
    const cmd = customCmd || vncTerminalInput.trim();
    if (!cmd || !activeVncNode) return;

    setVncCommandRunning(true);
    setVncConsoleLogs(prev => [...prev, `$ ${cmd}`]);
    setVncTerminalInput("");

    setTimeout(() => {
      if (cmd.includes("net user") || cmd.includes("chpasswd") || cmd.includes("passwd")) {
        setVncConsoleLogs(prev => [
          ...prev,
          `[OK] Команда смены пароля успешно выполнена в сеансе TigerVNC.`,
          `[Security Log] Пароль локального администратора обновлен.`
        ]);
        // Update this node
        const updated = nodes.map(n => n.computerId === activeVncNode.computerId ? {
          ...n,
          passwordStatus: "ROTATED" as const,
          lastRotatedAt: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
        } : n);
        saveNodesToStorage(updated);
      } else if (cmd.includes("reboot") || cmd.includes("shutdown")) {
        setVncConsoleLogs(prev => [
          ...prev,
          `[SYSTEM] Станция отправлена на перезагрузку. VNC сессия завершается.`
        ]);
      } else if (cmd.includes("Ctrl+Alt+Del")) {
        setVncConsoleLogs(prev => [
          ...prev,
          `[VNC Action] Сигнал SAS (Ctrl+Alt+Del) отправлен на удаленный рабочий стол.`
        ]);
      } else {
        setVncConsoleLogs(prev => [
          ...prev,
          `[OUTPUT] Команда '${cmd}' успешно доставлена через удаленный агент TigerVNC.`
        ]);
      }
      setVncCommandRunning(false);
    }, 400);
  };

  // Copy text to clipboard
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} скопировано в буфер обмена!`, "success");
  };

  // Generate Script Content
  const scriptContent = useMemo(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    const pass = globalPassword;

    if (scriptType === "POWERSHELL") {
      return `# ====================================================================
# PowerShell Скрипт массовой ротации паролей через WinRM / Active Directory
# Автоматически сгенерирован IT-Отделом (TigerVNC & Remoting Suite)
# ====================================================================

$TargetPassword = "${pass}"
$TargetComputers = @(
${selectedNodes.map(n => `    @{ ComputerName = "${n.computerName}"; IP = "${n.ipv4}"; TargetUser = "${n.detectedAdminAccount}" }`).join(",\n")}
)

Write-Host "[*] Начинаем пакетную смену паролей на $($TargetComputers.Count) компьютерах..." -ForegroundColor Cyan

foreach ($comp in $TargetComputers) {
    Write-Host "[>] Подключение к $($comp.ComputerName) ($($comp.IP))..." -ForegroundColor Yellow
    try {
        # Смена пароля через локальный WMI / WinRM
        Invoke-Command -ComputerName $comp.IP -ScriptBlock {
            param($User, $Password)
            net user $User $Password
            Write-Host "    [+] Пароль для пользователя $User успешно изменен!" -ForegroundColor Green
        } -ArgumentList $comp.TargetUser, $TargetPassword -ErrorAction Stop
    }
    catch {
        Write-Host "    [-] Ошибка подключения к $($comp.ComputerName): $_" -ForegroundColor Red
    }
}

Write-Host "[✓] Пакетная операция завершена!" -ForegroundColor Green
`;
    }

    if (scriptType === "BASH") {
      return `#!/usr/bin/env bash
# ====================================================================
# Bash Скрипт массовой смены паролей на Linux / Astra Linux станциях
# Автоматическая ротация учетных записей [eset, root, admin] через SSH / TigerVNC
# ====================================================================

NEW_PASSWORD="${pass}"

declare -A HOSTS=(
${selectedNodes.map(n => `    ["${n.ipv4}"]="${n.detectedAdminAccount}"`).join("\n")}
)

echo "[*] Старт пакетной ротации паролей для $(echo \${!HOSTS[@]} | wc -w) хостов..."

for IP in "\${!HOSTS[@]}"; do
    USER="\${HOSTS[$IP]}"
    echo "[>] Обработка $IP (Учетная запись: $USER)..."
    
    # Смена системного пароля + TigerVNC пароля
    ssh -o ConnectTimeout=3 -o StrictHostKeyChecking=no "root@$IP" "
        echo '$USER:$NEW_PASSWORD' | chpasswd &&
        mkdir -p /home/$USER/.vnc &&
        echo '$NEW_PASSWORD' | vncpasswd -f > /home/$USER/.vnc/passwd &&
        chmod 600 /home/$USER/.vnc/passwd &&
        chown -R $USER:$USER /home/$USER/.vnc
    "
    
    if [ $? -eq 0 ]; then
        echo "    [✓] $IP: Пароль для $USER успешно обновлен!"
    else
        echo "    [✗] $IP: Ошибка подключения по SSH/VNC."
    fi
done

echo "[✓] Все хосты обработаны."
`;
    }

    if (scriptType === "VNC_BAT") {
      return `@echo off
:: ====================================================================
:: Batch скрипт быстрого запуска TigerVNC Viewer ко всем машинам
:: ====================================================================
title TigerVNC Batch Remote Management

echo Выберите станцию для мгновенного подключения через TigerVNC:
${selectedNodes.map((n, i) => `echo [${i + 1}] ${n.computerName} - ${n.ipv4}:5900 (${n.detectedAdminAccount})`).join("\n")}
echo [0] Выход

set /p choice="Введите номер станции: "
${selectedNodes.map((n, i) => `if "%choice%"=="${i + 1}" start "" "vncviewer.exe" ${n.ipv4}::5900`).join("\n")}
if "%choice%"=="0" exit
`;
    }

    if (scriptType === "CSV_VAULT") {
      return `Компьютер,IP Адрес,Отдел,Пользователь,Админ-Учетка,TigerVNC Порт,Новый Пароль,Статус,Дата Ротации\n` +
        selectedNodes.map(n => 
          `"${n.computerName}","${n.ipv4}","${n.department}","${n.assignedUser}","${n.detectedAdminAccount}","${n.vncPort}","${n.currentPassword || pass}","${n.passwordStatus}","${n.lastRotatedAt || 'Ожидает'}"`
        ).join("\n");
    }

    return "";
  }, [nodes, scriptType, globalPassword]);

  // Download script file
  const handleDownloadScript = () => {
    let filename = "remote_automation.ps1";
    let mime = "text/plain";

    if (scriptType === "POWERSHELL") filename = "batch_rotate_passwords.ps1";
    if (scriptType === "BASH") filename = "batch_rotate_passwords.sh";
    if (scriptType === "VNC_BAT") filename = "tigervnc_quick_connect.bat";
    if (scriptType === "CSV_VAULT") {
      filename = `it_passwords_vault_${new Date().toISOString().slice(0, 10)}.csv`;
      mime = "text/csv";
    }

    const blob = new Blob([scriptContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Файл '${filename}' успешно скачан!`, "success");
  };

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      const matchesSearch = 
        node.computerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.ipv4.includes(searchQuery) ||
        node.assignedUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAccount = filterAccount === "ALL" || node.detectedAdminAccount === filterAccount;
      const matchesDept = filterDepartment === "ALL" || node.department === filterDepartment;
      const matchesStatus = filterStatus === "ALL" || node.passwordStatus === filterStatus;

      return matchesSearch && matchesAccount && matchesDept && matchesStatus;
    });
  }, [nodes, searchQuery, filterAccount, filterDepartment, filterStatus]);

  // Statistics
  const totalCount = nodes.length;
  const selectedCount = nodes.filter(n => n.selected).length;
  const esetCount = nodes.filter(n => n.detectedAdminAccount === "eset").length;
  const rootCount = nodes.filter(n => n.detectedAdminAccount === "root").length;
  const adminCount = nodes.filter(n => n.detectedAdminAccount === "admin" || n.detectedAdminAccount === "Administrator").length;
  const rotatedCount = nodes.filter(n => n.passwordStatus === "ROTATED").length;
  const pendingCount = nodes.filter(n => n.passwordStatus === "PENDING_UPDATE").length;

  const departments = useMemo(() => {
    const depts = new Set<string>();
    nodes.forEach(n => { if (n.department) depts.add(n.department); });
    return Array.from(depts);
  }, [nodes]);

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2 animate-slide-up ${
          toastMsg.type === "success" ? "bg-emerald-950/95 text-emerald-200 border-emerald-500/40" :
          toastMsg.type === "warning" ? "bg-amber-950/95 text-amber-200 border-amber-500/40" :
          "bg-blue-950/95 text-blue-200 border-blue-500/40"
        }`}>
          {toastMsg.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          {toastMsg.type === "warning" && <AlertTriangle className="h-4 w-4 text-amber-400" />}
          {toastMsg.type === "info" && <Shield className="h-4 w-4 text-blue-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 p-5 rounded-2xl border border-blue-500/30 relative overflow-hidden shadow-xl shadow-blue-950/20">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Monitor className="h-64 w-64 text-blue-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-400">
                <TerminalIcon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-white tracking-wide">
                Парсинг & Удаленная Автоматизация IT (TigerVNC Suite)
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Автоматическое сканирование офисных ПК по локальной сети, распознавание административных учетных записей 
              <span className="text-amber-300 font-mono font-bold mx-1">[eset, root, admin]</span>
              и массовая смена паролей через TigerVNC / WinRM / SSH без необходимости физически ходить по кабинетам.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRunNetworkParsing}
              disabled={isScanning}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isScanning ? "animate-spin" : ""}`} />
              <span>{isScanning ? `Парсинг сети (${scanProgress}%)...` : "⚡ Запустить глубокий парсинг"}</span>
            </button>

            <button
              onClick={() => setShowScriptModal(true)}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileCode className="h-4 w-4 text-indigo-400" />
              <span>Скрипты (.ps1 / .sh)</span>
            </button>
          </div>
        </div>

        {/* Scan progress bar */}
        {isScanning && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                Опрос портов TigerVNC (5900), SSH (22) и WinRM (5985)...
              </span>
              <span className="text-blue-400 font-bold">{scanProgress}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="font-mono uppercase font-bold">Офисных ПК</span>
            <Monitor className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-xl font-black text-white font-mono">{totalCount}</span>
            <span className="text-[10px] text-slate-500 font-mono">хостов</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-1">Все в сети (LAN)</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="font-mono uppercase font-bold">Учетка eset</span>
            <Shield className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-xl font-black text-amber-400 font-mono">{esetCount}</span>
            <span className="text-[10px] text-slate-500 font-mono">ПК</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">Служебный доступ</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="font-mono uppercase font-bold">Учетка root</span>
            <TerminalIcon className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-xl font-black text-emerald-400 font-mono">{rootCount}</span>
            <span className="text-[10px] text-slate-500 font-mono">ПК</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">Linux / Astra</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="font-mono uppercase font-bold">Учетка admin</span>
            <Key className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-xl font-black text-cyan-400 font-mono">{adminCount}</span>
            <span className="text-[10px] text-slate-500 font-mono">ПК</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">Windows Workstation</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="font-mono uppercase font-bold">TigerVNC :5900</span>
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-xl font-black text-indigo-400 font-mono">{totalCount}</span>
            <span className="text-[10px] text-slate-500 font-mono">портов</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-1">RFB 3.8 активен</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="font-mono uppercase font-bold">Ротация паролей</span>
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-xl font-black text-emerald-400 font-mono">{rotatedCount}</span>
            <span className="text-[10px] text-slate-500 font-mono">/ {totalCount}</span>
          </div>
          <span className={`text-[10px] font-mono mt-1 ${pendingCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            {pendingCount > 0 ? `${pendingCount} требуют смены` : "Все обновлены"}
          </span>
        </div>
      </div>

      {/* Main Password Automation Console Card */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Мастер пакетной смены паролей администратора
              </h3>
              <p className="text-[11px] text-slate-400">
                Задайте новый надежный пароль и примените его ко всем отмеченным компьютерам через TigerVNC и WinRM/SSH
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              Отмечено: <strong className="text-blue-400 font-bold">{selectedCount}</strong> из {totalCount} ПК
            </span>
          </div>
        </div>

        {/* Automation Parameters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Column 1: Password Input & Generator */}
          <div className="lg:col-span-5 bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-400" /> Новый пароль администратора:
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer transition-colors"
                  title={showPasswords ? "Скрыть" : "Показать"}
                >
                  {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newPass = generateStrongPassword();
                    setGlobalPassword(newPass);
                    showToast("Сгенерирован новый надежный пароль!", "info");
                  }}
                  className="px-2 py-0.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="h-2.5 w-2.5" /> Генератор
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={globalPassword}
                onChange={e => setGlobalPassword(e.target.value)}
                placeholder="Введите или сгенерируйте пароль..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono tracking-wider focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopy(globalPassword, "Пароль")}
                className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                title="Скопировать пароль"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-[10px] text-emerald-400 font-mono">
                ✓ Высокая сложность: 16+ симв., спецсимволы, заглавные
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="passmode"
                    checked={passwordMode === "SINGLE"}
                    onChange={() => setPasswordMode("SINGLE")}
                    className="text-blue-600 focus:ring-0"
                  />
                  <span className="text-[10px]">Единый</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="passmode"
                    checked={passwordMode === "UNIQUE"}
                    onChange={() => setPasswordMode("UNIQUE")}
                    className="text-blue-600 focus:ring-0"
                  />
                  <span className="text-[10px]">Уникальный для каждого ПК</span>
                </label>
              </div>
            </div>
          </div>

          {/* Column 2: Target Account Scope */}
          <div className="lg:col-span-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-slate-300 block">
              Целевая учетная запись для ротации:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTargetAccountOverride("DETECTED")}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  targetAccountOverride === "DETECTED"
                    ? "bg-blue-600/20 border-blue-500 text-white font-bold"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="block text-[11px] text-blue-400">Авто-парсинг</span>
                <span className="text-[10px] text-slate-400">[eset / root / admin]</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetAccountOverride("eset")}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  targetAccountOverride === "eset"
                    ? "bg-amber-600/20 border-amber-500 text-white font-bold"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="block text-[11px] text-amber-400">Только 'eset'</span>
                <span className="text-[10px] text-slate-400">Антивирус / Сервис</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetAccountOverride("root")}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  targetAccountOverride === "root"
                    ? "bg-emerald-600/20 border-emerald-500 text-white font-bold"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="block text-[11px] text-emerald-400">Только 'root'</span>
                <span className="text-[10px] text-slate-400">Linux / Astra</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetAccountOverride("admin")}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  targetAccountOverride === "admin"
                    ? "bg-cyan-600/20 border-cyan-500 text-white font-bold"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="block text-[11px] text-cyan-400">Только 'admin'</span>
                <span className="text-[10px] text-slate-400">Windows Local Admin</span>
              </button>
            </div>
          </div>

          {/* Column 3: Execute Action CTA */}
          <div className="lg:col-span-3 bg-gradient-to-b from-blue-950/40 to-slate-900 p-4 rounded-xl border border-blue-500/20 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-white block">Пакетный запуск:</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Применение без физического присутствия через TigerVNC и системные сокеты.
              </p>
            </div>

            <button
              onClick={handleStartBatchRotation}
              disabled={selectedCount === 0 || isExecutingBatch}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
            >
              <Zap className="h-4 w-4 fill-current" />
              <span>⚡ Сменить пароли ({selectedCount} ПК)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени ПК, IP адресу, сотруднику или отделу..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Account Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 text-[11px]">Учетка:</span>
            <select
              value={filterAccount}
              onChange={e => setFilterAccount(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">Все [eset, root, admin]</option>
              <option value="eset">Только eset ({esetCount})</option>
              <option value="root">Только root ({rootCount})</option>
              <option value="admin">Только admin ({adminCount})</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 text-[11px]">Отдел:</span>
            <select
              value={filterDepartment}
              onChange={e => setFilterDepartment(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">Все отделы</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Selection controls */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <button
              onClick={() => handleToggleSelectAll(true)}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-bold rounded-lg cursor-pointer"
            >
              Выбрать все
            </button>
            <button
              onClick={() => handleToggleSelectAll(false)}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] font-bold rounded-lg cursor-pointer"
            >
              Снять
            </button>
          </div>
        </div>
      </div>

      {/* Computers Table / Grid */}
      <div className="bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-850 bg-slate-900/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedCount === totalCount && totalCount > 0}
                    onChange={e => handleToggleSelectAll(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Компьютер / Хост</th>
                <th className="py-3 px-4">Сотрудник & Отдел</th>
                <th className="py-3 px-4">Сетевой IP & VNC</th>
                <th className="py-3 px-4">Распознанная Учетка</th>
                <th className="py-3 px-4">Статус Пароля</th>
                <th className="py-3 px-4 text-right">Действия TigerVNC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 font-sans">
              {filteredNodes.length > 0 ? (
                filteredNodes.map(node => {
                  const isSelected = !!node.selected;
                  const isRotated = node.passwordStatus === "ROTATED";

                  return (
                    <tr 
                      key={node.computerId}
                      className={`hover:bg-slate-900/40 transition-colors ${
                        isSelected ? "bg-blue-950/10" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(node.computerId)}
                          className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Computer Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl border ${
                            node.os.toLowerCase().includes("linux") || node.detectedAdminAccount === "root"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          }`}>
                            <Monitor className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <strong className="text-white font-mono text-xs">{node.computerName}</strong>
                              <span className="text-[10px] text-slate-500 font-mono">({node.pingMs}ms)</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                              {node.os}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* User and Dept */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-slate-200 block text-[11px]">{node.assignedUser}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{node.department}</span>
                        </div>
                      </td>

                      {/* IP and TigerVNC Port */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 text-blue-300">
                          <span>{node.ipv4}:{node.vncPort}</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" title="Port 5900 Open" />
                        </div>
                        <span className="text-[10px] text-slate-500">RFB 3.8 • WinRM 5985</span>
                      </td>

                      {/* Detected Admin Account selector */}
                      <td className="py-3.5 px-4">
                        <select
                          value={node.detectedAdminAccount}
                          onChange={e => handleChangeAccount(node.computerId, e.target.value as AdminAccountType)}
                          className={`text-xs font-mono font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            node.detectedAdminAccount === "eset"
                              ? "bg-amber-950/40 text-amber-300 border-amber-500/30"
                              : node.detectedAdminAccount === "root"
                              ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                              : "bg-cyan-950/40 text-cyan-300 border-cyan-500/30"
                          }`}
                        >
                          <option value="eset">Учетка: eset</option>
                          <option value="root">Учетка: root</option>
                          <option value="admin">Учетка: admin</option>
                          <option value="Administrator">Учетка: Administrator</option>
                        </select>
                      </td>

                      {/* Password Status */}
                      <td className="py-3.5 px-4">
                        {isRotated ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <Check className="h-3 w-3" /> Пароль изменен
                            </span>
                            {node.lastRotatedAt && (
                              <span className="text-[10px] text-slate-500 font-mono block">
                                в {node.lastRotatedAt}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Lock className="h-3 w-3" /> Ожидает смены
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* TigerVNC Open Session Button */}
                          <button
                            onClick={() => handleOpenVncSession(node)}
                            className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 hover:border-transparent rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Открыть сеанс TigerVNC"
                          >
                            <Monitor className="h-3 w-3" />
                            <span>TigerVNC</span>
                          </button>

                          {/* Quick single password change */}
                          <button
                            onClick={async () => {
                              const targetAcc = node.detectedAdminAccount;
                              const passToSet = globalPassword;
                              const updated = nodes.map(n => n.computerId === node.computerId ? {
                                ...n,
                                passwordStatus: "ROTATED" as const,
                                currentPassword: passToSet,
                                lastRotatedAt: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
                              } : n);
                              saveNodesToStorage(updated);
                              showToast(`Пароль для '${targetAcc}' на ${node.computerName} успешно сменен!`, "success");
                              onAddAuditLog("Автоматизация IT", "warning", `Сменен пароль для '${targetAcc}' на ${node.computerName} (${node.ipv4}) через TigerVNC.`);
                            }}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 rounded-lg cursor-pointer transition-colors"
                            title="Сменить пароль для этой машины"
                          >
                            <Key className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    По вашему запросу компьютеры не найдены.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary inside table */}
        <div className="p-3 bg-slate-900/60 border-t border-slate-850 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Показано: <strong className="text-white">{filteredNodes.length}</strong> из {totalCount} ПК</span>
            <span>•</span>
            <span>Успешно обновлено: <strong className="text-emerald-400">{rotatedCount}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-500">
              TigerVNC Daemon: <strong className="text-slate-300">v1.14.0 (RFB v3.8)</strong>
            </span>
          </div>
        </div>
      </div>

      {/* MODAL 1: Batch Execution Console */}
      {showExecutionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-0">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                  <TerminalIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Консоль пакетной ротации паролей IT
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Прогресс: {executingIndex} из {selectedCount} ПК
                  </span>
                </div>
              </div>

              {!isExecutingBatch && (
                <button
                  onClick={() => setShowExecutionModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Закрыть
                </button>
              )}
            </div>

            {/* Terminal Window */}
            <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 h-80 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {executionLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-slate-600 shrink-0 text-[10px]">{log.time}</span>
                  <span className={
                    log.type === "success" ? "text-emerald-400 font-bold" :
                    log.type === "warning" ? "text-amber-400" :
                    log.type === "error" ? "text-rose-400 font-bold" :
                    "text-slate-300"
                  }>
                    {log.text}
                  </span>
                </div>
              ))}
              {isExecutingBatch && (
                <div className="flex items-center gap-2 text-blue-400 pt-1 animate-pulse">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Выполнение удаленного вызова через TigerVNC socket...</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {isExecutingBatch ? "Идет фоновое выполнение..." : "Пакетная операция полностью завершена."}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(executionLogs.map(l => `[${l.time}] ${l.text}`).join("\n"), "Логи")}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" /> Копировать лог
                </button>
                <button
                  onClick={() => setShowExecutionModal(false)}
                  disabled={isExecutingBatch}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Готово
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TigerVNC Interactive Remote Session Emulator */}
      {activeVncNode && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl space-y-0">
            {/* VNC Header Bar */}
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-400">
                  <Monitor className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-white font-mono text-sm">{activeVncNode.computerName}</strong>
                    <span className="text-[11px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      TigerVNC {activeVncNode.ipv4}:{activeVncNode.vncPort}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Пользователь: {activeVncNode.assignedUser} ({activeVncNode.department}) • Учетка: <strong className="text-amber-300 font-mono">{activeVncNode.detectedAdminAccount}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(`vncviewer.exe ${activeVncNode.ipv4}::${activeVncNode.vncPort}`, "Команда TigerVNC")}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition-all flex items-center gap-1 cursor-pointer"
                  title="Скопировать команду запуска для внешнего клиента TigerVNC"
                >
                  <Copy className="h-3 w-3" /> vncviewer cmd
                </button>
                <button
                  onClick={() => setActiveVncNode(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </div>

            {/* VNC Quick Action Bar */}
            <div className="p-2.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleSendVncCommand("Ctrl+Alt+Del")}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono font-bold cursor-pointer"
                >
                  Ctrl+Alt+Del
                </button>
                <button
                  onClick={() => handleSendVncCommand(`net user ${activeVncNode.detectedAdminAccount} "${globalPassword}"`)}
                  className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 rounded text-[11px] font-bold cursor-pointer"
                >
                  ⚡ Сменить пароль ({activeVncNode.detectedAdminAccount})
                </button>
                <button
                  onClick={() => handleSendVncCommand("shutdown /r /t 5 /f")}
                  className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded text-[11px] font-bold cursor-pointer"
                >
                  Перезагрузка ПК
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-400">
                Канал: <strong className="text-emerald-400">LAN 1000 Мбит/с (Задержка: {activeVncNode.pingMs}ms)</strong>
              </div>
            </div>

            {/* Virtual VNC Display Area */}
            <div className="bg-slate-950 p-4 font-mono text-xs text-slate-300 h-96 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-800 border-b border-slate-800">
              <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl mb-3 text-[11px] text-blue-300">
                💡 <strong>Удаленный доступ активен:</strong> Вы можете напрямую передавать команды операционной системе удаленного ПК, не вставая с рабочего места IT.
              </div>

              {vncConsoleLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log}
                </div>
              ))}
              {vncCommandRunning && (
                <div className="text-amber-400 flex items-center gap-1.5 animate-pulse">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Передача инструкций по протоколу RFB...</span>
                </div>
              )}
            </div>

            {/* Terminal Input Bar */}
            <div className="p-3 bg-slate-900 flex items-center gap-2">
              <span className="text-slate-500 font-mono text-xs">$</span>
              <input
                type="text"
                value={vncTerminalInput}
                onChange={e => setVncTerminalInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendVncCommand()}
                placeholder="Введите команду для удаленного выполнения (например: net user, ipconfig, chpasswd)..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
              />
              <button
                onClick={() => handleSendVncCommand()}
                disabled={!vncTerminalInput.trim() || vncCommandRunning}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Play className="h-3 w-3 fill-current" /> Отправить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Script Generator Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-0">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                  <FileCode className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Экспорт скриптов автоматизации IT
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Сгенерированные пакетные скрипты для PowerShell, Linux Bash и TigerVNC
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowScriptModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Закрыть
              </button>
            </div>

            {/* Script Type Selector */}
            <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setScriptType("POWERSHELL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  scriptType === "POWERSHELL"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                PowerShell (.ps1)
              </button>
              <button
                onClick={() => setScriptType("BASH")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  scriptType === "BASH"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                Linux Bash (.sh)
              </button>
              <button
                onClick={() => setScriptType("VNC_BAT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  scriptType === "VNC_BAT"
                    ? "bg-amber-600 text-white"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                TigerVNC Launcher (.bat)
              </button>
              <button
                onClick={() => setScriptType("CSV_VAULT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  scriptType === "CSV_VAULT"
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                Сводка / Vault (.csv)
              </button>
            </div>

            {/* Script Code Viewer */}
            <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              <pre className="whitespace-pre-wrap">{scriptContent}</pre>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">
                Включено выбранных хостов: {nodes.filter(n => n.selected).length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(scriptContent, "Скрипт")}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" /> Копировать код
                </button>
                <button
                  onClick={handleDownloadScript}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <Download className="h-3.5 w-3.5" /> Скачать файл
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
