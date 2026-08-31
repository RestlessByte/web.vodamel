import React, { useState, useEffect } from "react";
import {
  Server,
  Network,
  Activity,
  ShieldCheck,
  LifeBuoy,
  Users,
  Terminal as TerminalIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  Filter,
  ArrowUpRight,
  ExternalLink,
  Laptop,
  Cpu,
  Wifi,
  HardDrive,
  Key,
  Shield,
  Send,
  Zap,
  PhoneCall,
  UserCheck,
  Check,
  Layers,
  Globe,
  Radio,
  FileText,
  AlertCircle,
  X,
  RotateCcw
} from "lucide-react";
import {
  ITTicket,
  ITServerNode,
  ITVLAN,
  ITLicense,
  UserRole,
  Computer,
  ServiceMemo
} from "../types";
import {
  initialITTickets,
  initialITServers,
  initialITVLANs,
  initialITLicenses,
  initialServiceMemos,
  initialUsers
} from "../data";
import { dbService } from "../services/apiClient";
import ServiceMemosFolder from "./ServiceMemosFolder";
import ITRemoteAutomationParser from "./ITRemoteAutomationParser";

interface ITDepartmentDashboardProps {
  currentUserRole: UserRole;
  currentUserName: string;
  computers: Computer[];
  onNavigateToComputers?: (departmentFilter?: string) => void;
  onAddAuditLog: (action: string, type: "info" | "success" | "warning" | "error", details: string) => void;
}

export default function ITDepartmentDashboard({
  currentUserRole,
  currentUserName,
  computers,
  onNavigateToComputers,
  onAddAuditLog
}: ITDepartmentDashboardProps) {
  // Navigation inside IT Dashboard
  const [activeTab, setActiveTab] = useState<"overview" | "parsing" | "memos" | "infrastructure" | "tickets" | "licenses" | "terminal">("overview");
  const [isDbReady, setIsDbReady] = useState(false);

  // State collections with PostgreSQL persistence
  const [tickets, setTickets] = useState<ITTicket[]>(initialITTickets);
  const [servers, setServers] = useState<ITServerNode[]>(initialITServers);
  const [vlans, setVlans] = useState<ITVLAN[]>(initialITVLANs);
  const [licenses, setLicenses] = useState<ITLicense[]>(initialITLicenses);
  const [memos, setMemos] = useState<ServiceMemo[]>(initialServiceMemos);

  // Modal / Add Form States
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [newServerName, setNewServerName] = useState("");
  const [newServerRole, setNewServerRole] = useState("Active Directory & DNS");
  const [newServerIp, setNewServerIp] = useState("192.168.1.10");
  const [newServerOs, setNewServerOs] = useState("Windows Server 2022");
  const [newServerServices, setNewServerServices] = useState("DNS, AD DS, NTP");

  const [isAddingVlan, setIsAddingVlan] = useState(false);
  const [newVlanId, setNewVlanId] = useState<number>(10);
  const [newVlanName, setNewVlanName] = useState("Management & Servers");
  const [newVlanSubnet, setNewVlanSubnet] = useState("192.168.1.0/24");
  const [newVlanGateway, setNewVlanGateway] = useState("192.168.1.1");
  const [newVlanDhcp, setNewVlanDhcp] = useState("192.168.1.100 - 192.168.1.200");
  const [newVlanPurpose, setNewVlanPurpose] = useState("Изолированная зона управления");

  const [isAddingLicense, setIsAddingLicense] = useState(false);
  const [newLicName, setNewLicName] = useState("Microsoft Windows Server CAL");
  const [newLicVendor, setNewLicVendor] = useState("Microsoft Corp");
  const [newLicType, setNewLicType] = useState("Per-User CAL");
  const [newLicUsed, setNewLicUsed] = useState(10);
  const [newLicTotal, setNewLicTotal] = useState(50);
  const [newLicExpires, setNewLicExpires] = useState("31.12.2026");

  // Load from PostgreSQL on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [dbTickets, dbServers, dbVlans, dbLicenses, dbMemos] = await Promise.all([
          dbService.getITTickets(),
          dbService.getITServers(),
          dbService.getITVLANs(),
          dbService.getITLicenses(),
          dbService.getServiceMemos()
        ]);

        if (dbTickets) setTickets(dbTickets);
        if (dbServers) setServers(dbServers);
        if (dbVlans) setVlans(dbVlans);
        if (dbLicenses) setLicenses(dbLicenses);
        if (dbMemos) setMemos(dbMemos);
      } catch (err) {
        console.error("Failed to load IT dashboard data from PostgreSQL:", err);
      } finally {
        setIsDbReady(true);
      }
    }
    loadData();
  }, []);

  const handleSaveMemos = async (updatedMemos: ServiceMemo[]) => {
    setMemos(updatedMemos);
    for (const m of updatedMemos) {
      await dbService.saveServiceMemo(m);
    }
    showToast("Данные служебных записок сохранены в PostgreSQL", "success");
    onAddAuditLog("СЭД Служебки", "info", `Обновлен реестр служебных записок (${updatedMemos.length} документов).`);
  };

  // Ticket filters & creation state
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>("ALL");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState<string>("ALL");
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDesc, setNewTicketDesc] = useState("");
  const [newTicketPriority, setNewTicketPriority] = useState<ITTicket["priority"]>("HIGH");
  const [newTicketCategory, setNewTicketCategory] = useState<ITTicket["category"]>("HARDWARE");
  const [newTicketAssignee, setNewTicketAssignee] = useState("Алексей Смирнов (Сисадмин)");
  const [newTicketRequester, setNewTicketRequester] = useState("");
  const [newTicketDept, setNewTicketDept] = useState("Склад");

  // Terminal state
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<Array<{ text: string; type: "input" | "output" | "error" | "success"; time: string }>>([
    { text: "Archon Enterprise IT Operations Terminal v3.4.1 (Ready)", type: "output", time: "00:00:00" },
    { text: "Type 'help' for diagnostic commands or click quick actions below.", type: "output", time: "00:00:01" }
  ]);
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);

  // Notifications
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "info" | "warning" } | null>(null);

  const showToast = (text: string, type: "success" | "info" | "warning" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("archon_it_tickets", JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem("archon_it_servers", JSON.stringify(servers));
  }, [servers]);

  useEffect(() => {
    localStorage.setItem("archon_it_vlans", JSON.stringify(vlans));
  }, [vlans]);

  useEffect(() => {
    localStorage.setItem("archon_it_licenses", JSON.stringify(licenses));
  }, [licenses]);

  // SLA and stats
  const totalTickets = (tickets || []).length;
  const inProgressTickets = (tickets || []).filter(t => t && (t.status === "IN_PROGRESS" || t.status === "NEW")).length;
  const resolvedTickets = (tickets || []).filter(t => t && (t.status === "RESOLVED" || t.status === "CLOSED")).length;
  const criticalTickets = (tickets || []).filter(t => t && t.priority === "CRITICAL" && (t.status === "NEW" || t.status === "IN_PROGRESS")).length;

  const onlineServers = (servers || []).filter(s => s && s.status === "ONLINE").length;
  const itDepartmentPcs = (computers || []).filter(c => 
    c && (
      (c.department && (c.department.toLowerCase().includes("it") || c.department.toLowerCase().includes("админ"))) ||
      (c.subdepartment && c.subdepartment.toLowerCase().includes("it"))
    )
  );

  // Urgent memos for manager (< 15 days)
  const urgentMemosCount = (memos || []).filter(m => {
    if (!m || m.status === "COMPLETED" || m.status === "REJECTED") return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [y, mo, d] = (m.deadlineDate || "").split("-").map(Number);
    const deadline = new Date(y, (mo || 1) - 1, d || 1);
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= (m.notifyDaysBefore || 15);
  }).length;

  // Reset IT Department Data
  const handleResetITDepartment = async () => {
    if (!window.confirm("Вы уверены, что хотите полностью обнулить данные Центра Управления IT-отдела (серверы, VLAN, лицензии, заявки и служебки)?")) {
      return;
    }

    try {
      // Execute SQL truncate for IT specific tables
      await dbService.executeSql(`
        TRUNCATE TABLE it_tickets, it_servers, it_vlans, it_licenses, service_memos CASCADE;
      `);

      setTickets([]);
      setServers([]);
      setVlans([]);
      setLicenses([]);
      setMemos([]);
      setTerminalLogs([
        { text: "Archon Enterprise IT Operations Terminal (Zeroed / Ready)", type: "output", time: new Date().toTimeString().split(" ")[0] }
      ]);

      // Clear local storage
      localStorage.removeItem("archon_it_tickets");
      localStorage.removeItem("archon_it_servers");
      localStorage.removeItem("archon_it_vlans");
      localStorage.removeItem("archon_it_licenses");
      localStorage.removeItem("archon_pg_tickets");
      localStorage.removeItem("archon_pg_servers");
      localStorage.removeItem("archon_pg_vlans");
      localStorage.removeItem("archon_pg_licenses");
      localStorage.removeItem("archon_pg_memos");

      showToast("Центр управления IT-отдела полностью обнулен", "warning");
      onAddAuditLog("Обнуление IT-Отдела", "warning", "Все серверы, тикеты, VLAN, лицензии и служебные записки очищены.");
    } catch (err: any) {
      showToast(`Ошибка обнуления: ${err.message}`, "warning");
    }
  };

  // Ping test simulation on a server
  const handlePingServer = (srv: ITServerNode) => {
    const randomLatency = (Math.random() * 1.5 + 0.4).toFixed(1);
    setServers(prev => prev.map(s => s.id === srv.id ? { ...s, pingMs: parseFloat(randomLatency) } : s));
    showToast(`ICMP Ping ${srv.ip} (${srv.name}): Ответ за ${randomLatency}ms [TTL=64]`, "success");
    onAddAuditLog("IT Ping тест", "info", `Выполнен ICMP Ping узла ${srv.name} (${srv.ip}), задержка ${randomLatency}ms.`);
  };

  // Service restart simulation
  const handleRestartService = (srv: ITServerNode, serviceName: string) => {
    showToast(`Перезапуск службы [${serviceName}] на сервере ${srv.name}...`, "info");
    setTimeout(() => {
      showToast(`Служба [${serviceName}] успешно перезапущена и работает стабильно!`, "success");
      onAddAuditLog("IT Перезапуск службы", "warning", `Служба ${serviceName} на сервере ${srv.name} (${srv.ip}) перезапущена.`);
    }, 1200);
  };

  // Create Server
  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim()) return;

    const newServer: ITServerNode = {
      id: `srv-${Date.now()}`,
      name: newServerName.trim(),
      role: newServerRole.trim(),
      ip: newServerIp.trim(),
      os: newServerOs.trim(),
      uptime: "99.98% (0d 12h)",
      cpuUsage: Math.floor(Math.random() * 20 + 10),
      ramUsage: Math.floor(Math.random() * 30 + 20),
      diskUsage: Math.floor(Math.random() * 40 + 25),
      pingMs: +(Math.random() * 1.2 + 0.5).toFixed(1),
      status: "ONLINE",
      ports: [80, 443, 22],
      services: newServerServices.split(",").map(s => s.trim()).filter(Boolean)
    };

    const updated = [newServer, ...servers];
    setServers(updated);
    await dbService.saveITServer(newServer);
    setIsAddingServer(false);
    setNewServerName("");
    showToast(`Сервер ${newServer.name} добавлен в мониторинг`, "success");
    onAddAuditLog("IT Серверы", "success", `Добавлен сервер ${newServer.name} (${newServer.ip}).`);
  };

  // Delete Server
  const handleDeleteServer = async (id: string, name: string) => {
    if (window.confirm(`Удалить сервер ${name} из инфраструктуры?`)) {
      setServers(prev => prev.filter(s => s.id !== id));
      await dbService.deleteITServer(id);
      showToast(`Сервер ${name} удален`, "warning");
      onAddAuditLog("IT Серверы", "warning", `Сервер ${name} удален из мониторинга.`);
    }
  };

  // Create VLAN
  const handleCreateVlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const newVlan: ITVLAN = {
      id: Number(newVlanId) || Date.now() % 4000,
      name: newVlanName.trim(),
      subnet: newVlanSubnet.trim(),
      gateway: newVlanGateway.trim(),
      dhcpScope: newVlanDhcp.trim(),
      activeHosts: Math.floor(Math.random() * 15 + 2),
      purpose: newVlanPurpose.trim(),
      color: "emerald"
    };

    const updated = [newVlan, ...vlans];
    setVlans(updated);
    await dbService.saveITVLAN(newVlan);
    setIsAddingVlan(false);
    showToast(`VLAN ${newVlan.id} (${newVlan.name}) сохранен в сети`, "success");
    onAddAuditLog("IT VLAN", "success", `Создан VLAN ${newVlan.id}: ${newVlan.subnet}`);
  };

  // Delete VLAN
  const handleDeleteVlan = async (id: number, name: string) => {
    if (window.confirm(`Удалить VLAN ${id} (${name})?`)) {
      setVlans(prev => prev.filter(v => v.id !== id));
      await dbService.deleteITVLAN(id);
      showToast(`VLAN ${id} удален`, "warning");
      onAddAuditLog("IT VLAN", "warning", `VLAN ${id} (${name}) удален.`);
    }
  };

  // Create License
  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    const newLic: ITLicense = {
      id: `lic-${Date.now()}`,
      name: newLicName.trim(),
      vendor: newLicVendor.trim(),
      type: newLicType.trim(),
      usedSeats: Number(newLicUsed) || 0,
      totalSeats: Number(newLicTotal) || 1,
      expiresAt: newLicExpires.trim() || "Бессрочно",
      status: "ACTIVE"
    };

    const updated = [newLic, ...licenses];
    setLicenses(updated);
    await dbService.saveITLicense(newLic);
    setIsAddingLicense(false);
    showToast(`Лицензия ${newLic.name} зарегистрирована`, "success");
    onAddAuditLog("IT Лицензии", "success", `Зарегистрирована лицензия ${newLic.name} (${newLic.vendor}).`);
  };

  // Delete License
  const handleDeleteLicense = async (id: string, name: string) => {
    if (window.confirm(`Удалить лицензию ${name}?`)) {
      setLicenses(prev => prev.filter(l => l.id !== id));
      await dbService.deleteITLicense(id);
      showToast(`Лицензия ${name} удалена`, "warning");
      onAddAuditLog("IT Лицензии", "warning", `Лицензия ${name} удалена.`);
    }
  };

  // Populate Default Enterprise IT Infrastructure
  const handlePopulateDefaultITInfrastructure = async () => {
    const demoServers: ITServerNode[] = [
      {
        id: `srv-dc-01`,
        name: "SRV-DC-01",
        role: "Active Directory, DNS, Kerberos & Group Policy",
        ip: "192.168.1.10",
        os: "Windows Server 2022 Datacenter",
        uptime: "99.99% (45d 14h)",
        cpuUsage: 14,
        ramUsage: 38,
        diskUsage: 28,
        pingMs: 0.6,
        status: "ONLINE",
        ports: [53, 88, 389, 445, 636],
        services: ["AD DS", "DNS Server", "Kerberos KDC", "W32Time"]
      },
      {
        id: `srv-app-1c`,
        name: "SRV-1C-ENTERPRISE",
        role: "Сервер приложений 1С:Предприятие 8.3 & PostgreSQL 16",
        ip: "192.168.1.20",
        os: "Ubuntu Server 24.04 LTS",
        uptime: "99.98% (18d 06h)",
        cpuUsage: 28,
        ramUsage: 54,
        diskUsage: 42,
        pingMs: 0.9,
        status: "ONLINE",
        ports: [1540, 1541, 5432, 22],
        services: ["ras", "ragent", "postgresql-16", "ssh"]
      },
      {
        id: `srv-nas-backup`,
        name: "SRV-STORAGE-NAS",
        role: "СХД, Корпоративные файловые шары & Резервное копирование",
        ip: "192.168.1.30",
        os: "TrueNAS SCALE 24.10",
        uptime: "100.0% (112d 20h)",
        cpuUsage: 8,
        ramUsage: 62,
        diskUsage: 35,
        pingMs: 0.7,
        status: "ONLINE",
        ports: [445, 2049, 8080, 22],
        services: ["ZFS Pool (RAID-Z2)", "Samba CIFS", "NFS v4", "Bacula / Veeam Target"]
      },
      {
        id: `srv-gw-router`,
        name: "GW-CORE-ROUTER",
        role: "Межсетевой экран, VPN-шлюз (WireGuard / IPSec) & DHCP",
        ip: "192.168.1.1",
        os: "OPNsense / RouterOS v7.14",
        uptime: "99.99% (94d 11h)",
        cpuUsage: 11,
        ramUsage: 22,
        diskUsage: 15,
        pingMs: 0.4,
        status: "ONLINE",
        ports: [80, 443, 500, 4500, 51820],
        services: ["Suricata IDS/IPS", "WireGuard VPN", "Kea DHCP", "Unbound DNS"]
      }
    ];

    const demoVlans: ITVLAN[] = [
      {
        id: 10,
        name: "Управление & Серверная зона",
        subnet: "192.168.1.0/24",
        gateway: "192.168.1.1",
        dhcpScope: "192.168.1.100 - 192.168.1.200",
        activeHosts: 12,
        purpose: "Критически важные серверы, контроллеры домена и СХД",
        color: "blue"
      },
      {
        id: 20,
        name: "Рабочие места сотрудников (Офис)",
        subnet: "192.168.20.0/24",
        gateway: "192.168.20.1",
        dhcpScope: "192.168.20.50 - 192.168.20.220",
        activeHosts: 28,
        purpose: "Персональные компьютеры, ноутбуки и моноблоки отделов",
        color: "emerald"
      },
      {
        id: 30,
        name: "Склад & Оргтехника (Принтеры/Весы)",
        subnet: "192.168.30.0/24",
        gateway: "192.168.30.1",
        dhcpScope: "192.168.30.50 - 192.168.30.150",
        activeHosts: 14,
        purpose: "Сетевые МФУ, терминалы сбора данных и весовое оборудование",
        color: "amber"
      },
      {
        id: 40,
        name: "Видеонаблюдение & СКУД",
        subnet: "192.168.40.0/24",
        gateway: "192.168.40.1",
        dhcpScope: "192.168.40.10 - 192.168.40.100",
        activeHosts: 18,
        purpose: "IP-камеры, регистраторы NVR и контроллеры турникетов",
        color: "indigo"
      },
      {
        id: 99,
        name: "Гостевой Wi-Fi (Изолированная зона)",
        subnet: "172.16.99.0/24",
        gateway: "172.16.99.1",
        dhcpScope: "172.16.99.10 - 172.16.99.250",
        activeHosts: 8,
        purpose: "Гостевой доступ в интернет с изоляцией клиентов",
        color: "rose"
      }
    ];

    const demoLicenses: ITLicense[] = [
      {
        id: `lic-ms-ws`,
        name: "Microsoft Windows Server 2022 Datacenter",
        vendor: "Microsoft Corporation",
        type: "Per-Core OEM (16 Cores)",
        usedSeats: 1,
        totalSeats: 2,
        expiresAt: "Бессрочно (Volume License)",
        status: "ACTIVE"
      },
      {
        id: `lic-1c-srv`,
        name: "1С:Предприятие 8.3 — Лицензия на сервер (x86-64)",
        vendor: "Фирма 1С",
        type: "Электронная привязка ПАК",
        usedSeats: 1,
        totalSeats: 1,
        expiresAt: "Бессрочно",
        status: "ACTIVE"
      },
      {
        id: `lic-kaspersky`,
        name: "Kaspersky Endpoint Security for Business",
        vendor: "АО Лаборатория Касперского",
        type: "Корпоративная подписка на узлы",
        usedSeats: 34,
        totalSeats: 50,
        expiresAt: "31.12.2026",
        status: "ACTIVE"
      },
      {
        id: `lic-ssl-wildcard`,
        name: "Wildcard SSL Certificate (*.archon.corp)",
        vendor: "Let's Encrypt / Sectigo",
        type: "TLS/HTTPS Encryption",
        usedSeats: 1,
        totalSeats: 1,
        expiresAt: "15.11.2026",
        status: "ACTIVE"
      }
    ];

    try {
      for (const s of demoServers) await dbService.saveITServer(s);
      for (const v of demoVlans) await dbService.saveITVLAN(v);
      for (const l of demoLicenses) await dbService.saveITLicense(l);

      setServers(demoServers);
      setVlans(demoVlans);
      setLicenses(demoLicenses);

      showToast("Типовая IT-инфраструктура успешно создана и сохранена в PostgreSQL!", "success");
      onAddAuditLog("IT Инфраструктура", "success", "Развернута типовая инфраструктура: 4 сервера, 5 VLAN, 4 лицензии.");
    } catch (err: any) {
      showToast(`Ошибка сохранения инфраструктуры: ${err.message}`, "warning");
    }
  };

  // Handle create ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle.trim()) return;

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth()+1).toString().padStart(2, '0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newTicket: ITTicket = {
      id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newTicketTitle,
      description: newTicketDesc || "Описание не указано",
      priority: newTicketPriority,
      status: "NEW",
      category: newTicketCategory,
      assignee: newTicketAssignee,
      requester: newTicketRequester || currentUserName,
      department: newTicketDept,
      createdAt: formattedDate,
      updatedAt: formattedDate
    };

    setTickets([newTicket, ...tickets]);
    await dbService.saveITTicket(newTicket);
    setIsAddingTicket(false);
    setNewTicketTitle("");
    setNewTicketDesc("");
    setNewTicketRequester("");
    showToast(`Заявка ${newTicket.id} успешно сохранена в PostgreSQL!`, "success");
    onAddAuditLog("IT Helpdesk", "info", `Создана заявка ${newTicket.id}: "${newTicket.title}" [${newTicket.priority}] для ${newTicket.assignee}.`);
  };

  // Handle ticket status change
  const handleStatusChange = async (ticketId: string, newStatus: ITTicket["status"]) => {
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth()+1).toString().padStart(2, '0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    let updatedTicket: ITTicket | null = null;
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        updatedTicket = { ...t, status: newStatus, updatedAt: formattedDate };
        return updatedTicket;
      }
      return t;
    }));

    if (updatedTicket) {
      await dbService.saveITTicket(updatedTicket);
    }

    showToast(`Статус заявки ${ticketId} изменен на: ${newStatus}`, "info");
    onAddAuditLog("IT Helpdesk", "info", `Заявка ${ticketId} переведена в статус ${newStatus}.`);
  };

  // Delete ticket
  const handleDeleteTicket = async (ticketId: string) => {
    if (window.confirm(`Удалить заявку ${ticketId} из базы данных PostgreSQL?`)) {
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      await dbService.deleteITTicket(ticketId);
      showToast(`Заявка ${ticketId} удалена из PostgreSQL`, "warning");
      onAddAuditLog("IT Helpdesk", "warning", `Заявка ${ticketId} удалена из очереди.`);
    }
  };

  // Filtered tickets
  const filteredTickets = (tickets || []).filter(t => {
    if (!t) return false;
    const s = (ticketSearch || "").toLowerCase();
    const matchesSearch =
      (t.title || "").toLowerCase().includes(s) ||
      (t.id || "").toLowerCase().includes(s) ||
      (t.assignee || "").toLowerCase().includes(s) ||
      (t.requester || "").toLowerCase().includes(s);
    
    const matchesStatus = ticketStatusFilter === "ALL" || t.status === ticketStatusFilter;
    const matchesPriority = ticketPriorityFilter === "ALL" || t.priority === ticketPriorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Terminal command execution
  const executeTerminalCommand = async (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    const time = new Date().toTimeString().split(" ")[0];
    const newLogs = [...terminalLogs, { text: `$ ${trimmed}`, type: "input" as const, time }];
    setIsExecutingCommand(true);

    const lower = trimmed.toLowerCase();
    let responseLogs: Array<{ text: string; type: "output" | "error" | "success"; time: string }> = [];

    if (lower === "help") {
      responseLogs = [
        { text: "Доступные команды IT-диагностики:", type: "output", time },
        { text: "  ping <ip|host>       - проверка доступности узла по протоколу ICMP", type: "output", time },
        { text: "  traceroute <ip|host> - трассировка сетевого маршрута до узла", type: "output", time },
        { text: "  wol <mac-address>    - отправка Magic Packet (Wake-on-LAN)", type: "output", time },
        { text: "  nslookup <domain>    - проверка DNS разрешения имен", type: "output", time },
        { text: "  uptime               - время непрерывной работы IT-инфраструктуры", type: "output", time },
        { text: "  servers              - вывод текущего статуса серверной стойки", type: "output", time },
        { text: "  sql <query>          - выполнить прямой SQL запрос к PostgreSQL базе данных", type: "output", time },
        { text: "  clear                - очистить вывод терминала", type: "output", time }
      ];
    } else if (lower === "clear") {
      setTerminalLogs([]);
      setIsExecutingCommand(false);
      setTerminalInput("");
      return;
    } else if (lower.startsWith("sql ")) {
      const queryStr = trimmed.slice(4).trim();
      try {
        const res = await dbService.executeSql(queryStr);
        if (res && res.rows && res.rows.length > 0) {
          const header = res.columns.join(" | ");
          const rows = res.rows.slice(0, 10).map(r => Object.values(r).join(" | "));
          responseLogs = [
            { text: `[PostgreSQL] Query: ${queryStr}`, type: "output", time },
            { text: `COLUMNS: ${header}`, type: "output", time },
            ...rows.map(r => ({ text: `  -> ${r}`, type: "success" as const, time })),
            { text: `Returned ${res.rowCount} rows in ${res.durationMs}ms (showing up to 10)`, type: "output", time }
          ];
        } else {
          responseLogs = [
            { text: `[PostgreSQL] SQL Query executed successfully (${res?.rowCount || 0} rows affected, ${res?.durationMs || 0}ms).`, type: "success", time }
          ];
        }
      } catch (e: any) {
        responseLogs = [
          { text: `[PostgreSQL Error] ${e.message}`, type: "error", time }
        ];
      }
    } else if (lower.startsWith("ping")) {
      const target = trimmed.split(" ")[1] || "192.168.1.1";
      responseLogs = [
        { text: `PING ${target} 56(84) bytes of data.`, type: "output", time },
        { text: `64 bytes from ${target}: icmp_seq=1 ttl=64 time=0.82 ms`, type: "success", time },
        { text: `64 bytes from ${target}: icmp_seq=2 ttl=64 time=0.74 ms`, type: "success", time },
        { text: `--- ${target} ping statistics: 2 packets transmitted, 2 received, 0% packet loss ---`, type: "output", time }
      ];
    } else if (lower.startsWith("traceroute")) {
      const target = trimmed.split(" ")[1] || "8.8.8.8";
      responseLogs = [
        { text: `traceroute to ${target} (30 hops max, 60 byte packets)`, type: "output", time },
        { text: " 1  192.168.1.1 (gateway-core)  0.452 ms", type: "output", time },
        { text: ` 2  ${target}  4.850 ms [TARGET REACHED]`, type: "success", time }
      ];
    } else if (lower.startsWith("wol")) {
      const mac = trimmed.split(" ")[1] || "30:95:E3:42:C8:4B";
      responseLogs = [
        { text: `[Wake-on-LAN] Broadcasting Magic Packet to 255.255.255.255:9 for MAC ${mac}...`, type: "output", time },
        { text: `[WOL SUCCESS] Magic Packet delivered across VLANs. Target hardware waking up.`, type: "success", time }
      ];
    } else if (lower.startsWith("nslookup")) {
      const domain = trimmed.split(" ")[1] || "archon.corp";
      responseLogs = [
        { text: `Server:   127.0.0.1 (Local DNS Resolver)`, type: "output", time },
        { text: `Name:     ${domain}`, type: "output", time },
        { text: `Address:  192.168.1.10`, type: "success", time }
      ];
    } else if (lower === "uptime") {
      responseLogs = [
        { text: `Core IT Infrastructure Status: ${servers.length} servers configured, ${tickets.length} tickets recorded.`, type: "success", time }
      ];
    } else if (lower === "servers") {
      if (servers.length === 0) {
        responseLogs = [
          { text: "Внимание: Серверные узлы не добавлены. Добавьте сервер во вкладке «Серверы & Топология VLAN».", type: "output", time }
        ];
      } else {
        responseLogs = servers.map(s => ({
          text: `[${s.status}] ${(s.name || "").padEnd(20)} ${(s.ip || "").padEnd(16)} CPU: ${s.cpuUsage}% RAM: ${s.ramUsage}% Ping: ${s.pingMs}ms`,
          type: s.status === "ONLINE" ? "success" as const : "error" as const,
          time
        }));
      }
    } else {
      responseLogs = [
        { text: `bash: ${trimmed}: command not found. Type 'help' for diagnostic commands.`, type: "error", time }
      ];
    }

    setTerminalLogs([...newLogs, ...responseLogs]);
    setIsExecutingCommand(false);
    setTerminalInput("");
  };

  return (
    <div id="it_department_root" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-100 space-y-6">
      
      {/* Toast popup */}
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 animate-slide-in ${
          toastMsg.type === "success" ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10" :
          toastMsg.type === "warning" ? "bg-amber-950/90 text-amber-300 border-amber-500/40 shadow-amber-500/10" :
          "bg-indigo-950/90 text-indigo-300 border-indigo-500/40 shadow-indigo-500/10"
        }`}>
          <Zap className="h-4 w-4 shrink-0 text-amber-400" />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Laptop className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white font-display">
                  Центр Управления IT-Отдела
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                  ENTERPRISE IT OPS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Мониторинг инфраструктуры, серверов, сетевой топологии VLAN, заявок Helpdesk и рабочих мест IT-специалистов.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {servers.length > 0 && (
            <button
              onClick={() => {
                showToast("Запущен полный опрос телеметрии серверов и коммутаторов...", "info");
                setTimeout(() => {
                  setServers(prev => prev.map(s => ({
                    ...s,
                    pingMs: +(Math.random() * 1.2 + 0.4).toFixed(1),
                    cpuUsage: Math.floor(Math.random() * 25 + 10)
                  })));
                  showToast("Все узлы ответили в пределах SLA", "success");
                }, 800);
              }}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5 text-blue-400" /> Проверить узлы ({servers.length})
            </button>
          )}

          {currentUserRole === UserRole.ADMIN && (
            <button
              onClick={handleResetITDepartment}
              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Обнулить все данные IT-отдела"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Обнулить Центр IT
            </button>
          )}

          {onNavigateToComputers && (
            <button
              onClick={() => onNavigateToComputers("Администрация")}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/20"
            >
              <Users className="h-3.5 w-3.5" /> ПК IT-отдела ({itDepartmentPcs.length})
            </button>
          )}
        </div>
      </div>

      {/* Key Metric Bar / Bento Top Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Серверы в сети</span>
            <Server className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{onlineServers}/{servers.length}</span>
            <span className={`text-[10px] font-bold font-mono ${servers.length > 0 ? "text-emerald-400" : "text-slate-500"}`}>
              {servers.length > 0 ? `${Math.round((onlineServers / servers.length) * 100)}% ONLINE` : "0% ONLINE"}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">
            {servers.length > 0 ? `Узлов в мониторинге: ${servers.length}` : "Серверные узлы не добавлены"}
          </span>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Helpdesk заявки</span>
            <LifeBuoy className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-400 font-mono">{inProgressTickets}</span>
            <span className="text-[10px] text-slate-400 font-mono">в работе / {totalTickets} всего</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
            {criticalTickets > 0 ? (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {criticalTickets} критических!
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Очередь инцидентов под контролем
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Внешний канал (ISP)</span>
            <Network className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-400 font-mono">{servers.length > 0 ? "100" : "0"}</span>
            <span className="text-xs text-slate-400 font-mono">{servers.length > 0 ? "/ 500 Мбит/с" : "/ 0 Мбит/с"}</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">
            {servers.length > 0 ? "Канал активен" : "Ожидание подключения шлюза"}
          </span>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Лицензии & SSL</span>
            <ShieldCheck className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">{licenses.length}</span>
            <span className="text-[10px] text-slate-400 font-mono">активных записей</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Сертификаты и ПО</span>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center overflow-x-auto bg-slate-950 p-1 rounded-2xl border border-slate-850 gap-1 scrollbar-none">
        {[
          { id: "overview", label: "Обзор & Метрики", icon: Activity },
          { id: "parsing", label: "Парсинг & TigerVNC", icon: Zap },
          { id: "memos", label: `Папка служебок & Файлы ${urgentMemosCount > 0 ? `(🔥 ${urgentMemosCount})` : `(${memos.length})`}`, icon: FileText },
          { id: "infrastructure", label: `Серверы & Топология VLAN (${servers.length}/${vlans.length})`, icon: Server },
          { id: "tickets", label: `Заявки Helpdesk (${inProgressTickets})`, icon: LifeBuoy },
          { id: "licenses", label: `Лицензии & SSL (${licenses.length})`, icon: ShieldCheck },
          { id: "terminal", label: "Диагностический Терминал", icon: TerminalIcon }
        ].map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <TabIcon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-500"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: PARSING & REMOTE AUTOMATION (TigerVNC Suite) */}
      {activeTab === "parsing" && (
        <ITRemoteAutomationParser
          computers={computers}
          onAddAuditLog={onAddAuditLog}
        />
      )}

      {/* TAB: SERVICE MEMOS FOLDER (СЭД & ФАЙЛЫ) */}
      {activeTab === "memos" && (
        <div className="animate-fade-in">
          <ServiceMemosFolder
            memos={memos}
            onSaveMemos={handleSaveMemos}
            currentUserRole={currentUserRole}
            currentOperatorName={currentUserName}
          />
        </div>
      )}

      {/* TAB 1: OVERVIEW & SLA */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* TigerVNC & Parsing Highlight Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 rounded-2xl border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-blue-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 border border-blue-500/40 rounded-xl text-blue-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span>Парсинг & Удаленная автоматизация TigerVNC</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-500/30">
                    [eset, root, admin]
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Централизованная смена паролей администратора на {computers.length} офисных ПК по локальной сети без физического обхода кабинетов.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("parsing")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 shrink-0 cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" /> Открыть Парсинг & Ротацию
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Real-time Infrastructure Health Map */}
            <div className="lg:col-span-2 bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Мониторинг ключевых сервисов предприятия</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                  SLA: {servers.length > 0 ? "99.98%" : "100%"}
                </span>
              </div>

              {servers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {servers.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 hover:border-slate-800 transition-all flex items-center justify-between">
                      <div className="space-y-0.5">
                        <strong className="text-xs text-white block">{item.name}</strong>
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                          <span>IP: {item.ip}</span>
                          <span>•</span>
                          <span className="text-indigo-300">{item.cpuUsage}% CPU</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {item.pingMs} ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-slate-500 space-y-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 w-fit mx-auto">
                    <Server className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-300">Серверные узлы еще не добавлены</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Вы можете создать собственный сервер вручную или заполнить готовую типовую IT-инфраструктуру (AD, 1C, СХД, шлюз, VLAN и лицензии) в 1 клик.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 pt-2 flex-wrap">
                    <button
                      onClick={() => {
                        setActiveTab("infrastructure");
                        setIsAddingServer(true);
                      }}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                    >
                      <Plus className="h-3.5 w-3.5" /> Добавить сервер вручную
                    </button>
                    <button
                      onClick={handlePopulateDefaultITInfrastructure}
                      className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-transparent rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-400" /> Заполнить типовой IT-инфраструктурой
                    </button>
                  </div>
                </div>
              )}

              {/* Server Room Environmental Telemetry */}
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-850 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium">Климат-контроль стойки:</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-slate-500">Статус:</span>
                    <strong className={servers.length > 0 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {servers.length > 0 ? "21.4°C (Норма)" : "Режим ожидания"}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-slate-500">ИБП (UPS):</span>
                    <strong className={servers.length > 0 ? "text-emerald-400 font-bold" : "text-emerald-400 font-bold"}>
                      {servers.length > 0 ? "100% (45 мин)" : "Готов (100%)"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick IT Helpdesk & Service Memos Summary */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">СЭД & Служебные записки</h3>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-mono font-bold">{memos.length} в реестре</span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-300 block">Требуют внимания (срочные)</span>
                      <span className="text-[10px] text-slate-500 font-mono">Срок &le; 15 дней</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${urgentMemosCount > 0 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-emerald-500/10 text-emerald-400"}`}>
                      {urgentMemosCount} док.
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-300 block">Helpdesk заявки в работе</span>
                      <span className="text-[10px] text-slate-500 font-mono">Текущая очередь</span>
                    </div>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {inProgressTickets} активных
                    </span>
                  </div>
                </div>
              </div>

              {/* Fast Jump buttons */}
              <div className="pt-2 border-t border-slate-850 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTab("memos")}
                  className="py-2 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <FileText className="h-3.5 w-3.5 text-indigo-400" /> Служебки ({memos.length})
                </button>
                <button
                  onClick={() => setActiveTab("tickets")}
                  className="py-2 px-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-transparent rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <LifeBuoy className="h-3.5 w-3.5" /> Заявки ({inProgressTickets})
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: SERVERS & TOPOLOGY (INFRASTRUCTURE) */}
      {activeTab === "infrastructure" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Server Nodes Section */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-850 gap-2">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Серверные узлы & Сетевое оборудование</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Узлов: {servers.length} шт.</span>
                <button
                  onClick={() => setIsAddingServer(!isAddingServer)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Добавить сервер
                </button>
              </div>
            </div>

            {/* Add Server Form */}
            {isAddingServer && (
              <form onSubmit={handleCreateServer} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs animate-fade-in">
                <div>
                  <label className="block text-slate-400 mb-1">Имя сервера / хоста:</label>
                  <input
                    type="text"
                    required
                    placeholder="SRV-DC-01"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Роль / Назначение:</label>
                  <input
                    type="text"
                    required
                    placeholder="Active Directory & DNS"
                    value={newServerRole}
                    onChange={(e) => setNewServerRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">IP-Адрес:</label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.1.10"
                    value={newServerIp}
                    onChange={(e) => setNewServerIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">ОС / Платформа:</label>
                  <input
                    type="text"
                    placeholder="Windows Server 2022 / Ubuntu 24.04"
                    value={newServerOs}
                    onChange={(e) => setNewServerOs(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Службы (через запятую):</label>
                  <input
                    type="text"
                    placeholder="DNS, AD DS, NTP, DHCP"
                    value={newServerServices}
                    onChange={(e) => setNewServerServices(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingServer(false)}
                    className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Сохранить сервер
                  </button>
                </div>
              </form>
            )}

            {servers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {servers.map((srv) => (
                  <div key={srv.id} className="bg-slate-900/70 p-4 rounded-2xl border border-slate-850 hover:border-slate-800 transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-sm font-mono font-bold text-white">{srv.name}</strong>
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5 leading-snug">{srv.role}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono text-[10px] font-bold">
                          {srv.pingMs} ms
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-900">
                        <div>
                          <span className="text-[10px] text-slate-500 block">IP Адрес:</span>
                          <strong className="text-blue-400">{srv.ip}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Uptime:</span>
                          <span className="text-slate-300">{srv.uptime}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">CPU:</span>
                          <span className="text-slate-300">{srv.cpuUsage}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">RAM:</span>
                          <span className="text-slate-300">{srv.ramUsage}%</span>
                        </div>
                      </div>

                      {/* Services Chips */}
                      {srv.services && srv.services.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono block">Службы:</span>
                          <div className="flex flex-wrap gap-1">
                            {srv.services.map((svc, i) => (
                              <span key={i} className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60 font-mono">
                                {svc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions for server */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePingServer(srv)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Radio className="h-3 w-3 text-blue-400" /> Ping
                        </button>
                        <button
                          onClick={() => handleRestartService(srv, srv.services?.[0] || "Core Service")}
                          className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="h-3 w-3" /> Рестарт
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteServer(srv.id, srv.name)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Удалить сервер"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-slate-500 space-y-3">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 w-fit mx-auto">
                  <Server className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-300">Список серверов пуст</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Добавьте серверные мощности предприятия вручную или сгенерируйте типовую корпоративную конфигурацию.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2.5 pt-1 flex-wrap">
                  <button
                    onClick={() => setIsAddingServer(true)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" /> Добавить первый сервер
                  </button>
                  <button
                    onClick={handlePopulateDefaultITInfrastructure}
                    className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-transparent rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-400" /> Заполнить типовой IT-инфраструктурой
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* VLAN Topology Section */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Сегментация сети (Корпоративные VLANs)</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Зон: {vlans.length}</span>
                <button
                  onClick={() => setIsAddingVlan(!isAddingVlan)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Добавить VLAN
                </button>
              </div>
            </div>

            {/* Add VLAN Form */}
            {isAddingVlan && (
              <form onSubmit={handleCreateVlan} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs animate-fade-in">
                <div>
                  <label className="block text-slate-400 mb-1">Номер VLAN ID:</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={4094}
                    value={newVlanId}
                    onChange={(e) => setNewVlanId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Название сегмента:</label>
                  <input
                    type="text"
                    required
                    placeholder="Warehouse & Scale Network"
                    value={newVlanName}
                    onChange={(e) => setNewVlanName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Подсеть CIDR:</label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.20.0/24"
                    value={newVlanSubnet}
                    onChange={(e) => setNewVlanSubnet(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Шлюз (Gateway IP):</label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.20.1"
                    value={newVlanGateway}
                    onChange={(e) => setNewVlanGateway(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Назначение / Описание зоны:</label>
                  <input
                    type="text"
                    placeholder="Изолированный сегмент весового оборудования"
                    value={newVlanPurpose}
                    onChange={(e) => setNewVlanPurpose(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingVlan(false)}
                    className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Создать VLAN
                  </button>
                </div>
              </form>
            )}

            {vlans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {vlans.map((vlan) => (
                  <div key={vlan.id} className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-850 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono">VLAN {vlan.id}: {vlan.name}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                          {vlan.activeHosts} хостов
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 space-y-0.5 mt-2">
                        <div>Подсеть: <strong className="text-slate-200">{vlan.subnet}</strong></div>
                        <div>Шлюз: <span className="text-emerald-400">{vlan.gateway}</span></div>
                        <div className="text-[10px] text-slate-500 mt-1">{vlan.dhcpScope}</div>
                      </div>
                      <p className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 mt-2">{vlan.purpose}</p>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleDeleteVlan(vlan.id, vlan.name)}
                        className="p-1 bg-slate-850 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Удалить VLAN"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 text-slate-500 space-y-2">
                <Network className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-400">VLAN сегменты не настроены</p>
                <p className="text-[11px] text-slate-500">Добавьте сетевые сегменты для визуализации топологии.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: HELPDESK TICKETS */}
      {activeTab === "tickets" && (
        <div className="space-y-5 animate-fade-in">
          
          {/* Ticket Header & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-850">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Поиск инцидента, сотрудника, темы..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs">
                {[
                  { id: "ALL", label: "Все" },
                  { id: "NEW", label: "Новые" },
                  { id: "IN_PROGRESS", label: "В работе" },
                  { id: "RESOLVED", label: "Решено" }
                ].map(b => (
                  <button
                    key={b.id}
                    onClick={() => setTicketStatusFilter(b.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      ticketStatusFilter === b.id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsAddingTicket(!isAddingTicket)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" /> Зарегистрировать инцидент
            </button>
          </div>

          {/* New Ticket Form Modal/Drawer */}
          {isAddingTicket && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 animate-fade-in">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <LifeBuoy className="h-4 w-4 text-blue-400" />
                Регистрация Новой Заявки / Инцидента IT-службы
              </h3>

              <form onSubmit={handleCreateTicket} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Краткая суть проблемы / инцидента:</label>
                  <input
                    type="text"
                    required
                    placeholder="Например: Не печатает принтер HP на весовой станции..."
                    value={newTicketTitle}
                    onChange={(e) => setNewTicketTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Приоритет инцидента:</label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="LOW">Низкий (LOW)</option>
                    <option value="MEDIUM">Средний (MEDIUM)</option>
                    <option value="HIGH">Высокий (HIGH)</option>
                    <option value="CRITICAL">Критический (CRITICAL - авария)</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-slate-400 mb-1">Подробное описание и шаги воспроизведения:</label>
                  <textarea
                    rows={3}
                    placeholder="Укажите номер ПК, IP-адрес, код ошибки или текст на экране..."
                    value={newTicketDesc}
                    onChange={(e) => setNewTicketDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Категория:</label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="HARDWARE">Оборудование / ПК / Весы</option>
                    <option value="PRINTER">Принтеры & Картриджи</option>
                    <option value="NETWORK">Сеть / Wi-Fi / VPN</option>
                    <option value="ACCOUNT">Учетная запись / Доступ / 1С</option>
                    <option value="SOFTWARE">ПО & Драйверы</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Назначить IT-специалиста:</label>
                  <select
                    value={newTicketAssignee}
                    onChange={(e) => setNewTicketAssignee(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {initialUsers.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Заявитель / Инициатор:</label>
                  <input
                    type="text"
                    placeholder="ФИО сотрудника или отдел"
                    value={newTicketRequester}
                    onChange={(e) => setNewTicketRequester(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingTicket(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl font-bold text-slate-300 cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    Создать заявку
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tickets List */}
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-slate-950 p-4 rounded-2xl border border-slate-850 hover:border-slate-800 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {ticket.id}
                    </span>

                    {/* Priority Badge */}
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      ticket.priority === "CRITICAL" ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse" :
                      ticket.priority === "HIGH" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                      ticket.priority === "MEDIUM" ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" :
                      "bg-slate-800 text-slate-400"
                    }`}>
                      {ticket.priority}
                    </span>

                    {/* Category */}
                    <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono">
                      {ticket.category}
                    </span>

                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-[11px] text-slate-400 font-mono">{ticket.createdAt}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-tight">{ticket.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{ticket.description}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1 font-mono">
                    <span>Заявитель: <strong className="text-slate-300">{ticket.requester}</strong> ({ticket.department})</span>
                    <span>•</span>
                    <span>Исполнитель IT: <strong className="text-indigo-300">{ticket.assignee}</strong></span>
                  </div>
                </div>

                {/* Status selector & Actions */}
                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket.id, e.target.value as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer ${
                      ticket.status === "NEW" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      ticket.status === "IN_PROGRESS" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      ticket.status === "RESOLVED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    <option value="NEW">🆕 Новая</option>
                    <option value="IN_PROGRESS">⏳ В работе</option>
                    <option value="RESOLVED">✅ Решено</option>
                    <option value="CLOSED">🔒 Закрыто</option>
                  </select>

                  <button
                    onClick={() => handleDeleteTicket(ticket.id)}
                    className="p-2 bg-slate-900 hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 rounded-xl transition-colors cursor-pointer"
                    title="Удалить заявку"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {filteredTickets.length === 0 && (
              <div className="bg-slate-950 p-10 rounded-2xl border border-slate-850 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-300">Нет активных заявок по заданным фильтрам</p>
                <p className="text-xs text-slate-500">Все сервисы функционируют штатно, очередь Helpdesk пуста.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 4: LICENSES, SSL & BACKUPS */}
      {activeTab === "licenses" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Licenses Section */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Реестр корпоративных лицензий и SSL-сертификатов</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Лицензий: {licenses.length}</span>
                <button
                  onClick={() => setIsAddingLicense(!isAddingLicense)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Добавить лицензию
                </button>
              </div>
            </div>

            {/* Add License Form */}
            {isAddingLicense && (
              <form onSubmit={handleCreateLicense} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs animate-fade-in">
                <div>
                  <label className="block text-slate-400 mb-1">Название лицензии / сертификата:</label>
                  <input
                    type="text"
                    required
                    placeholder="Microsoft Windows Server 2022 CAL"
                    value={newLicName}
                    onChange={(e) => setNewLicName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Вендор / Поставщик:</label>
                  <input
                    type="text"
                    required
                    placeholder="Microsoft / 1С / Let's Encrypt"
                    value={newLicVendor}
                    onChange={(e) => setNewLicVendor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Срок действия:</label>
                  <input
                    type="text"
                    placeholder="31.12.2026 или Бессрочно"
                    value={newLicExpires}
                    onChange={(e) => setNewLicExpires(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Тип лицензирования:</label>
                  <input
                    type="text"
                    placeholder="Per-Core / User CAL / SSL Wildcard"
                    value={newLicType}
                    onChange={(e) => setNewLicType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Использовано мест:</label>
                  <input
                    type="number"
                    min={0}
                    value={newLicUsed}
                    onChange={(e) => setNewLicUsed(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Всего доступно мест:</label>
                  <input
                    type="number"
                    min={1}
                    value={newLicTotal}
                    onChange={(e) => setNewLicTotal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingLicense(false)}
                    className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Сохранить лицензию
                  </button>
                </div>
              </form>
            )}

            {licenses.length > 0 ? (
              <div className="space-y-2.5">
                {licenses.map((lic) => (
                  <div key={lic.id} className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-sm">{lic.name}</strong>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                          lic.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                        }`}>
                          {lic.status === "ACTIVE" ? "АКТИВНА" : "ТРЕБУЕТ ПРОДЛЕНИЯ"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1 font-mono">
                        <span>Вендор: <strong className="text-slate-300">{lic.vendor}</strong></span>
                        <span>Тип: <span className="text-slate-300">{lic.type}</span></span>
                        <span>Действует до: <strong className="text-indigo-300">{lic.expiresAt}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono text-xs">
                        <span className="text-slate-400 block text-[10px]">Занято лицензий:</span>
                        <strong className="text-white">{lic.usedSeats} / {lic.totalSeats} CAL</strong>
                      </div>
                      <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, (lic.usedSeats / (lic.totalSeats || 1)) * 100)}%` }}
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteLicense(lic.id, lic.name)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Удалить лицензию"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 text-slate-500 space-y-2">
                <Key className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-400">Реестр лицензий пуст</p>
                <p className="text-[11px] text-slate-500">Добавьте используемые корпоративные лицензии и SSL-сертификаты.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 6: DIAGNOSTIC TERMINAL */}
      {activeTab === "terminal" && (
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4 animate-fade-in font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-slate-850">
            <div className="flex items-center gap-2">
              <TerminalIcon className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Интерактивный Терминал IT-Инженера</h3>
            </div>
            <span className="text-[10px] text-slate-500">archon-it-ops @ gateway-core</span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-[10px] text-slate-500 self-center uppercase tracking-wider">Быстрые тесты:</span>
            {[
              "ping 192.168.1.1",
              "ping 192.168.1.50",
              "traceroute 8.8.8.8",
              "wol 30:95:E3:42:C8:4B",
              "nslookup archon.corp",
              "uptime",
              "servers",
              "clear"
            ].map(cmd => (
              <button
                key={cmd}
                onClick={() => executeTerminalCommand(cmd)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-blue-300 border border-slate-800 hover:border-blue-500/30 rounded-lg text-[11px] transition-all cursor-pointer"
              >
                ${cmd}
              </button>
            ))}
          </div>

          {/* Terminal Screen */}
          <div className="bg-black/90 p-4 rounded-xl border border-slate-800 h-80 overflow-y-auto space-y-1.5 text-xs text-slate-200 scrollbar-thin">
            {(terminalLogs || []).filter(Boolean).map((log, idx) => (
              <div
                key={idx}
                className={`leading-relaxed ${
                  log?.type === "input" ? "text-amber-400 font-bold" :
                  log?.type === "success" ? "text-emerald-400" :
                  log?.type === "error" ? "text-rose-400" :
                  "text-slate-300"
                }`}
              >
                <span className="text-slate-600 select-none mr-2">[{log?.time || ""}]</span>
                <span>{log?.text || ""}</span>
              </div>
            ))}
            {isExecutingCommand && (
              <div className="text-blue-400 animate-pulse flex items-center gap-2">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Выполнение команды...</span>
              </div>
            )}
          </div>

          {/* Terminal Input Line */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeTerminalCommand(terminalInput);
            }}
            className="flex items-center gap-2"
          >
            <span className="text-emerald-400 font-bold select-none text-sm">$</span>
            <input
              type="text"
              placeholder="Введите команду (например: ping 192.168.1.1, help, traceroute, sql SELECT * FROM it_servers)..."
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
            <button
              type="submit"
              disabled={!terminalInput.trim() || isExecutingCommand}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-sans"
            >
              <Send className="h-3.5 w-3.5" /> Выполнить
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
