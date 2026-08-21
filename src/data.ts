import { Computer, CartridgeModel, TonerTub, WeighingLog, AuditLog, User, UserRole, AlertSettings, TelemetryMetric, ITTicket, ITServerNode, ITVLAN, ITLicense, ServiceMemo } from "./types";

export const initialUsers: User[] = [
  { id: "u-1", name: "Алексей Смирнов (Сисадмин)", role: UserRole.ADMIN, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" },
  { id: "u-2", name: "Дмитрий Козлов (Руководитель IT)", role: UserRole.ADMIN, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" },
  { id: "u-3", name: "Елена Петрова (IT-Инженер)", role: UserRole.ADMIN, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" },
  { id: "u-4", name: "Михаил Иванов (Техподдержка)", role: UserRole.ADMIN, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" }
];

export const initialComputers: Computer[] = [];

export const initialCartridgeModels: CartridgeModel[] = [];

export const initialTonerTubs: TonerTub[] = [];

export const initialWeighingLogs: WeighingLog[] = [];

export const defaultAlertSettings: AlertSettings = {
  telegramBotToken: "",
  telegramChatId: "",
  smsApiUrl: "https://sms.ru/sms/send",
  smsApiKey: "",
  cpuThreshold: 85,
  tempThreshold: 75,
  tonerTubThreshold: 20
};

export const initialAuditLogs: AuditLog[] = [];

export const mockTelemetryHistory: TelemetryMetric[] = [
  { timestamp: "00:00", cpu: 0, ram: 0, disk: 0, bandwidth: 0 }
];

export const initialITTickets: ITTicket[] = [];

export const initialITServers: ITServerNode[] = [];

export const initialITVLANs: ITVLAN[] = [];

export const initialITLicenses: ITLicense[] = [];

export const initialServiceMemos: ServiceMemo[] = [];
