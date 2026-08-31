import React, { useState, useEffect, useMemo } from "react";
import { 
  Computer, 
  ParsedRemoteNode, 
  AdminAccountType,
  UserRole
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
  Layers,
  Radio,
  Wifi,
  Laptop,
  Flame,
  ArrowRight,
  Database,
  CheckCheck,
  ChevronRight,
  Send,
  X
} from "lucide-react";

interface ParsingDashboardProps {
  computers: Computer[];
  onAddAuditLog: (action: string, type: "info" | "success" | "warning" | "error", details: string) => void;
  currentUserRole?: UserRole;
}

export default function ParsingDashboard({
  computers,
  onAddAuditLog,
  currentUserRole = UserRole.ADMIN
}: ParsingDashboardProps) {
  // Nodes state
  const [nodes, setNodes] = useState<ParsedRemoteNode[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedSubnet, setSelectedSubnet] = useState<string>("192.168.1.0/24");
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAccount, setFilterAccount] = useState<string>("ALL");
  const [filterDepartment, setFilterDepartment] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Password Automation Settings
  const [passwordMode, setPasswordMode] = useState<"SINGLE" | "UNIQUE">("SINGLE");
  const [globalPassword, setGlobalPassword] = useState("Corp#EsetAdmin2026!");
  const [targetAccountOverride, setTargetAccountOverride] = useState<"DETECTED" | "eset" | "root" | "admin">("DETECTED");
  const [executionProtocol, setExecutionProtocol] = useState<"STEALTH_WINRM" | "STEALTH_WMI" | "SSH_SILENT" | "TIGER_VNC">("STEALTH_WINRM");
  const [stealthMode, setStealthMode] = useState<boolean>(true);
  const [showPasswords, setShowPasswords] = useState(false);

  // Batch Execution Simulation Modal & Console
  const [isExecutingBatch, setIsExecutingBatch] = useState(false);
  const [executingIndex, setExecutingIndex] = useState(0);
  const [executionLogs, setExecutionLogs] = useState<{ time: string; text: string; type: "info" | "success" | "warning" | "error" }[]>([]);
  const [showExecutionModal, setShowExecutionModal] = useState(false);

  // TigerVNC Interactive Session State
  const [activeVncNode, setActiveVncNode] = useState<ParsedRemoteNode | null>(null);
  const [vncTerminalInput, setVncTerminalInput] = useState("");
  const [vncConsoleLogs, setVncConsoleLogs] = useState<string[]>([]);
  const [vncCommandRunning, setVncCommandRunning] = useState(false);
  const [vncActiveScreenView, setVncActiveScreenView] = useState<"DESKTOP" | "TERMINAL" | "SECURITY_PANEL">("DESKTOP");
  const [vncEncoding, setVncEncoding] = useState<string>("Tight (ZRLE + JPEG)");
  const [vncColorDepth, setVncColorDepth] = useState<string>("24-bit TrueColor");

  // Script Generator Modal
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptType, setScriptType] = useState<"VNC_BAT" | "POWERSHELL" | "BASH" | "CSV_VAULT">("VNC_BAT");

  // Quick Notification Toast
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

  // Generate strong random password
  const generateRandomPass = () => {
    const specials = "!@#$%^&*";
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    let res = "";
    res += uppers[Math.floor(Math.random() * uppers.length)];
    res += letters[Math.floor(Math.random() * letters.length)];
    res += digits[Math.floor(Math.random() * digits.length)];
    res += specials[Math.floor(Math.random() * specials.length)];
    const all = specials + letters + uppers + digits;
    for (let i = 0; i < 12; i++) {
      res += all[Math.floor(Math.random() * all.length)];
    }
    return res;
  };

  // Initialize node list from computers prop
  useEffect(() => {
    if (computers.length > 0) {
      const initialNodes: ParsedRemoteNode[] = computers.map((comp, idx) => {
        const adminType = detectAdminAccount(comp);
        const vncPort = 5900 + (idx % 3);
        const isOnline = comp.status === "OK";
        
        return {
          computerId: comp.id,
          computerName: comp.name,
          assignedUser: comp.assignedUserName || "Не назначен",
          department: comp.department || "Основной офис",
          ipv4: comp.ipv4 || `192.168.1.${10 + idx}`,
          mac: comp.mac || `00:1A:79:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}`,
          os: comp.os || "Windows 11 Pro",
          detectedAdminAccount: adminType,
          vncPort: vncPort,
          vncStatus: isOnline ? "AVAILABLE" : "PORT_OPEN",
          sshWinrmStatus: isOnline ? "ONLINE" : "OFFLINE",
          passwordStatus: idx % 4 === 0 ? "ROTATED" : "PENDING_UPDATE",
          lastRotatedAt: idx % 4 === 0 ? "Вчера, 18:40" : undefined,
          generatedPassword: generateRandomPass(),
          selected: true,
          pingMs: Math.floor(2 + Math.random() * 12)
        };
      });
      setNodes(initialNodes);
    }
  }, [computers]);

  // Network discovery scanner simulation
  const handleStartNetworkScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    showToast(`Запущен парсинг подсети ${selectedSubnet} (порты TigerVNC 5900, SSH 22, WinRM 5985)...`, "info");

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          // Refresh node statuses
          setNodes((prevNodes) =>
            prevNodes.map((n) => ({
              ...n,
              vncStatus: "AVAILABLE",
              sshWinrmStatus: "ONLINE",
              pingMs: Math.floor(1 + Math.random() * 8)
            }))
          );
          onAddAuditLog(
            "Парсинг подсети завершен",
            "success",
            `Просканировано ${computers.length} хостов в подсети ${selectedSubnet}. Обнаружены учетные записи: eset, root, admin. TigerVNC порты активны.`
          );
          showToast(`Парсинг завершен! Обнаружено ${computers.length} активных станций с доступом TigerVNC.`, "success");
          return 100;
        }
        return prev + 15;
      });
    }, 180);
  };

  // Toggle selection
  const handleToggleSelectAll = (checked: boolean) => {
    setNodes((prev) => prev.map((n) => ({ ...n, selected: checked })));
  };

  const handleToggleNodeSelect = (computerId: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.computerId === computerId ? { ...n, selected: !n.selected } : n))
    );
  };

  const handleAccountTypeChange = (computerId: string, newAccount: AdminAccountType) => {
    setNodes((prev) =>
      prev.map((n) => (n.computerId === computerId ? { ...n, detectedAdminAccount: newAccount } : n))
    );
    showToast(`Учетная запись для ПК обновлена на [${newAccount}]`, "info");
  };

  // Regeneration of passwords
  const handleRegeneratePasswords = () => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        generatedPassword: generateRandomPass()
      }))
    );
    showToast("Сгенерированы новые уникальные криптостойкие пароли для всех ПК", "success");
  };

  // Filtering computed
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesSearch =
        searchQuery === "" ||
        node.computerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.ipv4.includes(searchQuery) ||
        node.assignedUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.os.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAccount =
        filterAccount === "ALL" ||
        node.detectedAdminAccount.toLowerCase() === filterAccount.toLowerCase();

      const matchesDepartment =
        filterDepartment === "ALL" || node.department === filterDepartment;

      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "ROTATED" && node.passwordStatus === "ROTATED") ||
        (filterStatus === "PENDING" && node.passwordStatus === "PENDING_UPDATE") ||
        (filterStatus === "AVAILABLE" && node.vncStatus === "AVAILABLE");

      return matchesSearch && matchesAccount && matchesDepartment && matchesStatus;
    });
  }, [nodes, searchQuery, filterAccount, filterDepartment, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = nodes.length;
    const esetCount = nodes.filter((n) => n.detectedAdminAccount === "eset").length;
    const rootCount = nodes.filter((n) => n.detectedAdminAccount === "root").length;
    const adminCount = nodes.filter((n) => n.detectedAdminAccount === "admin" || n.detectedAdminAccount === "Administrator").length;
    const rotatedCount = nodes.filter((n) => n.passwordStatus === "ROTATED" || n.passwordStatus === "VERIFIED").length;
    const selectedCount = nodes.filter((n) => n.selected).length;
    const vncReadyCount = nodes.filter((n) => n.vncStatus === "AVAILABLE" || n.vncStatus === "PORT_OPEN").length;

    return {
      total,
      esetCount,
      rootCount,
      adminCount,
      rotatedCount,
      selectedCount,
      vncReadyCount,
      healthPercent: total > 0 ? Math.round((rotatedCount / total) * 100) : 0
    };
  }, [nodes]);

  const departmentsList = useMemo(() => {
    const depts = new Set(nodes.map((n) => n.department));
    return Array.from(depts);
  }, [nodes]);

  // Open Interactive TigerVNC Session
  const handleOpenVncSession = (node: ParsedRemoteNode) => {
    setActiveVncNode(node);
    setVncActiveScreenView("DESKTOP");
    setVncTerminalInput("");
    setVncConsoleLogs([
      `[TigerVNC 1.13.1] Initializing connection to ${node.ipv4}::${node.vncPort}...`,
      `[RFB Protocol] Handshake RFB 003.008 established.`,
      `[Security] Authentication successful for account '${node.detectedAdminAccount}'.`,
      `[TightVNC] Desktop geometry: 1920x1080x32, Encoding: Tight + ZRLE zlib-9.`,
      `[Session] Remote control active on host '${node.computerName}' (${node.os}).`
    ]);
    onAddAuditLog(
      "TigerVNC сеанс открыт",
      "info",
      `Подключение к рабочему столу ${node.computerName} (${node.ipv4}:${node.vncPort}) под учетной записью ${node.detectedAdminAccount}.`
    );
  };

  // Run VNC Terminal Command inside session
  const handleExecuteVncCommand = (customCmd?: string) => {
    const cmd = customCmd || vncTerminalInput.trim();
    if (!cmd || !activeVncNode) return;

    setVncCommandRunning(true);
    setVncConsoleLogs((prev) => [...prev, `root@${activeVncNode.computerName.toLowerCase()}:~$ ${cmd}`]);
    setVncTerminalInput("");

    setTimeout(() => {
      let output = "";
      const cmdLower = cmd.toLowerCase();

      if (cmdLower.includes("whoami") || cmdLower.includes("id")) {
        output = `uid=0(${activeVncNode.detectedAdminAccount}) gid=0(${activeVncNode.detectedAdminAccount}) groups=0(root),27(sudo),119(vnc-admins)`;
      } else if (cmdLower.includes("passwd") || cmdLower.includes("net user")) {
        output = `SUCCESS: Password for account '${activeVncNode.detectedAdminAccount}' updated securely. Hash verified in auth subsystem.`;
        // Mark node as rotated
        setNodes((prev) =>
          prev.map((n) =>
            n.computerId === activeVncNode.computerId
              ? { ...n, passwordStatus: "ROTATED", lastRotatedAt: "Только что (TigerVNC)" }
              : n
          )
        );
        onAddAuditLog(
          "Смена пароля через TigerVNC",
          "success",
          `Пароль администратора '${activeVncNode.detectedAdminAccount}' на ${activeVncNode.computerName} (${activeVncNode.ipv4}) успешно изменен.`
        );
      } else if (cmdLower.includes("eset") || cmdLower.includes("nod32")) {
        output = `ESET Endpoint Antivirus v10.1.2050.0 [Service: Active, Engine: 28490, Admin Lock: Verified]`;
      } else if (cmdLower.includes("ip") || cmdLower.includes("ifconfig") || cmdLower.includes("ipconfig")) {
        output = `eth0: inet ${activeVncNode.ipv4} netmask 255.255.255.0 broadcast 192.168.1.255, ether ${activeVncNode.mac}`;
      } else if (cmdLower.includes("reboot") || cmdLower.includes("shutdown")) {
        output = `Broadcast message from root@${activeVncNode.computerName}: System is rebooting now! Connection will restart.`;
      } else if (cmdLower.includes("vncpasswd")) {
        output = `vncpasswd: Password successfully set for TigerVNC RFB 5900 service daemon.`;
      } else {
        output = `Command executed successfully. Exit code: 0 [RFB Keystroke Buffer: Sent]`;
      }

      setVncConsoleLogs((prev) => [...prev, output]);
      setVncCommandRunning(false);
    }, 450);
  };

  // Send special keys in TigerVNC
  const handleSendSpecialKey = (combo: string) => {
    if (!activeVncNode) return;
    setVncConsoleLogs((prev) => [
      ...prev,
      `[TigerVNC RFB] Keystroke combination injected: [${combo}] -> Handled by Remote Host OS.`
    ]);
    showToast(`Отправлена комбинация [${combo}] на ${activeVncNode.computerName}`, "info");

    if (combo === "Ctrl+Alt+Del") {
      setVncConsoleLogs((prev) => [
        ...prev,
        `[OS Event] Security options screen triggered (Task Manager / Lock / Change Password).`
      ]);
    }
  };

  // Quick in-session password change
  const handleQuickPasswordChangeInVnc = () => {
    if (!activeVncNode) return;
    const newPass = activeVncNode.generatedPassword || generateRandomPass();
    const cmd =
      activeVncNode.os.toLowerCase().includes("win")
        ? `net user ${activeVncNode.detectedAdminAccount} ${newPass}`
        : `echo "${activeVncNode.detectedAdminAccount}:${newPass}" | chpasswd && vncpasswd -f <<< "${newPass}"`;
    
    handleExecuteVncCommand(cmd);
    showToast(`Пароль для ${activeVncNode.detectedAdminAccount} изменен на: ${newPass}`, "success");
  };

  // Batch Automation Runner
  const handleStartBatchRotation = () => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) {
      showToast("Выберите хотя бы один компьютер для ротации паролей!", "warning");
      return;
    }

    setShowExecutionModal(true);
    setIsExecutingBatch(true);
    setExecutingIndex(0);
    setExecutionLogs([
      {
        time: new Date().toLocaleTimeString(),
        text: `Запуск скрытой фоновой ротации паролей (${stealthMode ? "Режим невидимки: WinRM/WMI в фоне без всплывающих окон и без захвата экрана" : "TigerVNC сеанс"}) для ${selectedNodes.length} ПК...`,
        type: "info"
      }
    ]);

    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex >= selectedNodes.length) {
        clearInterval(interval);
        setIsExecutingBatch(false);
        setExecutionLogs((prev) => [
          ...prev,
          {
            time: new Date().toLocaleTimeString(),
            text: `СКРЫТАЯ РОТАЦИЯ ЗАВЕРШЕНА! Пользователи продолжают работу без прерывания сеанса. Успешно обновлено: ${selectedNodes.length} ПК.`,
            type: "success"
          }
        ]);
        onAddAuditLog(
          "Скрытая смена паролей завершена",
          "success",
          `Фоновая ротация паролей администраторов (${stealthMode ? "WinRM/WMI Stealth" : "TigerVNC"}) на ${selectedNodes.length} ПК прошла без влияния на сеансы пользователей.`
        );
        return;
      }

      const target = selectedNodes[currentIndex];
      const accountToUse =
        targetAccountOverride === "DETECTED" ? target.detectedAdminAccount : targetAccountOverride;
      const passToUse =
        passwordMode === "SINGLE" ? globalPassword : target.generatedPassword || generateRandomPass();

      setExecutingIndex(currentIndex + 1);

      setExecutionLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          text: `[${currentIndex + 1}/${selectedNodes.length}] Фоновое подключение к ${target.computerName} (${target.ipv4})...`,
          type: "info"
        },
        {
          time: new Date().toLocaleTimeString(),
          text: `  -> Скрытый вызов SAM/ADSI для учетки [${accountToUse}]. Сеанс пользователя [${target.assignedUser}] не затронут.`,
          type: "info"
        },
        {
          time: new Date().toLocaleTimeString(),
          text: `  -> OK! Пароль для [${accountToUse}] успешно изменен. (0 всплывающих окон, экран чист).`,
          type: "success"
        }
      ]);

      // Update node status
      setNodes((prevNodes) =>
        prevNodes.map((n) =>
          n.computerId === target.computerId
            ? {
                ...n,
                passwordStatus: "ROTATED",
                lastRotatedAt: "Только что",
                currentPassword: passToUse
              }
            : n
        )
      );

      currentIndex++;
    }, 600);
  };

  // Generate Script Content
  const generateScriptContent = () => {
    const selectedNodes = nodes.filter((n) => n.selected);

    if (scriptType === "VNC_BAT") {
      return `@echo off
:: =========================================================================
:: TigerVNC Automated Remote Dispatcher & Admin Launcher
:: Generated by Archon IT Integrity Dashboard (c) 2026
:: =========================================================================
title TigerVNC Batch Admin Connect
color 0B

echo =========================================================================
echo  [TigerVNC] Скрипт быстрого подключения к офисным ПК
echo =========================================================================

${selectedNodes
  .map(
    (n, idx) => `echo [${idx + 1}] Подключиться к ${n.computerName} (${n.ipv4}:${n.vncPort}) - Учетка: ${n.detectedAdminAccount}
:: vncviewer.exe -Shared=1 -AutoReconnect=1 -FullColor=1 ${n.ipv4}::${n.vncPort}
`
  )
  .join("\n")}

set /p choice="Введите номер ПК для открытия сеанса (1-${selectedNodes.length}): "
echo Открытие сеанса TigerVNC...
pause
`;
    }

    if (scriptType === "POWERSHELL") {
      return `# =========================================================================
# PowerShell WinRM & WMI Remote Admin Password Rotation
# Archon IT Department • Target Accounts: eset, root, admin
# =========================================================================

$Targets = @(
${selectedNodes
  .map(
    (n) => `    @{ IP = "${n.ipv4}"; Name = "${n.computerName}"; User = "${n.detectedAdminAccount}"; Pass = "${passwordMode === "SINGLE" ? globalPassword : n.generatedPassword}" }`
  )
  .join(",\n")}
)

Write-Host "[ARCHON IT] Запуск удаленной смены паролей на $($Targets.Count) станциях..." -ForegroundColor Cyan

foreach ($item in $Targets) {
    Write-Host "Подключение к $($item.Name) ($($item.IP)) для пользователя $($item.User)..." -ForegroundColor Yellow
    try {
        # Пакетное обновление через ADSI / WinNT провайдер
        $userObj = [ADSI]"WinNT://$($item.IP)/$($item.User),user"
        $userObj.SetPassword($item.Pass)
        $userObj.SetInfo()
        Write-Host "  -> УСПЕШНО: Пароль для $($item.User) на $($item.Name) обновлен." -ForegroundColor Green
    }
    catch {
        Write-Warning "  -> ОШИБКА: $($_.Exception.Message)"
    }
}

Write-Host "[ARCHON IT] Ротация завершена." -ForegroundColor Cyan
`;
    }

    if (scriptType === "BASH") {
      return `#!/usr/bin/env bash
# =========================================================================
# Linux & Astra Linux Remote Password and TigerVNC Rotator
# =========================================================================

TARGETS=(
${selectedNodes
  .map(
    (n) => `  "${n.ipv4}:${n.detectedAdminAccount}:${passwordMode === "SINGLE" ? globalPassword : n.generatedPassword}"`
  )
  .join("\n")}
)

echo "=== Запуск пакетной ротации паролей по SSH/TigerVNC ==="

for target in "\${TARGETS[@]}"; do
  IFS=":" read -r ip user pass <<< "$target"
  echo ">>> Обновление $ip ($user)..."
  
  # Выполнение удаленной смены пароля системы и vncpasswd
  ssh -o StrictHostKeyChecking=no "$user@$ip" "echo '$user:$pass' | sudo chpasswd && echo '$pass' | vncpasswd -f > ~/.vnc/passwd"
  
  if [ $? -eq 0 ]; then
    echo "  [OK] Пароль успешно изменен на $ip"
  else
    echo "  [FAIL] Ошибка подключения к $ip"
  fi
done

echo "=== Готово ==="
`;
    }

    // CSV Vault
    return `ComputerName;IPv4;MAC;OS;Department;AdminAccount;PasswordStatus;VncPort;GeneratedPassword;LastRotated
${selectedNodes
  .map(
    (n) =>
      `"${n.computerName}";"${n.ipv4}";"${n.mac}";"${n.os}";"${n.department}";"${n.detectedAdminAccount}";"${n.passwordStatus}";"${n.vncPort}";"${passwordMode === "SINGLE" ? globalPassword : n.generatedPassword}";"${n.lastRotatedAt || "Pending"}"`
  )
  .join("\n")}`;
  };

  const handleDownloadScript = () => {
    const content = generateScriptContent();
    const filename =
      scriptType === "VNC_BAT"
        ? "tigervnc_connect_all.bat"
        : scriptType === "POWERSHELL"
        ? "rotate_admin_passwords.ps1"
        : scriptType === "BASH"
        ? "rotate_linux_vnc.sh"
        : "it_admin_accounts_vault.csv";

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Файл ${filename} успешно сформирован и скачан!`, "success");
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generateScriptContent());
    showToast("Скрипт скопирован в буфер обмена!", "success");
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Toast popup */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md animate-bounce-short ${
            toastMsg.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
              : toastMsg.type === "warning"
              ? "bg-amber-950/90 border-amber-500/50 text-amber-200"
              : "bg-blue-950/90 border-blue-500/50 text-blue-200"
          }`}
        >
          {toastMsg.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
          {toastMsg.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />}
          {toastMsg.type === "info" && <Zap className="h-5 w-5 text-blue-400 shrink-0" />}
          <span className="text-xs font-semibold">{toastMsg.text}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 p-5 lg:p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-indigo-600 p-0.5 shadow-lg shadow-amber-500/10">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
                <Zap className="h-6 w-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Парсинг & Удаленная автоматизация TigerVNC
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  RFB v3.8 • Port 5900
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Поиск администраторов (<strong>eset, root, admin</strong>) на подключенных офисных ПК и централизованная смена паролей по локальной сети.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowScriptModal(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileCode className="h-4 w-4 text-cyan-400" />
              <span>Генератор скриптов (.ps1 / .bat)</span>
            </button>

            <button
              onClick={handleStartNetworkScan}
              disabled={isScanning}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer ${
                isScanning
                  ? "bg-amber-600/50 text-white cursor-wait"
                  : "bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white shadow-amber-500/20"
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${isScanning ? "animate-spin" : ""}`} />
              <span>{isScanning ? `Парсинг сети (${scanProgress}%)...` : "Сканировать сеть"}</span>
            </button>
          </div>
        </div>

        {/* Live scanning progress bar */}
        {isScanning && (
          <div className="space-y-1.5 pt-2 animate-fade-in">
            <div className="flex justify-between text-[11px] font-mono text-amber-400 font-semibold">
              <span>Парсинг подсети {selectedSubnet}: опрос портов 5900, 22, 5985 и поиск админов...</span>
              <span>{scanProgress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 transition-all duration-200"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Всего ПК</span>
              <Monitor className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <div className="text-xl font-bold font-mono text-white">{stats.total}</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <Radio className="h-2.5 w-2.5 animate-pulse" /> {stats.vncReadyCount} VNC онлайн
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-blue-500/20 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-blue-400 font-semibold">
              <span>Учетка [ eset ]</span>
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-300">{stats.esetCount}</div>
            <div className="text-[10px] text-slate-400">ESET Remote Agent</div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/20 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-amber-400 font-semibold">
              <span>Учетка [ root ]</span>
              <TerminalIcon className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-300">{stats.rootCount}</div>
            <div className="text-[10px] text-slate-400">Linux / Astra Linux</div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-indigo-500/20 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-indigo-400 font-semibold">
              <span>Учетка [ admin ]</span>
              <Key className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold font-mono text-indigo-300">{stats.adminCount}</div>
            <div className="text-[10px] text-slate-400">Windows Local Admin</div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
              <span>Обновлено паролей</span>
              <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-300">{stats.rotatedCount}</div>
            <div className="text-[10px] text-slate-400">Стойкость: 100%</div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-500/20 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-purple-400 font-semibold">
              <span>Безопасность</span>
              <Shield className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-bold font-mono text-purple-300">{stats.healthPercent}%</div>
            <div className="text-[10px] text-slate-400">Целевой уровень: 100%</div>
          </div>
        </div>
      </div>

      {/* AUTOMATION CONTROL PANEL & CONFIGURATION */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Мастер пакетной ротации паролей по локальной сети
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Выбрано станций для обработки: <strong className="text-amber-400">{stats.selectedCount}</strong> из {stats.total}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Target Account Selector */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <span>Целевая учетная запись:</span>
            </label>
            <select
              value={targetAccountOverride}
              onChange={(e) => setTargetAccountOverride(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-750 text-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
            >
              <option value="DETECTED">⚡ Авто-определение (eset / root / admin)</option>
              <option value="eset">🛡️ Только 'eset' (ESET Security Agent)</option>
              <option value="root">🐧 Только 'root' (Linux / Astra Linux)</option>
              <option value="admin">🪟 Только 'admin' (Windows Local Admin)</option>
            </select>
          </div>

          {/* Execution Mode / Stealth Toggle */}
          <div className="md:col-span-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Режим выполнения:</span>
              </label>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${stealthMode ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"}`}>
                {stealthMode ? "100% Скрытно" : "VNC Сеанс"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setStealthMode(true);
                  setExecutionProtocol("STEALTH_WINRM");
                }}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  stealthMode
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Клиент не видит окон, рабочий процесс не прерывается"
              >
                <EyeOff className="h-3 w-3" />
                <span>Скрытый фон</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStealthMode(false);
                  setExecutionProtocol("TIGER_VNC");
                }}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  !stealthMode
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Подключение через визуальный экран TigerVNC"
              >
                <Monitor className="h-3 w-3" />
                <span>TigerVNC</span>
              </button>
            </div>
          </div>

          {/* Master Password Input or Unique Trigger */}
          <div className="md:col-span-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300">
                {passwordMode === "SINGLE" ? "Мастер-пароль для смены:" : "Уникальные пароли:"}
              </label>
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showPasswords ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showPasswords ? "Скрыть" : "Показать"}
              </button>
            </div>

            {passwordMode === "SINGLE" ? (
              <div className="relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  value={globalPassword}
                  onChange={(e) => setGlobalPassword(e.target.value)}
                  placeholder="Введите новый пароль..."
                  className="w-full bg-slate-950 border border-slate-750 text-amber-300 rounded-xl px-3 py-2 text-xs font-mono focus:border-amber-500 focus:outline-none pr-8"
                />
                <button
                  type="button"
                  onClick={() => setGlobalPassword(generateRandomPass())}
                  title="Сгенерировать случайный пароль"
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-amber-400 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRegeneratePasswords}
                className="w-full py-2 bg-slate-950 border border-slate-750 hover:border-amber-500/50 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
                <span>Сгенерировать уникальные</span>
              </button>
            )}
          </div>

          {/* Action Trigger */}
          <div className="md:col-span-3">
            <button
              type="button"
              onClick={handleStartBatchRotation}
              disabled={isExecutingBatch || stats.selectedCount === 0}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                stats.selectedCount === 0
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : stealthMode
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
              }`}
            >
              {stealthMode ? <EyeOff className="h-4 w-4 text-emerald-200" /> : <Zap className="h-4 w-4 text-indigo-200" />}
              <span>{stealthMode ? "Скрытая ротация" : "Запустить VNC"} ({stats.selectedCount} ПК)</span>
            </button>
          </div>
        </div>

        {/* Stealth Mode Indicator Bar */}
        {stealthMode && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                <strong>Скрытый режим включен:</strong> смена паролей учетных записей (<code>eset</code>, <code>root</code>, <code>admin</code>) выполняется в фоновом системном потоке через WinRM / WMI / ADSI.
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono hidden md:inline-block">
              0 окон у клиента • без блокировки мыши • без прерывания работы
            </span>
          </div>
        )}
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Поиск по имени, IP, пользователю..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Account Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterAccount("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filterAccount === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Все учетки ({nodes.length})
            </button>
            <button
              onClick={() => setFilterAccount("eset")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterAccount === "eset" ? "bg-blue-600 text-white" : "text-blue-400 hover:bg-blue-950/40"
              }`}
            >
              eset ({stats.esetCount})
            </button>
            <button
              onClick={() => setFilterAccount("root")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterAccount === "root" ? "bg-amber-600 text-white" : "text-amber-400 hover:bg-amber-950/40"
              }`}
            >
              root ({stats.rootCount})
            </button>
            <button
              onClick={() => setFilterAccount("admin")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterAccount === "admin" ? "bg-indigo-600 text-white" : "text-indigo-400 hover:bg-indigo-950/40"
              }`}
            >
              admin ({stats.adminCount})
            </button>
          </div>
        </div>

        {/* Subnet & Selection helpers */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Wifi className="h-3.5 w-3.5 text-amber-400" />
            <select
              value={selectedSubnet}
              onChange={(e) => setSelectedSubnet(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 font-mono focus:outline-none"
            >
              <option value="192.168.1.0/24">192.168.1.0/24 (Office LAN)</option>
              <option value="192.168.2.0/24">192.168.2.0/24 (Server DMZ)</option>
              <option value="192.168.10.0/24">192.168.10.0/24 (Management)</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleToggleSelectAll(true)}
              className="px-2 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
            >
              Выбрать все
            </button>
            <button
              onClick={() => handleToggleSelectAll(false)}
              className="px-2 py-1 text-[11px] text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded-lg"
            >
              Снять выбор
            </button>
          </div>
        </div>
      </div>

      {/* TABLE OF WORKSTATIONS & DETECTED ADMINS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={nodes.length > 0 && nodes.every((n) => n.selected)}
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">Компьютер / IP / MAC</th>
                <th className="p-3.5">Пользователь & Отдел</th>
                <th className="p-3.5">ОС & Сервисы</th>
                <th className="p-3.5">Распознанный Админ</th>
                <th className="p-3.5">TigerVNC (RFB 5900)</th>
                <th className="p-3.5">Новый Пароль</th>
                <th className="p-3.5">Статус Ротации</th>
                <th className="p-3.5 text-right">Удаленный сеанс</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredNodes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <p className="text-sm font-semibold">Рабочие станции не найдены</p>
                    <p className="text-xs mt-1">Попробуйте изменить параметры поиска или фильтрации</p>
                  </td>
                </tr>
              ) : (
                filteredNodes.map((node) => {
                  return (
                    <tr
                      key={node.computerId}
                      className={`hover:bg-slate-850/60 transition-colors ${
                        node.selected ? "bg-amber-950/10" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={!!node.selected}
                          onChange={() => handleToggleNodeSelect(node.computerId)}
                          className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Computer Info */}
                      <td className="p-3.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Laptop className="h-3.5 w-3.5 text-amber-400" />
                          <span>{node.computerName}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="text-indigo-400">{node.ipv4}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500">{node.mac}</span>
                        </div>
                      </td>

                      {/* User & Dept */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">{node.assignedUser}</div>
                        <div className="text-[10px] text-slate-400">{node.department}</div>
                      </td>

                      {/* OS */}
                      <td className="p-3.5">
                        <div className="text-slate-300 font-medium">{node.os}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Ping: ~{node.pingMs}ms</div>
                      </td>

                      {/* Detected Admin Account */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={node.detectedAdminAccount}
                            onChange={(e) => handleAccountTypeChange(node.computerId, e.target.value as AdminAccountType)}
                            className={`text-xs font-mono font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                              node.detectedAdminAccount === "eset"
                                ? "bg-blue-950/80 text-blue-300 border-blue-500/40"
                                : node.detectedAdminAccount === "root"
                                ? "bg-amber-950/80 text-amber-300 border-amber-500/40"
                                : "bg-indigo-950/80 text-indigo-300 border-indigo-500/40"
                            }`}
                          >
                            <option value="eset">🛡️ eset</option>
                            <option value="root">🐧 root</option>
                            <option value="admin">🪟 admin</option>
                            <option value="Administrator">Administrator</option>
                          </select>
                        </div>
                      </td>

                      {/* TigerVNC Port & State */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="font-mono text-emerald-400 font-bold">RFB ::{node.vncPort}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">Tight zlib-9</span>
                      </td>

                      {/* Generated Password for node */}
                      <td className="p-3.5">
                        <div className="font-mono text-xs text-amber-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 flex items-center justify-between max-w-[140px]">
                          <span>
                            {showPasswords
                              ? passwordMode === "SINGLE"
                                ? globalPassword
                                : node.generatedPassword
                              : "••••••••••••"}
                          </span>
                          <button
                            onClick={() => {
                              const p = passwordMode === "SINGLE" ? globalPassword : node.generatedPassword || "";
                              navigator.clipboard.writeText(p);
                              showToast(`Пароль для ${node.computerName} скопирован!`, "info");
                            }}
                            className="text-slate-500 hover:text-amber-400 ml-1 cursor-pointer"
                            title="Скопировать пароль"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                      {/* Password Rotation Status */}
                      <td className="p-3.5">
                        {node.passwordStatus === "ROTATED" ? (
                          <div className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Обновлен</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-400 font-medium text-[11px]">
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Ожидает смены</span>
                          </div>
                        )}
                        {node.lastRotatedAt && (
                          <span className="text-[9px] text-slate-500 block">{node.lastRotatedAt}</span>
                        )}
                      </td>

                      {/* Action: Open TigerVNC Session */}
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenVncSession(node)}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold border border-indigo-500/30 transition-all flex items-center gap-1.5 ml-auto cursor-pointer shadow-sm"
                        >
                          <Monitor className="h-3.5 w-3.5" />
                          <span>TigerVNC Сеанс</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: INTERACTIVE TIGERVNC SESSION SUITE */}
      {activeVncNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 lg:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* VNC Window Header */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">
                      TigerVNC Viewer 1.13.1 — {activeVncNode.computerName} ({activeVncNode.ipv4}::{activeVncNode.vncPort})
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                      Админ: {activeVncNode.detectedAdminAccount}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Протокол: RFB 003.008 • Кодировка: {vncEncoding} • Цвет: {vncColorDepth} • Задержка: {activeVncNode.pingMs}ms
                  </div>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveVncNode(null)}
                  className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick Action Key Injection Toolbar */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Отправка клавиш:</span>
                {[
                  { label: "Ctrl+Alt+Del", combo: "Ctrl+Alt+Del" },
                  { label: "Win+R (Run)", combo: "Win+R" },
                  { label: "Alt+Tab", combo: "Alt+Tab" },
                  { label: "Ctrl+Esc", combo: "Ctrl+Esc" },
                  { label: "Alt+F4", combo: "Alt+F4" }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleSendSpecialKey(item.combo)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono font-bold rounded-md border border-slate-700 transition-all cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* View Switcher inside VNC */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setVncActiveScreenView("DESKTOP")}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                    vncActiveScreenView === "DESKTOP" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  🖥️ Рабочий стол
                </button>
                <button
                  onClick={() => setVncActiveScreenView("TERMINAL")}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                    vncActiveScreenView === "TERMINAL" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  💻 Терминал ({activeVncNode.detectedAdminAccount})
                </button>
                <button
                  onClick={() => setVncActiveScreenView("SECURITY_PANEL")}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                    vncActiveScreenView === "SECURITY_PANEL" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  🛡️ ESET / SAM Спецификация
                </button>
              </div>
            </div>

            {/* VNC Interactive Screen Body */}
            <div className="flex-1 bg-slate-950 p-4 overflow-y-auto">
              {vncActiveScreenView === "DESKTOP" && (
                <div className="relative w-full aspect-video bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 rounded-xl border border-slate-800 overflow-hidden shadow-inner flex flex-col justify-between p-4">
                  {/* Remote OS Wallpaper Branding */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{activeVncNode.computerName}</span>
                        <span className="text-xs text-slate-400 font-mono">[{activeVncNode.os}]</span>
                      </div>
                      <p className="text-[11px] text-emerald-400 font-mono">
                        ● Сеанс активен под учетной записью: <strong className="text-amber-300">{activeVncNode.detectedAdminAccount}</strong>
                      </p>
                    </div>

                    {/* Quick overlay button to rotate password inside session */}
                    <button
                      onClick={handleQuickPasswordChangeInVnc}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Key className="h-3.5 w-3.5" />
                      <span>Сменить пароль в этой сессии</span>
                    </button>
                  </div>

                  {/* Simulated Desktop Floating Windows */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-auto max-w-2xl mx-auto w-full">
                    {/* Administrator Control Window */}
                    <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-3.5 shadow-2xl backdrop-blur-sm space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-amber-400" />
                          <span>Управление локальными учетными записями</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">lusrmgr.msc</span>
                      </div>
                      <div className="space-y-1.5 text-[11px] font-mono">
                        <div className="flex justify-between p-1.5 bg-slate-950 rounded border border-slate-800">
                          <span className="text-slate-400">Обнаруженный админ:</span>
                          <span className="text-amber-300 font-bold">{activeVncNode.detectedAdminAccount}</span>
                        </div>
                        <div className="flex justify-between p-1.5 bg-slate-950 rounded border border-slate-800">
                          <span className="text-slate-400">Группа привилегий:</span>
                          <span className="text-indigo-300">Administrators / sudoers</span>
                        </div>
                        <div className="flex justify-between p-1.5 bg-slate-950 rounded border border-slate-800">
                          <span className="text-slate-400">TigerVNC Служба:</span>
                          <span className="text-emerald-400">Active (PID: 2841)</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Command Launcher */}
                    <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-3.5 shadow-2xl backdrop-blur-sm space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <TerminalIcon className="h-4 w-4 text-cyan-400" />
                          <span>Быстрые действия администратора</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleExecuteVncCommand("whoami /priv")}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 rounded font-mono text-left"
                        >
                          &gt; whoami /priv
                        </button>
                        <button
                          onClick={() => handleExecuteVncCommand("net localgroup Administrators")}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 rounded font-mono text-left"
                        >
                          &gt; net localgroup
                        </button>
                        <button
                          onClick={() => handleExecuteVncCommand("eset_cli --status")}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] text-blue-300 rounded font-mono text-left"
                        >
                          &gt; eset status
                        </button>
                        <button
                          onClick={() => handleExecuteVncCommand("vncpasswd -status")}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-300 rounded font-mono text-left"
                        >
                          &gt; vnc status
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remote Taskbar */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 flex items-center justify-between text-xs backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center font-bold text-[10px] text-white shadow">
                        ❖
                      </div>
                      <span className="text-slate-300 font-semibold">{activeVncNode.assignedUser}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
                      <span>IP: {activeVncNode.ipv4}</span>
                      <span>VNC: 5900</span>
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TERMINAL VIEW IN SESSION */}
              {vncActiveScreenView === "TERMINAL" && (
                <div className="bg-black rounded-xl border border-slate-850 p-4 font-mono text-xs space-y-3 min-h-[380px] flex flex-col justify-between shadow-2xl">
                  <div className="space-y-1 overflow-y-auto max-h-[320px] text-emerald-400">
                    <div className="text-slate-500 pb-2 border-b border-slate-850">
                      TigerVNC Terminal Subsystem • Authenticated as [{activeVncNode.detectedAdminAccount}] on {activeVncNode.ipv4}
                    </div>
                    {vncConsoleLogs.map((log, i) => (
                      <div key={i} className="leading-relaxed whitespace-pre-wrap">
                        {log}
                      </div>
                    ))}
                    {vncCommandRunning && (
                      <div className="text-amber-400 animate-pulse">Выполнение команды по протоколу RFB...</div>
                    )}
                  </div>

                  {/* Interactive Terminal Input */}
                  <div className="pt-2 border-t border-slate-850 flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">
                      {activeVncNode.detectedAdminAccount}@{activeVncNode.computerName.toLowerCase()}:~$
                    </span>
                    <input
                      type="text"
                      value={vncTerminalInput}
                      onChange={(e) => setVncTerminalInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleExecuteVncCommand();
                      }}
                      placeholder="Введите команду (passwd, net user, whoami, eset_cli, ipconfig)..."
                      className="flex-1 bg-transparent border-none text-white focus:outline-none font-mono text-xs"
                      autoFocus
                    />
                    <button
                      onClick={() => handleExecuteVncCommand()}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold cursor-pointer"
                    >
                      Enter
                    </button>
                  </div>
                </div>
              )}

              {/* SECURITY & ESET SPECIFICATION VIEW */}
              {vncActiveScreenView === "SECURITY_PANEL" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      <span>ESET Endpoint Security & Remote Control</span>
                    </h4>
                    <p className="text-xs text-slate-300">
                      Сервисная учетная запись <strong>eset</strong> используется для администрирования антивирусных политик, карантина и удаленного развертывания.
                    </p>
                    <div className="space-y-2 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Служба ERAAgent:</span>
                        <span className="text-emerald-400">RUNNING (PID 1420)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Защита настроек паролем:</span>
                        <span className="text-amber-400">ВКЛЮЧЕНА (Требует ротации)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Порт управления:</span>
                        <span className="text-indigo-400">TCP 2222 / 5900</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      <span>Параметры аутентификации TigerVNC</span>
                    </h4>
                    <p className="text-xs text-slate-300">
                      RFB протокол версии 3.8 с поддержкой расширений безопасности Tight, ZRLE и VeNCrypt.
                    </p>
                    <div className="space-y-2 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Хранилище vncpasswd:</span>
                        <span className="text-slate-300">/etc/vnc/passwd (DES/SHA512)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Шифрование канала:</span>
                        <span className="text-emerald-400">TLS / AES-256-GCM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Доступ без подтверждения пользователя:</span>
                        <span className="text-emerald-400">РАЗРЕШЕН (Режим IT)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* VNC Window Footer */}
            <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span>Строка прямого запуска:</span>
                <code className="bg-slate-900 px-2 py-0.5 rounded text-amber-300 border border-slate-800 select-all">
                  vncviewer.exe {activeVncNode.ipv4}::{activeVncNode.vncPort}
                </code>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`vncviewer.exe ${activeVncNode.ipv4}::${activeVncNode.vncPort}`);
                  showToast("Строка подключения vncviewer скопирована!", "info");
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Copy className="h-3 w-3" />
                <span>Скопировать</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BATCH EXECUTION SIMULATION CONSOLE */}
      {showExecutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Пакетное исполнение ротации паролей</h3>
                  <p className="text-[11px] text-slate-400">Протокол TigerVNC RFB 5900 + WinRM/SSH</p>
                </div>
              </div>
              {!isExecutingBatch && (
                <button
                  onClick={() => setShowExecutionModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="p-5 space-y-4">
              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Обработка: {executingIndex} из {stats.selectedCount} ПК</span>
                  <span className="text-amber-400 font-bold">
                    {stats.selectedCount > 0 ? Math.round((executingIndex / stats.selectedCount) * 100) : 100}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                    style={{
                      width: `${stats.selectedCount > 0 ? (executingIndex / stats.selectedCount) * 100 : 100}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Live Terminal Log Stream */}
              <div className="bg-black rounded-xl p-4 font-mono text-xs space-y-1.5 max-h-64 overflow-y-auto border border-slate-850">
                {executionLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed ${
                      log.type === "success"
                        ? "text-emerald-400 font-bold"
                        : log.type === "warning"
                        ? "text-amber-400"
                        : log.type === "error"
                        ? "text-rose-400"
                        : "text-slate-400"
                    }`}
                  >
                    <span className="text-slate-600 mr-2">[{log.time}]</span>
                    {log.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                disabled={isExecutingBatch}
                onClick={() => setShowExecutionModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {isExecutingBatch ? "Идет выполнение..." : "Закрыть отчет"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SCRIPT & VAULT EXPORT GENERATOR */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <FileCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Генератор скриптов и экспорт безопасного хранилища</h3>
                  <p className="text-[11px] text-slate-400">Автоматизация для IT-отдела без ручного ввода</p>
                </div>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setScriptType("VNC_BAT")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    scriptType === "VNC_BAT"
                      ? "bg-amber-600/20 border-amber-500 text-amber-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                  <span>TigerVNC (.bat)</span>
                </button>
                <button
                  onClick={() => setScriptType("POWERSHELL")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    scriptType === "POWERSHELL"
                      ? "bg-blue-600/20 border-blue-500 text-blue-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <TerminalIcon className="h-4 w-4" />
                  <span>PowerShell (.ps1)</span>
                </button>
                <button
                  onClick={() => setScriptType("BASH")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    scriptType === "BASH"
                      ? "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Cpu className="h-4 w-4" />
                  <span>Linux Bash (.sh)</span>
                </button>
                <button
                  onClick={() => setScriptType("CSV_VAULT")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    scriptType === "CSV_VAULT"
                      ? "bg-purple-600/20 border-purple-500 text-purple-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Database className="h-4 w-4" />
                  <span>CSV Vault (Сейф)</span>
                </button>
              </div>

              {/* Code preview block */}
              <div className="relative">
                <pre className="bg-black p-4 rounded-xl text-emerald-400 font-mono text-xs overflow-x-auto max-h-72 border border-slate-850 leading-relaxed">
                  {generateScriptContent()}
                </pre>
              </div>
            </div>

            <div className="bg-slate-950 px-5 py-3.5 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Включено хостов: {nodes.filter((n) => n.selected).length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyScript}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                  <span>Копировать</span>
                </button>
                <button
                  onClick={handleDownloadScript}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Download className="h-4 w-4" />
                  <span>Скачать файл</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
