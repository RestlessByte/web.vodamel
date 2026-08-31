export enum UserRole {
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE",
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export type ComputerStatus = "OK" | "WARNING" | "CRITICAL";

export interface Computer {
  id: string;
  name: string;
  assignedUserId: string;
  assignedUserName: string;
  os: string;
  cpu: string;
  ram: string;
  storage: string;
  ipv4: string;
  mac: string;
  status: ComputerStatus;
  lastCheck: string;
  integrityHash: string;
  services: { name: string; status: "running" | "stopped" }[];
  department?: string;
  subdepartment?: string;
}

export interface CartridgeModel {
  id: string;
  name: string;          // e.g., "HP 85A (CE285A)"
  printerModel: string;  // e.g., "HP LaserJet P1102"
  emptyWeight: number;   // grams, e.g. 620
  fullWeight: number;    // grams, e.g. 700
  tonerWeight: number;   // grams (fullWeight - emptyWeight)
}

export interface WeighingLog {
  id: string;
  modelId: string;
  modelName: string;
  measuredWeight: number;
  fillPercentage: number;
  date: string;
  operator: string;
  status: "perfect" | "underfilled" | "overfilled" | "empty";
  notes?: string;
}

export interface TonerTub {
  id: string;
  name: string;          // e.g., "Универсальный тонер HP"
  brand: string;         // e.g., "Static Control"
  capacityGrams: number; // e.g., 1000
  remainingGrams: number;// e.g., 850
  color: string;         // e.g., "black"
}

export type LogType = "info" | "success" | "warning" | "error";

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  type: LogType;
  details: string;
  ip: string;
}

export interface AlertSettings {
  telegramBotToken: string;
  telegramChatId: string;
  smsApiUrl: string;
  smsApiKey: string;
  cpuThreshold: number;
  tempThreshold: number;
  tonerTubThreshold: number; // percent
}

export interface TelemetryMetric {
  timestamp: string;
  cpu: number;
  ram: number;
  disk: number;
  bandwidth: number;
}

export interface ITTicket {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  category: "HARDWARE" | "NETWORK" | "PRINTER" | "ACCOUNT" | "SOFTWARE";
  assignee: string;
  requester: string;
  department: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITServerNode {
  id: string;
  name: string;
  role: string;
  ip: string;
  os: string;
  uptime: string;
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  pingMs: number;
  status: "ONLINE" | "WARNING" | "OFFLINE";
  ports: number[];
  services: string[];
}

export interface ITVLAN {
  id: number;
  name: string;
  subnet: string;
  dhcpScope: string;
  gateway: string;
  activeHosts: number;
  purpose: string;
  color: string;
}

export interface ITLicense {
  id: string;
  name: string;
  vendor: string;
  type: string;
  usedSeats: number;
  totalSeats: number;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";
}

export type ServiceMemoCategory = 
  | "PURCHASE" 
  | "WRITE_OFF" 
  | "ACCESS_VPN" 
  | "MAINTENANCE" 
  | "UPGRADE" 
  | "STAFF" 
  | "SECURITY" 
  | "OTHER";

export type ServiceMemoStatus = 
  | "DRAFT" 
  | "PENDING_APPROVAL" 
  | "APPROVED" 
  | "IN_PROGRESS" 
  | "COMPLETED" 
  | "REJECTED";

export type ServiceMemoPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface MemoAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  dataUrl?: string;
}

export interface MemoComment {
  id: string;
  author: string;
  role: string;
  date: string;
  text: string;
}

export interface ServiceMemo {
  id: string;
  number: string;
  title: string;
  category: ServiceMemoCategory;
  priority: ServiceMemoPriority;
  status: ServiceMemoStatus;
  description: string;
  author: string;
  authorRole: string;
  department: string;
  recipient: string;
  createdDate: string;
  deadlineDate: string;
  notifyDaysBefore: number;
  estimatedCost: number;
  resolution?: string;
  resolvedBy?: string;
  resolvedDate?: string;
  attachments: MemoAttachment[];
  comments: MemoComment[];
  tags: string[];
}

export type AdminAccountType = "eset" | "root" | "admin" | "Administrator" | "custom";

export interface ParsedRemoteNode {
  computerId: string;
  computerName: string;
  assignedUser: string;
  department: string;
  ipv4: string;
  mac: string;
  os: string;
  detectedAdminAccount: AdminAccountType;
  customAccountName?: string;
  vncPort: number;
  vncStatus: "AVAILABLE" | "PORT_OPEN" | "CONNECTING" | "AUTH_REQUIRED" | "OFFLINE";
  sshWinrmStatus: "ONLINE" | "OFFLINE";
  passwordStatus: "PENDING_UPDATE" | "ROTATED" | "VERIFIED" | "FAILED";
  lastRotatedAt?: string;
  currentPassword?: string;
  generatedPassword?: string;
  selected?: boolean;
  pingMs: number;
}
