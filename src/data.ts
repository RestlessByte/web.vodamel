import { 
  Computer, 
  CartridgeModel, 
  TonerTub, 
  WeighingLog, 
  AuditLog, 
  User, 
  UserRole, 
  AlertSettings, 
  TelemetryMetric, 
  ITTicket, 
  ITServerNode, 
  ITVLAN, 
  ITLicense, 
  ServiceMemo 
} from "./types";

export const initialUsers: User[] = [
  { id: "u-1", name: "Алексей Смирнов (Сисадмин)", role: UserRole.ADMIN, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" },
  { id: "u-2", name: "Дмитрий Козлов (Руководитель IT)", role: UserRole.ADMIN, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" },
  { id: "u-3", name: "Елена Петрова (IT-Инженер)", role: UserRole.ADMIN, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" },
  { id: "u-4", name: "Михаил Иванов (Техподдержка)", role: UserRole.ADMIN, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" }
];

export const initialComputers: Computer[] = [
  {
    id: "pc-1502-01",
    name: "WS-SKLAD-1502",
    assignedUserId: "u-101",
    assignedUserName: "Васильев И.А. (Кладовщик 1502)",
    os: "Windows 10 Pro 64-bit",
    cpu: "Intel Core i5-10400 @ 2.90GHz (6C/12T)",
    ram: "16 GB DDR4-2666",
    storage: "SSD NVMe 512GB Kingston KC2500",
    ipv4: "192.168.15.2",
    mac: "00:1A:2B:3C:15:02",
    status: "OK",
    lastCheck: "2026-08-31 08:30",
    integrityHash: "SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    department: "Складской комплекс 1502",
    subdepartment: "Зона приемки и весового контроля",
    services: [
      { name: "TigerVNC Server (WinVNC)", status: "running" },
      { name: "ESET Endpoint Security (eraagent)", status: "running" },
      { name: "1C:Предприятие 8.3 Клиент", status: "running" },
      { name: "Драйвер весов МАССА-К (COM1)", status: "running" }
    ]
  },
  {
    id: "pc-1502-02",
    name: "WS-SKLAD-1502-PACK",
    assignedUserId: "u-102",
    assignedUserName: "Орлов Д.С. (Упаковка 1502)",
    os: "Windows 10 Pro 64-bit",
    cpu: "Intel Core i3-10100 @ 3.60GHz (4C/8T)",
    ram: "8 GB DDR4-2400",
    storage: "SSD SATA 256GB Goodram CL100",
    ipv4: "192.168.15.3",
    mac: "00:1A:2B:3C:15:03",
    status: "OK",
    lastCheck: "2026-08-31 08:45",
    integrityHash: "SHA256:6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    department: "Складской комплекс 1502",
    subdepartment: "Участок комплектации",
    services: [
      { name: "TigerVNC Server", status: "running" },
      { name: "ESET Endpoint Security", status: "running" },
      { name: "Zebra Designer Barcode", status: "running" }
    ]
  },
  {
    id: "pc-101",
    name: "WS-BUH-01",
    assignedUserId: "u-103",
    assignedUserName: "Анна Соколова (Главбух)",
    os: "Windows 11 Pro 64-bit",
    cpu: "Intel Core i7-12700 @ 2.10GHz (12C/20T)",
    ram: "32 GB DDR4-3200",
    storage: "SSD NVMe 1TB Samsung 980 Pro",
    ipv4: "192.168.1.101",
    mac: "00:1B:44:11:3A:01",
    status: "OK",
    lastCheck: "2026-08-31 09:12",
    integrityHash: "SHA256:d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35",
    department: "Бухгалтерия",
    subdepartment: "Финансовый отдел",
    services: [
      { name: "TigerVNC Service", status: "running" },
      { name: "1C:Предприятие 8.3", status: "running" },
      { name: "КриптоПро CSP 5.0", status: "running" },
      { name: "ESET Endpoint Antivirus", status: "running" }
    ]
  },
  {
    id: "pc-102",
    name: "WS-BUH-02",
    assignedUserId: "u-104",
    assignedUserName: "Татьяна Григорьева (Бухгалтер по ЗП)",
    os: "Windows 10 Pro 64-bit",
    cpu: "Intel Core i5-11400 @ 2.60GHz (6C/12T)",
    ram: "16 GB DDR4-3200",
    storage: "SSD NVMe 512GB Kingston NV2",
    ipv4: "192.168.1.102",
    mac: "00:1B:44:11:3A:02",
    status: "OK",
    lastCheck: "2026-08-31 09:15",
    integrityHash: "SHA256:4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
    department: "Бухгалтерия",
    subdepartment: "Расчет заработной платы",
    services: [
      { name: "TigerVNC Service", status: "running" },
      { name: "1С:ЗУП 3.1", status: "running" },
      { name: "ESET Service", status: "running" }
    ]
  },
  {
    id: "pc-103",
    name: "WS-SALES-01",
    assignedUserId: "u-105",
    assignedUserName: "Дмитрий Власов (Менеджер продаж)",
    os: "Windows 10 Pro 64-bit",
    cpu: "AMD Ryzen 5 5600G @ 3.90GHz (6C/12T)",
    ram: "16 GB DDR4-3200",
    storage: "SSD SATA 480GB Crucial BX500",
    ipv4: "192.168.1.115",
    mac: "00:1B:44:11:3B:15",
    status: "OK",
    lastCheck: "2026-08-31 08:50",
    integrityHash: "SHA256:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    department: "Отдел продаж",
    subdepartment: "Корпоративные клиенты",
    services: [
      { name: "TigerVNC Service", status: "running" },
      { name: "Bitrix24 Desktop", status: "running" },
      { name: "ESET Endpoint", status: "running" },
      { name: "Mango Talker VoIP", status: "running" }
    ]
  },
  {
    id: "pc-104",
    name: "WS-SALES-02",
    assignedUserId: "u-106",
    assignedUserName: "Марина Кузнецова (Тендерный спец.)",
    os: "Windows 11 Pro 64-bit",
    cpu: "Intel Core i5-12400 @ 2.50GHz (6C/12T)",
    ram: "16 GB DDR4-3200",
    storage: "SSD NVMe 512GB WD Blue SN570",
    ipv4: "192.168.1.116",
    mac: "00:1B:44:11:3B:16",
    status: "OK",
    lastCheck: "2026-08-31 09:20",
    integrityHash: "SHA256:ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
    department: "Отдел продаж",
    subdepartment: "Госзакупки и тендеры",
    services: [
      { name: "TigerVNC Service", status: "running" },
      { name: "КриптоПро ЭЦП", status: "running" },
      { name: "ESET Endpoint Security", status: "running" }
    ]
  },
  {
    id: "pc-105",
    name: "WS-LEGAL-01",
    assignedUserId: "u-107",
    assignedUserName: "Сергей Николаев (Юрист)",
    os: "Windows 10 Pro 64-bit",
    cpu: "Intel Core i3-12100 @ 3.30GHz (4C/8T)",
    ram: "16 GB DDR4-3200",
    storage: "SSD NVMe 512GB Kingston NV2",
    ipv4: "192.168.1.120",
    mac: "00:1B:44:11:3C:20",
    status: "OK",
    lastCheck: "2026-08-31 08:35",
    integrityHash: "SHA256:e7f6c011776e8db7cd330b54174fd76f7d0216b612387a5ffcfb81e6f0919683",
    department: "Юридический отдел",
    subdepartment: "Договорной отдел",
    services: [
      { name: "TigerVNC Service", status: "running" },
      { name: "КонсультантПлюс Сетевой", status: "running" },
      { name: "ESET Service", status: "running" }
    ]
  },
  {
    id: "pc-106",
    name: "WS-IT-DEV-01",
    assignedUserId: "u-1",
    assignedUserName: "Алексей Смирнов (Сисадмин)",
    os: "Astra Linux Special Edition 1.7",
    cpu: "AMD Ryzen 7 5700X @ 3.40GHz (8C/16T)",
    ram: "32 GB DDR4-3600",
    storage: "SSD NVMe 1TB Samsung 970 EVO Plus",
    ipv4: "192.168.1.15",
    mac: "00:1B:44:11:3E:01",
    status: "OK",
    lastCheck: "2026-08-31 09:30",
    integrityHash: "SHA256:790a36473b1e96e9e42914979d724802f61d4a2d6b3bce0fb8a9c57d9f186307",
    department: "IT-Отдел",
    subdepartment: "Системное администрирование",
    services: [
      { name: "tigervncserver :1", status: "running" },
      { name: "ssh server (sshd)", status: "running" },
      { name: "docker engine", status: "running" },
      { name: "eset-eraagent", status: "running" }
    ]
  },
  {
    id: "pc-107",
    name: "WS-IT-ENG-02",
    assignedUserId: "u-3",
    assignedUserName: "Елена Петрова (IT-Инженер)",
    os: "Ubuntu 22.04 LTS",
    cpu: "Intel Core i5-12600K @ 3.70GHz (10C/16T)",
    ram: "32 GB DDR4-3200",
    storage: "SSD NVMe 1TB Kingston KC3000",
    ipv4: "192.168.1.16",
    mac: "00:1B:44:11:3E:02",
    status: "OK",
    lastCheck: "2026-08-31 09:25",
    integrityHash: "SHA256:2c624232cdd221771294dfbb310aca000a0df6ac9b6602f3236585c2d8e20cbd",
    department: "IT-Отдел",
    subdepartment: "Инженерия и ремонт оргтехники",
    services: [
      { name: "tigervnc.service", status: "running" },
      { name: "cups printer service", status: "running" },
      { name: "ssh.service", status: "running" }
    ]
  },
  {
    id: "pc-108",
    name: "WS-HR-01",
    assignedUserId: "u-108",
    assignedUserName: "Ольга Романова (Отдел кадров)",
    os: "Windows 10 Pro 64-bit",
    cpu: "Intel Core i3-10100 @ 3.60GHz (4C/8T)",
    ram: "16 GB DDR4-2666",
    storage: "SSD SATA 480GB Kingston A400",
    ipv4: "192.168.1.130",
    mac: "00:1B:44:11:3F:01",
    status: "OK",
    lastCheck: "2026-08-31 08:40",
    integrityHash: "SHA256:19581e27de7ced00ff1ce50b2047e7a567c76b1cbaebabe5ef03f7c380e25f40",
    department: "Отдел кадров",
    subdepartment: "Управление персоналом",
    services: [
      { name: "TigerVNC Service", status: "running" },
      { name: "1C:ЗУП 3.1", status: "running" },
      { name: "ESET Service", status: "running" }
    ]
  }
];

export const initialCartridgeModels: CartridgeModel[] = [
  {
    id: "m-1",
    name: "HP 85A (CE285A)",
    printerModel: "HP LaserJet Pro P1102 / M1132 / M1212",
    emptyWeight: 620,
    fullWeight: 700,
    tonerWeight: 80
  },
  {
    id: "m-2",
    name: "Canon 725 (Starter / Regular)",
    printerModel: "Canon i-SENSYS LBP6000 / LBP6020 / MF3010",
    emptyWeight: 615,
    fullWeight: 695,
    tonerWeight: 80
  },
  {
    id: "m-3",
    name: "Kyocera TK-1170",
    printerModel: "Kyocera ECOSYS M2040dn / M2540dn / M2640idw",
    emptyWeight: 240,
    fullWeight: 530,
    tonerWeight: 290
  },
  {
    id: "m-4",
    name: "Xerox Phaser 3020 / WC 3025 (106R02773)",
    printerModel: "Xerox Phaser 3020 / WorkCentre 3025",
    emptyWeight: 490,
    fullWeight: 550,
    tonerWeight: 60
  },
  {
    id: "m-5",
    name: "HP 12A (Q2612A)",
    printerModel: "HP LaserJet 1010 / 1018 / 1020 / 3050",
    emptyWeight: 710,
    fullWeight: 820,
    tonerWeight: 110
  },
  {
    id: "m-6",
    name: "Brother TN-1075",
    printerModel: "Brother HL-1110R / DCP-1510R / MFC-1810R",
    emptyWeight: 380,
    fullWeight: 430,
    tonerWeight: 50
  }
];

export const initialTonerTubs: TonerTub[] = [
  {
    id: "t-1",
    name: "Тонер универсальный HP/Canon (Тип 1.0)",
    brand: "Static Control Components (SCC)",
    capacityGrams: 1000,
    remainingGrams: 820,
    color: "black"
  },
  {
    id: "t-2",
    name: "Тонер для Kyocera TK-серии (M2040/M2540)",
    brand: "Tomoegawa PYU-01",
    capacityGrams: 1000,
    remainingGrams: 590,
    color: "black"
  },
  {
    id: "t-3",
    name: "Тонер Xerox P3020 / Samsung ML-1610",
    brand: "Hi-Black Premium",
    capacityGrams: 1000,
    remainingGrams: 740,
    color: "black"
  },
  {
    id: "t-4",
    name: "Тонер Brother HL-1110 / TN-1075",
    brand: "Handan Color Black",
    capacityGrams: 500,
    remainingGrams: 360,
    color: "black"
  }
];

export const initialWeighingLogs: WeighingLog[] = [
  {
    id: "log-1",
    modelId: "m-1",
    modelName: "HP 85A (CE285A)",
    measuredWeight: 700,
    fillPercentage: 100,
    date: "2026-08-31 09:10",
    operator: "Алексей Смирнов (Сисадмин)",
    status: "perfect",
    notes: "Картридж заправлен эталонным весом 80г тонера. Магнитный вал протерт."
  },
  {
    id: "log-2",
    modelId: "m-3",
    modelName: "Kyocera TK-1170",
    measuredWeight: 530,
    fillPercentage: 100,
    date: "2026-08-31 09:20",
    operator: "Елена Петрова (IT-Инженер)",
    status: "perfect",
    notes: "Заправка бункера Tomoegawa, чип заменен, бункер отработки очищен."
  },
  {
    id: "log-3",
    modelId: "m-2",
    modelName: "Canon 725 (Starter / Regular)",
    measuredWeight: 694,
    fillPercentage: 99,
    date: "2026-08-31 09:35",
    operator: "Михаил Иванов (Техподдержка)",
    status: "perfect",
    notes: "Установка в кабинет Бухгалтерии WS-BUH-01."
  }
];

export const defaultAlertSettings: AlertSettings = {
  telegramBotToken: "",
  telegramChatId: "",
  smsApiUrl: "https://sms.ru/sms/send",
  smsApiKey: "",
  cpuThreshold: 85,
  tempThreshold: 75,
  tonerTubThreshold: 20
};

export const initialAuditLogs: AuditLog[] = [
  {
    id: "aud-1",
    timestamp: "2026-08-31 08:00:15",
    user: "Алексей Смирнов",
    role: UserRole.ADMIN,
    action: "Запуск системы Archon IT",
    type: "info",
    details: "Инициализация локальной базы данных SQLite 3 (archon_inventory.sqlite) и сервисов реестра.",
    ip: "127.0.0.1"
  },
  {
    id: "aud-2",
    timestamp: "2026-08-31 08:30:22",
    user: "Система мониторинга",
    role: UserRole.ADMIN,
    action: "Синхронизация парка ПК",
    type: "success",
    details: "Проверен пул компьютеров (10 станций). Службы TigerVNC и ESET активны.",
    ip: "192.168.1.15"
  }
];

export const mockTelemetryHistory: TelemetryMetric[] = [
  { timestamp: "08:00", cpu: 18, ram: 42, disk: 35, bandwidth: 120 },
  { timestamp: "08:30", cpu: 28, ram: 46, disk: 35, bandwidth: 240 },
  { timestamp: "09:00", cpu: 42, ram: 54, disk: 36, bandwidth: 480 },
  { timestamp: "09:30", cpu: 35, ram: 51, disk: 36, bandwidth: 310 }
];

export const initialITTickets: ITTicket[] = [
  {
    id: "INC-1502-01",
    title: "Настройка весового терминала МАССА-К на складе 1502",
    description: "Требуется откалибровать точность взвешивания тумб тонера и обновить драйвер COM-порта на рабочей станции WS-SKLAD-1502.",
    priority: "HIGH",
    status: "IN_PROGRESS",
    category: "PRINTER",
    assignee: "Елена Петрова (IT-Инженер)",
    requester: "Васильев И.А. (Кладовщик)",
    department: "Складской комплекс 1502",
    createdAt: "2026-08-31 08:15",
    updatedAt: "2026-08-31 09:00"
  },
  {
    id: "INC-101",
    title: "Плановая ротация мастер-паролей ESET и Admin",
    description: "Выполнить скрытую пакетную ротацию паролей администраторов для рабочих станций бухгалтерии и склада.",
    priority: "MEDIUM",
    status: "RESOLVED",
    category: "ACCOUNT",
    assignee: "Алексей Смирнов (Сисадмин)",
    requester: "Дмитрий Козлов (Руководитель IT)",
    department: "IT-Отдел",
    createdAt: "2026-08-31 07:45",
    updatedAt: "2026-08-31 08:30"
  }
];

export const initialITServers: ITServerNode[] = [
  {
    id: "srv-1",
    name: "DC-PROD-01",
    role: "Domain Controller & DNS / AD DS",
    ip: "192.168.1.10",
    os: "Windows Server 2022 Datacenter",
    uptime: "142 дня 8 часов",
    cpuUsage: 14.5,
    ramUsage: 38.2,
    diskUsage: 41.0,
    pingMs: 0.8,
    status: "ONLINE",
    ports: [53, 88, 389, 445, 636, 3268],
    services: ["Active Directory Domain Services", "DNS Server", "Kerberos KDC", "Group Policy Engine"]
  },
  {
    id: "srv-2",
    name: "SRV-1C-CLUSTER",
    role: "1С:Предприятие 8.3 Сервер приложений",
    ip: "192.168.1.12",
    os: "Ubuntu Server 22.04 LTS (x86_64)",
    uptime: "68 дней 14 часов",
    cpuUsage: 48.0,
    ramUsage: 64.5,
    diskUsage: 55.2,
    pingMs: 1.2,
    status: "ONLINE",
    ports: [1540, 1541, 1560, 1591, 5432],
    services: ["ragent (1C Server)", "PostgreSQL 14.8-1C", "Apache 2.4 (Web-Client)"]
  },
  {
    id: "srv-3",
    name: "SRV-BACKUP-STORAGE",
    role: "Сетевое хранилище резервных копий (Bacula/Veeam)",
    ip: "192.168.1.14",
    os: "TrueNAS CORE / ZFS",
    uptime: "210 дней 4 часа",
    cpuUsage: 9.2,
    ramUsage: 78.0,
    diskUsage: 62.8,
    pingMs: 1.5,
    status: "ONLINE",
    ports: [22, 445, 2049, 9102],
    services: ["ZFS Pool RAID-Z2 (48TB)", "Samba File Service", "Bacula Storage Daemon"]
  }
];

export const initialITVLANs: ITVLAN[] = [
  {
    id: 10,
    name: "MGMT-ADMIN",
    subnet: "192.168.10.0/24",
    dhcpScope: "Статические IP (Сетевое оборудование, ИБП)",
    gateway: "192.168.10.1",
    activeHosts: 12,
    purpose: "Управление коммутаторами, маршрутизаторами и IPMI",
    color: "amber"
  },
  {
    id: 15,
    name: "SKLAD-1502",
    subnet: "192.168.15.0/24",
    dhcpScope: "192.168.15.50 - 192.168.15.200",
    gateway: "192.168.15.1",
    activeHosts: 18,
    purpose: "Склад 1502, весы, термопринтеры и терминалы сбора данных",
    color: "emerald"
  },
  {
    id: 20,
    name: "OFFICE-CORP",
    subnet: "192.168.1.0/24",
    dhcpScope: "192.168.1.100 - 192.168.1.240",
    gateway: "192.168.1.1",
    activeHosts: 65,
    purpose: "Рабочие станции сотрудников, бухгалтерия, продажи",
    color: "blue"
  },
  {
    id: 30,
    name: "SERVERS-1C",
    subnet: "192.168.30.0/24",
    dhcpScope: "Статические IP (Серверный сегмент)",
    gateway: "192.168.30.1",
    activeHosts: 8,
    purpose: "Контроллеры домена, базы данных 1С, хранилища",
    color: "indigo"
  }
];

export const initialITLicenses: ITLicense[] = [
  {
    id: "lic-1",
    name: "1С:Предприятие 8.3 (Клиентская лицензия на 50 р.м.)",
    vendor: "Фирма 1С",
    type: "Программная лицензия HASP/PIN",
    usedSeats: 38,
    totalSeats: 50,
    expiresAt: "Бессрочная",
    status: "ACTIVE"
  },
  {
    id: "lic-2",
    name: "ESET Protect Enterprise (Антивирусная защита)",
    vendor: "ESET NOD32",
    type: "Годовая корпоративная подписка",
    usedSeats: 44,
    totalSeats: 60,
    expiresAt: "2027-04-15",
    status: "ACTIVE"
  },
  {
    id: "lic-3",
    name: "Astra Linux Special Edition 1.7 «Смоленск»",
    vendor: "ГК Астра",
    type: "OEM Бессрочная лицензия",
    usedSeats: 12,
    totalSeats: 15,
    expiresAt: "Бессрочная",
    status: "ACTIVE"
  }
];

export const initialServiceMemos: ServiceMemo[] = [
  {
    id: "memo-1502",
    number: "СЗ-ИТ-2026/042",
    title: "Закупка универсального тонера и чипов для склада 1502",
    category: "PURCHASE",
    priority: "HIGH",
    status: "APPROVED",
    description: "В связи с возросшим объемом отгрузок на складском комплексе 1502 требуется пополнить запас тонера Tomoegawa и картриджей Kyocera TK-1170.",
    author: "Васильев И.А.",
    authorRole: "Кладовщик 1502",
    department: "Складской комплекс 1502",
    recipient: "Козлов Д.С. (Руководитель IT)",
    createdDate: "2026-08-30",
    deadlineDate: "2026-09-05",
    notifyDaysBefore: 10,
    estimatedCost: 38500,
    resolution: "Согласовано к оплате в текущем расчетном периоде.",
    resolvedBy: "Козлов Д.С.",
    resolvedDate: "2026-08-31",
    attachments: [
      { id: "att-1", name: "Спецификация_Тонер_1502.pdf", size: 290816, type: "application/pdf", uploadedAt: "2026-08-30 16:30" }
    ],
    comments: [
      { id: "c-1", author: "Алексей Смирнов", role: "Системный администратор", date: "2026-08-31 09:00", text: "Спецификация проверена, весовой контроль на складе готов к калибровке." }
    ],
    tags: ["Тонер", "Склад 1502", "Kyocera", "ОТК"]
  }
];
