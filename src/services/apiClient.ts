import {
  Computer,
  CartridgeModel,
  TonerTub,
  WeighingLog,
  AuditLog,
  AlertSettings,
  ITTicket,
  ITServerNode,
  ITVLAN,
  ITLicense,
  ServiceMemo
} from "../types";
import { defaultAlertSettings } from "../data";

class ApiClientService {
  // --- COMPUTERS ---
  public async getComputers(): Promise<Computer[]> {
    try {
      const res = await fetch("/api/computers");
      if (!res.ok) throw new Error("Failed to fetch computers");
      return await res.json();
    } catch (err) {
      console.warn("API fallback for computers:", err);
      const saved = localStorage.getItem("archon_pg_computers");
      return saved ? JSON.parse(saved) : [];
    }
  }

  public async saveComputer(item: Computer): Promise<void> {
    try {
      await fetch("/api/computers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    } catch (err) {
      console.error("Failed to save computer to API:", err);
    }
  }

  public async deleteComputer(id: string): Promise<void> {
    try {
      await fetch(`/api/computers/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete computer:", err);
    }
  }

  // --- CARTRIDGE MODELS ---
  public async getCartridgeModels(): Promise<CartridgeModel[]> {
    try {
      const res = await fetch("/api/cartridge-models");
      if (!res.ok) throw new Error("Failed to fetch cartridge models");
      return await res.json();
    } catch (err) {
      console.warn("API fallback for cartridge models:", err);
      const saved = localStorage.getItem("archon_pg_models");
      return saved ? JSON.parse(saved) : [];
    }
  }

  public async saveCartridgeModel(item: CartridgeModel): Promise<void> {
    try {
      await fetch("/api/cartridge-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    } catch (err) {
      console.error("Failed to save model to API:", err);
    }
  }

  public async deleteCartridgeModel(id: string): Promise<void> {
    try {
      await fetch(`/api/cartridge-models/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete model:", err);
    }
  }

  // --- TONER TUBS ---
  public async getTonerTubs(): Promise<TonerTub[]> {
    try {
      const res = await fetch("/api/toner-tubs");
      if (!res.ok) throw new Error("Failed to fetch toner tubs");
      return await res.json();
    } catch (err) {
      console.warn("API fallback for toner tubs:", err);
      const saved = localStorage.getItem("archon_pg_tubs");
      return saved ? JSON.parse(saved) : [];
    }
  }

  public async saveTonerTub(item: TonerTub): Promise<void> {
    try {
      await fetch("/api/toner-tubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    } catch (err) {
      console.error("Failed to save toner tub to API:", err);
    }
  }

  public async deleteTonerTub(id: string): Promise<void> {
    try {
      await fetch(`/api/toner-tubs/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete toner tub:", err);
    }
  }

  // --- WEIGHING LOGS ---
  public async getWeighingLogs(): Promise<WeighingLog[]> {
    try {
      const res = await fetch("/api/weighing-logs");
      if (!res.ok) throw new Error("Failed to fetch weighing logs");
      return await res.json();
    } catch (err) {
      console.warn("API fallback for weighing logs:", err);
      const saved = localStorage.getItem("archon_pg_logs");
      return saved ? JSON.parse(saved) : [];
    }
  }

  public async saveWeighingLog(item: WeighingLog): Promise<void> {
    try {
      await fetch("/api/weighing-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    } catch (err) {
      console.error("Failed to save weighing log to API:", err);
    }
  }

  public async deleteWeighingLog(id: string): Promise<void> {
    try {
      await fetch(`/api/weighing-logs/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete weighing log:", err);
    }
  }

  // --- IT TICKETS ---
  public async getITTickets(): Promise<ITTicket[]> {
    try {
      const res = await fetch("/api/it-tickets");
      if (!res.ok) throw new Error("Failed to fetch tickets");
      return await res.json();
    } catch (err) {
      console.warn("API fallback for IT tickets:", err);
      const saved = localStorage.getItem("archon_pg_tickets");
      return saved ? JSON.parse(saved) : [];
    }
  }

  public async saveITTicket(item: ITTicket): Promise<void> {
    try {
      await fetch("/api/it-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    } catch (err) {
      console.error("Failed to save ticket:", err);
    }
  }

  public async deleteITTicket(id: string): Promise<void> {
    try {
      await fetch(`/api/it-tickets/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete ticket:", err);
    }
  }

  // --- IT SERVERS ---
  public async getITServers(): Promise<ITServerNode[]> {
    try {
      const res = await fetch("/api/it-servers");
      if (!res.ok) throw new Error("Failed to fetch servers");
      return await res.json();
    } catch (err) {
      console.warn("API fallback for IT servers:", err);
      const saved = localStorage.getItem("archon_pg_servers");
      return saved ? JSON.parse(saved) : [];
    }
  }

  public async saveITServer(item: ITServerNode): Promise<void> {
    try {
      await fetch("/api/it-servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    } catch (err) {
      console.error("Failed to save server:", err);
    }
  }

  public async deleteITServer(id: string): Promise<void> {
    try {
      await fetch(`/api/it-servers/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete server:", err);
    }
  }

  // --- IT VLANS ---
  public async getITVLANs(): Promise<ITVLAN[]> {
    try {
      const res = await fetch("/api/it-vlans");
      if (!res.ok) throw new Error("Failed to fetch vlans");
      return await res.json();
    } catch (err) {
      console.warn("API fallback for VLANs:", err);
      const saved = localStorage.getItem("archon_pg_vlans");
      return saved ? JSON.parse(saved) : [];
    }
  }

  public async saveITVLAN(item: ITVLAN): Promise<void> {
    try {
      await fetch("/api/it-vlans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    } catch (err) {
      console.error("Failed to save vlan:", err);
    }
  }

  public async deleteITVLAN(id: number): Promise<void> {
    try {
      await fetch(`/api/it-vlans/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete vlan:", err);
    }
  }

  // --- IT LICENSES ---
  public async getITLicenses(): Promise<ITLicense[]> {
    try {
      const res = await fetch("/api/it-licenses");
      if (!res.ok) throw new Error("Failed to fetch licenses");
      return await res.json();
    } catch (err) {
      console.warn("API fallback for licenses:", err);
      const saved = localStorage.getItem("archon_pg_licenses");
      return saved ? JSON.parse(saved) : [];
    }
  }

  public async saveITLicense(item: ITLicense): Promise<void> {
    try {
      await fetch("/api/it-licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    } catch (err) {
      console.error("Failed to save license:", err);
    }
  }

  public async deleteITLicense(id: string): Promise<void> {
    try {
      await fetch(`/api/it-licenses/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete license:", err);
    }
  }

  // --- SERVICE MEMOS ---
  public async getServiceMemos(): Promise<ServiceMemo[]> {
    try {
      const res = await fetch("/api/service-memos");
      if (!res.ok) throw new Error("Failed to fetch service memos");
      return await res.json();
    } catch (err) {
      console.warn("API fallback for service memos:", err);
      const saved = localStorage.getItem("archon_pg_memos");
      return saved ? JSON.parse(saved) : [];
    }
  }

  public async saveServiceMemo(item: ServiceMemo): Promise<void> {
    try {
      await fetch("/api/service-memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    } catch (err) {
      console.error("Failed to save memo to API:", err);
    }
  }

  public async deleteServiceMemo(id: string): Promise<void> {
    try {
      await fetch(`/api/service-memos/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete memo:", err);
    }
  }

  // --- AUDIT LOGS ---
  public async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await fetch("/api/audit-logs");
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return await res.json();
    } catch (err) {
      console.warn("API fallback for audit logs:", err);
      const saved = localStorage.getItem("archon_pg_audit");
      return saved ? JSON.parse(saved) : [];
    }
  }

  public async saveAuditLog(item: AuditLog): Promise<void> {
    try {
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    } catch (err) {
      console.error("Failed to save audit log:", err);
    }
  }

  public async deleteAuditLog(id: string): Promise<void> {
    try {
      await fetch(`/api/audit-logs/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete audit log:", err);
    }
  }

  public async clearAuditLogs(): Promise<void> {
    try {
      await fetch("/api/audit-logs", { method: "DELETE" });
    } catch (err) {
      console.error("Failed to clear audit logs:", err);
    }
  }

  // --- ALERT SETTINGS ---
  public async getAlertSettings(): Promise<AlertSettings> {
    try {
      const res = await fetch("/api/alert-settings");
      if (!res.ok) throw new Error("Failed to fetch alert settings");
      return await res.json();
    } catch (err) {
      console.warn("API fallback for alert settings:", err);
      const saved = localStorage.getItem("archon_pg_alerts");
      return saved ? JSON.parse(saved) : defaultAlertSettings;
    }
  }

  public async saveAlertSettings(item: AlertSettings): Promise<void> {
    try {
      await fetch("/api/alert-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    } catch (err) {
      console.error("Failed to save alert settings:", err);
    }
  }

  // --- RUN RAW SQL ON POSTGRESQL ---
  public async executeSql(query: string): Promise<{
    columns: string[];
    rows: any[];
    rowCount: number;
    command?: string;
    durationMs: number;
  }> {
    const res = await fetch("/api/sql-query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ error: "Query failed" }));
      throw new Error(errJson.error || "Query execution failed");
    }
    return await res.json();
  }

  // --- RESET ALL DATA ---
  public async resetAll(): Promise<void> {
    const res = await fetch("/api/reset-all", { method: "POST" });
    if (!res.ok) {
      throw new Error("Failed to reset database");
    }
  }
}

export const dbService = new ApiClientService();
