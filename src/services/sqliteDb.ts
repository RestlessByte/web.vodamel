import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
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
import {
  initialComputers,
  initialCartridgeModels,
  initialTonerTubs,
  initialWeighingLogs,
  initialAuditLogs,
  defaultAlertSettings,
  initialITTickets,
  initialITServers,
  initialITVLANs,
  initialITLicenses,
  initialServiceMemos
} from "../data";

const SQLITE_STORAGE_KEY = "archon_sqlite_db_binary";
const DB_VERSION_KEY = "archon_sqlite_db_version";
const CURRENT_VERSION = "2.5.0";

class SQLiteService {
  private db: SqlJsDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<SqlJsDatabase> | null = null;

  public async init(): Promise<SqlJsDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const SQL = await initSqlJs({
          locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
        });

        // Check if there is saved binary database in localStorage (Base64)
        const savedBase64 = localStorage.getItem(SQLITE_STORAGE_KEY);
        if (savedBase64) {
          try {
            const binaryString = atob(savedBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            this.db = new SQL.Database(bytes);
          } catch (e) {
            console.warn("Failed to load saved SQLite binary, creating fresh DB:", e);
            this.db = new SQL.Database();
          }
        } else {
          this.db = new SQL.Database();
        }

        this.createTablesAndSeed();
        this.isInitialized = true;
        this.saveToStorage();
        return this.db;
      } catch (err) {
        console.error("SQLite initialization failed, creating fallback DB:", err);
        const SQL = await initSqlJs({
          locateFile: (file) => `https://sql.js.org/dist/${file}`
        });
        this.db = new SQL.Database();
        this.createTablesAndSeed();
        this.isInitialized = true;
        return this.db;
      }
    })();

    return this.initPromise;
  }

  // Create SQLite Schema and populate initial data if empty
  private createTablesAndSeed() {
    if (!this.db) return;

    // 1. DDL Statements for All Enterprise Tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS computers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        assigned_user_id TEXT,
        assigned_user_name TEXT,
        os TEXT,
        cpu TEXT,
        ram TEXT,
        storage TEXT,
        ipv4 TEXT,
        mac TEXT,
        status TEXT,
        last_check TEXT,
        integrity_hash TEXT,
        services_json TEXT,
        department TEXT,
        subdepartment TEXT
      );

      CREATE TABLE IF NOT EXISTS cartridge_models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        printer_model TEXT,
        empty_weight REAL,
        full_weight REAL,
        toner_weight REAL
      );

      CREATE TABLE IF NOT EXISTS toner_tubs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT,
        capacity_grams REAL,
        remaining_grams REAL,
        color TEXT
      );

      CREATE TABLE IF NOT EXISTS weighing_logs (
        id TEXT PRIMARY KEY,
        model_id TEXT,
        model_name TEXT,
        measured_weight REAL,
        fill_percentage REAL,
        date TEXT,
        operator TEXT,
        status TEXT,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        user TEXT,
        role TEXT,
        action TEXT,
        type TEXT,
        details TEXT,
        ip TEXT
      );

      CREATE TABLE IF NOT EXISTS alert_settings (
        id TEXT PRIMARY KEY,
        telegram_bot_token TEXT,
        telegram_chat_id TEXT,
        sms_api_url TEXT,
        sms_api_key TEXT,
        cpu_threshold INTEGER,
        temp_threshold INTEGER,
        toner_tub_threshold INTEGER
      );

      CREATE TABLE IF NOT EXISTS it_tickets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT,
        status TEXT,
        category TEXT,
        assignee TEXT,
        requester TEXT,
        department TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS it_servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT,
        ip TEXT,
        os TEXT,
        uptime TEXT,
        cpu_usage REAL,
        ram_usage REAL,
        disk_usage REAL,
        ping_ms REAL,
        status TEXT,
        ports_json TEXT,
        services_json TEXT
      );

      CREATE TABLE IF NOT EXISTS it_vlans (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        subnet TEXT,
        dhcp_scope TEXT,
        gateway TEXT,
        active_hosts INTEGER,
        purpose TEXT,
        color TEXT
      );

      CREATE TABLE IF NOT EXISTS it_licenses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        vendor TEXT,
        type TEXT,
        used_seats INTEGER,
        total_seats INTEGER,
        expires_at TEXT,
        status TEXT
      );

      CREATE TABLE IF NOT EXISTS service_memos (
        id TEXT PRIMARY KEY,
        number TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        description TEXT,
        author TEXT,
        author_role TEXT,
        department TEXT,
        recipient TEXT,
        created_date TEXT,
        deadline_date TEXT,
        notify_days_before INTEGER DEFAULT 15,
        estimated_cost REAL DEFAULT 0,
        resolution TEXT,
        resolved_by TEXT,
        resolved_date TEXT,
        attachments_json TEXT,
        comments_json TEXT,
        tags_json TEXT
      );
    `);

    // 2. Seed initial data if tables are empty
    const pcCount = this.query<{ count: number }>("SELECT count(*) as count FROM computers")[0]?.count || 0;
    if (pcCount === 0) {
      this.seedInitialData();
    } else {
      // Also ensure service_memos table is seeded if newly added
      const memoCount = this.query<{ count: number }>("SELECT count(*) as count FROM service_memos")[0]?.count || 0;
      if (memoCount === 0) {
        this.seedServiceMemos();
      }
    }
  }

  // Seed default dataset into SQLite
  private seedInitialData() {
    if (!this.db) return;

    // Computers
    const insertPc = this.db.prepare(`
      INSERT INTO computers (
        id, name, assigned_user_id, assigned_user_name, os, cpu, ram, storage,
        ipv4, mac, status, last_check, integrity_hash, services_json, department, subdepartment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of initialComputers) {
      insertPc.run([
        c.id, c.name, c.assignedUserId, c.assignedUserName, c.os, c.cpu, c.ram, c.storage,
        c.ipv4, c.mac, c.status, c.lastCheck, c.integrityHash,
        JSON.stringify(c.services || []), c.department || "", c.subdepartment || ""
      ]);
    }
    insertPc.free();

    // Cartridges
    const insertCart = this.db.prepare(`
      INSERT INTO cartridge_models (
        id, name, printer_model, empty_weight, full_weight, toner_weight
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const cm of initialCartridgeModels) {
      insertCart.run([
        cm.id, cm.name, cm.printerModel, cm.emptyWeight, cm.fullWeight, cm.tonerWeight
      ]);
    }
    insertCart.free();

    // Toner Tubs
    const insertTub = this.db.prepare(`
      INSERT INTO toner_tubs (
        id, name, brand, capacity_grams, remaining_grams, color
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const tub of initialTonerTubs) {
      insertTub.run([
        tub.id, tub.name, tub.brand, tub.capacityGrams, tub.remainingGrams, tub.color
      ]);
    }
    insertTub.free();

    // Weighing Logs
    const insertLog = this.db.prepare(`
      INSERT INTO weighing_logs (
        id, model_id, model_name, measured_weight, fill_percentage, date, operator, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const wl of initialWeighingLogs) {
      insertLog.run([
        wl.id, wl.modelId, wl.modelName, wl.measuredWeight, wl.fillPercentage,
        wl.date, wl.operator, wl.status, wl.notes || ""
      ]);
    }
    insertLog.free();

    // Audit Logs
    const insertAudit = this.db.prepare(`
      INSERT INTO audit_logs (
        id, timestamp, user, role, action, type, details, ip
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const al of initialAuditLogs) {
      insertAudit.run([
        al.id, al.timestamp, al.user, al.role, al.action, al.type, al.details, al.ip
      ]);
    }
    insertAudit.free();

    // Alert Settings
    const insertAlert = this.db.prepare(`
      INSERT INTO alert_settings (
        id, telegram_bot_token, telegram_chat_id, sms_api_url, sms_api_key,
        cpu_threshold, temp_threshold, toner_tub_threshold
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAlert.run([
      "default", defaultAlertSettings.telegramBotToken, defaultAlertSettings.telegramChatId,
      defaultAlertSettings.smsApiUrl, defaultAlertSettings.smsApiKey,
      defaultAlertSettings.cpuThreshold, defaultAlertSettings.tempThreshold,
      defaultAlertSettings.tonerTubThreshold
    ]);
    insertAlert.free();

    // IT Tickets
    const insertTicket = this.db.prepare(`
      INSERT INTO it_tickets (
        id, title, description, priority, status, category, assignee, requester, department, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const t of initialITTickets) {
      insertTicket.run([
        t.id, t.title, t.description, t.priority, t.status, t.category, t.assignee, t.requester, t.department, t.createdAt, t.updatedAt
      ]);
    }
    insertTicket.free();

    // IT Servers
    const insertServer = this.db.prepare(`
      INSERT INTO it_servers (
        id, name, role, ip, os, uptime, cpu_usage, ram_usage, disk_usage, ping_ms, status, ports_json, services_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of initialITServers) {
      insertServer.run([
        s.id, s.name, s.role, s.ip, s.os, s.uptime, s.cpuUsage, s.ramUsage, s.diskUsage, s.pingMs, s.status,
        JSON.stringify(s.ports || []), JSON.stringify(s.services || [])
      ]);
    }
    insertServer.free();

    // IT VLANs
    const insertVlan = this.db.prepare(`
      INSERT INTO it_vlans (
        id, name, subnet, dhcp_scope, gateway, active_hosts, purpose, color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const v of initialITVLANs) {
      insertVlan.run([
        v.id, v.name, v.subnet, v.dhcpScope, v.gateway, v.activeHosts, v.purpose, v.color
      ]);
    }
    insertVlan.free();

    // IT Licenses
    const insertLicense = this.db.prepare(`
      INSERT INTO it_licenses (
        id, name, vendor, type, used_seats, total_seats, expires_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const l of initialITLicenses) {
      insertLicense.run([
        l.id, l.name, l.vendor, l.type, l.usedSeats, l.totalSeats, l.expiresAt, l.status
      ]);
    }
    insertLicense.free();

    // Service Memos
    this.seedServiceMemos();
  }

  // Seed Service Memos
  public seedServiceMemos() {
    if (!this.db) return;
    const insertMemo = this.db.prepare(`
      INSERT OR REPLACE INTO service_memos (
        id, number, title, category, priority, status, description, author, author_role,
        department, recipient, created_date, deadline_date, notify_days_before, estimated_cost,
        resolution, resolved_by, resolved_date, attachments_json, comments_json, tags_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const m of initialServiceMemos) {
      insertMemo.run([
        m.id, m.number, m.title, m.category, m.priority, m.status, m.description,
        m.author, m.authorRole, m.department, m.recipient, m.createdDate, m.deadlineDate,
        m.notifyDaysBefore || 15, m.estimatedCost || 0,
        m.resolution || "", m.resolvedBy || "", m.resolvedDate || "",
        JSON.stringify(m.attachments || []),
        JSON.stringify(m.comments || []),
        JSON.stringify(m.tags || [])
      ]);
    }
    insertMemo.free();
  }

  // Save current SQLite binary database to Storage
  public saveToStorage() {
    if (!this.db) return;
    try {
      const data = this.db.export();
      let binary = "";
      for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i]);
      }
      const base64 = btoa(binary);
      localStorage.setItem(SQLITE_STORAGE_KEY, base64);
      localStorage.setItem(DB_VERSION_KEY, CURRENT_VERSION);
    } catch (e) {
      console.error("Failed to serialize SQLite database:", e);
    }
  }

  // Execute raw SQL and return results
  public exec(sql: string) {
    if (!this.db) throw new Error("SQLite Database not initialized");
    const res = this.db.exec(sql);
    this.saveToStorage();
    return res;
  }

  // Query typed records
  public query<T = any>(sql: string, params: any[] = []): T[] {
    if (!this.db) return [];
    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as unknown as T);
      }
      stmt.free();
      return results;
    } catch (err) {
      console.error("SQL Query Error:", err, "Query:", sql);
      return [];
    }
  }

  // Run parameterized command (INSERT, UPDATE, DELETE)
  public run(sql: string, params: any[] = []): boolean {
    if (!this.db) return false;
    try {
      const stmt = this.db.prepare(sql);
      stmt.run(params);
      stmt.free();
      this.saveToStorage();
      return true;
    } catch (err) {
      console.error("SQL Run Error:", err, "Command:", sql);
      return false;
    }
  }

  // Export full SQLite .sqlite / .db binary file
  public exportBinaryFile(): Uint8Array {
    if (!this.db) throw new Error("DB not ready");
    return this.db.export();
  }

  // Import SQLite .sqlite / .db binary file
  public async importBinaryFile(buffer: Uint8Array): Promise<boolean> {
    const SQL = await initSqlJs({
      locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
    });
    this.db = new SQL.Database(buffer);
    this.saveToStorage();
    return true;
  }

  // Generate standard SQL .sql Dump Script
  public exportSqlDump(): string {
    if (!this.db) return "";
    let dump = `-- Archon Enterprise SQLite Database Dump\n-- Generated: ${new Date().toISOString()}\n-- SQLite Version: 3.4x (WebAssembly Core)\n\nBEGIN TRANSACTION;\n\n`;

    const tables = ["computers", "cartridge_models", "toner_tubs", "weighing_logs", "audit_logs", "alert_settings", "it_tickets", "it_servers", "it_vlans", "it_licenses", "service_memos"];

    for (const table of tables) {
      const rows = this.query(`SELECT * FROM ${table}`);
      dump += `-- Table: ${table} (${rows.length} rows)\n`;
      for (const row of rows) {
        const keys = Object.keys(row);
        const values = keys.map(k => {
          const val = (row as any)[k];
          if (val === null || val === undefined) return "NULL";
          if (typeof val === "number") return val;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        dump += `INSERT OR REPLACE INTO ${table} (${keys.join(", ")}) VALUES (${values.join(", ")});\n`;
      }
      dump += "\n";
    }

    dump += "COMMIT;\n";
    return dump;
  }

  // Full reset
  public resetToDefaults() {
    if (!this.db) return;
    this.db.exec(`
      DROP TABLE IF EXISTS computers;
      DROP TABLE IF EXISTS cartridge_models;
      DROP TABLE IF EXISTS toner_tubs;
      DROP TABLE IF EXISTS weighing_logs;
      DROP TABLE IF EXISTS audit_logs;
      DROP TABLE IF EXISTS alert_settings;
      DROP TABLE IF EXISTS it_tickets;
      DROP TABLE IF EXISTS it_servers;
      DROP TABLE IF EXISTS it_vlans;
      DROP TABLE IF EXISTS it_licenses;
      DROP TABLE IF EXISTS service_memos;
    `);
    this.createTablesAndSeed();
    this.saveToStorage();
  }

  // --- TYPED REPOSITORY ACCESS METHODS ---

  public getComputers(): Computer[] {
    const rows = this.query<any>("SELECT * FROM computers ORDER BY name ASC");
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      assignedUserId: r.assigned_user_id || "",
      assignedUserName: r.assigned_user_name || "",
      os: r.os || "",
      cpu: r.cpu || "",
      ram: r.ram || "",
      storage: r.storage || "",
      ipv4: r.ipv4 || "",
      mac: r.mac || "",
      status: r.status as Computer["status"],
      lastCheck: r.last_check || "",
      integrityHash: r.integrity_hash || "",
      services: r.services_json ? JSON.parse(r.services_json) : [],
      department: r.department || undefined,
      subdepartment: r.subdepartment || undefined
    }));
  }

  public saveComputers(computers: Computer[]) {
    if (!this.db) return;
    this.db.exec("BEGIN TRANSACTION; DELETE FROM computers;");
    const stmt = this.db.prepare(`
      INSERT INTO computers (
        id, name, assigned_user_id, assigned_user_name, os, cpu, ram, storage,
        ipv4, mac, status, last_check, integrity_hash, services_json, department, subdepartment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of computers) {
      stmt.run([
        c.id, c.name, c.assignedUserId, c.assignedUserName, c.os, c.cpu, c.ram, c.storage,
        c.ipv4, c.mac, c.status, c.lastCheck, c.integrityHash,
        JSON.stringify(c.services || []), c.department || "", c.subdepartment || ""
      ]);
    }
    stmt.free();
    this.db.exec("COMMIT;");
    this.saveToStorage();
  }

  public getCartridgeModels(): CartridgeModel[] {
    const rows = this.query<any>("SELECT * FROM cartridge_models ORDER BY name ASC");
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      printerModel: r.printer_model,
      emptyWeight: r.empty_weight,
      fullWeight: r.full_weight,
      tonerWeight: r.toner_weight
    }));
  }

  public saveCartridgeModels(models: CartridgeModel[]) {
    if (!this.db) return;
    this.db.exec("BEGIN TRANSACTION; DELETE FROM cartridge_models;");
    const stmt = this.db.prepare(`
      INSERT INTO cartridge_models (
        id, name, printer_model, empty_weight, full_weight, toner_weight
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const cm of models) {
      stmt.run([
        cm.id, cm.name, cm.printerModel, cm.emptyWeight, cm.fullWeight, cm.tonerWeight
      ]);
    }
    stmt.free();
    this.db.exec("COMMIT;");
    this.saveToStorage();
  }

  public getTonerTubs(): TonerTub[] {
    const rows = this.query<any>("SELECT * FROM toner_tubs ORDER BY name ASC");
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      brand: r.brand,
      capacityGrams: r.capacity_grams,
      remainingGrams: r.remaining_grams,
      color: r.color
    }));
  }

  public saveTonerTubs(tubs: TonerTub[]) {
    if (!this.db) return;
    this.db.exec("BEGIN TRANSACTION; DELETE FROM toner_tubs;");
    const stmt = this.db.prepare(`
      INSERT INTO toner_tubs (
        id, name, brand, capacity_grams, remaining_grams, color
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const tub of tubs) {
      stmt.run([
        tub.id, tub.name, tub.brand, tub.capacityGrams, tub.remainingGrams, tub.color
      ]);
    }
    stmt.free();
    this.db.exec("COMMIT;");
    this.saveToStorage();
  }

  public getWeighingLogs(): WeighingLog[] {
    const rows = this.query<any>("SELECT * FROM weighing_logs ORDER BY date DESC");
    return rows.map(r => ({
      id: r.id,
      modelId: r.model_id,
      modelName: r.model_name,
      measuredWeight: r.measured_weight,
      fillPercentage: r.fill_percentage,
      date: r.date,
      operator: r.operator,
      status: r.status,
      notes: r.notes
    }));
  }

  public saveWeighingLogs(logs: WeighingLog[]) {
    if (!this.db) return;
    this.db.exec("BEGIN TRANSACTION; DELETE FROM weighing_logs;");
    const stmt = this.db.prepare(`
      INSERT INTO weighing_logs (
        id, model_id, model_name, measured_weight, fill_percentage, date, operator, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const wl of logs) {
      stmt.run([
        wl.id, wl.modelId, wl.modelName, wl.measuredWeight, wl.fillPercentage,
        wl.date, wl.operator, wl.status, wl.notes || ""
      ]);
    }
    stmt.free();
    this.db.exec("COMMIT;");
    this.saveToStorage();
  }

  public getAuditLogs(): AuditLog[] {
    const rows = this.query<any>("SELECT * FROM audit_logs ORDER BY timestamp DESC");
    return rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      user: r.user,
      role: r.role,
      action: r.action,
      type: r.type,
      details: r.details,
      ip: r.ip
    }));
  }

  public saveAuditLogs(logs: AuditLog[]) {
    if (!this.db) return;
    this.db.exec("BEGIN TRANSACTION; DELETE FROM audit_logs;");
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (
        id, timestamp, user, role, action, type, details, ip
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const al of logs) {
      stmt.run([
        al.id, al.timestamp, al.user, al.role, al.action, al.type, al.details, al.ip
      ]);
    }
    stmt.free();
    this.db.exec("COMMIT;");
    this.saveToStorage();
  }

  public getAlertSettings(): AlertSettings {
    const row = this.query<any>("SELECT * FROM alert_settings LIMIT 1")[0];
    if (!row) return defaultAlertSettings;
    return {
      telegramBotToken: row.telegram_bot_token || "",
      telegramChatId: row.telegram_chat_id || "",
      smsApiUrl: row.sms_api_url || "",
      smsApiKey: row.sms_api_key || "",
      cpuThreshold: row.cpu_threshold ?? 85,
      tempThreshold: row.temp_threshold ?? 75,
      tonerTubThreshold: row.toner_tub_threshold ?? 20
    };
  }

  public saveAlertSettings(settings: AlertSettings) {
    if (!this.db) return;
    this.db.exec("DELETE FROM alert_settings;");
    const stmt = this.db.prepare(`
      INSERT INTO alert_settings (
        id, telegram_bot_token, telegram_chat_id, sms_api_url, sms_api_key,
        cpu_threshold, temp_threshold, toner_tub_threshold
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      "default", settings.telegramBotToken, settings.telegramChatId,
      settings.smsApiUrl, settings.smsApiKey,
      settings.cpuThreshold, settings.tempThreshold,
      settings.tonerTubThreshold
    ]);
    stmt.free();
    this.saveToStorage();
  }

  public getITTickets(): ITTicket[] {
    const rows = this.query<any>("SELECT * FROM it_tickets ORDER BY created_at DESC");
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      priority: r.priority,
      status: r.status,
      category: r.category,
      assignee: r.assignee,
      requester: r.requester,
      department: r.department,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  public saveITTickets(tickets: ITTicket[]) {
    if (!this.db) return;
    this.db.exec("BEGIN TRANSACTION; DELETE FROM it_tickets;");
    const stmt = this.db.prepare(`
      INSERT INTO it_tickets (
        id, title, description, priority, status, category, assignee, requester, department, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const t of tickets) {
      stmt.run([
        t.id, t.title, t.description, t.priority, t.status, t.category, t.assignee, t.requester, t.department, t.createdAt, t.updatedAt
      ]);
    }
    stmt.free();
    this.db.exec("COMMIT;");
    this.saveToStorage();
  }

  public getITServers(): ITServerNode[] {
    const rows = this.query<any>("SELECT * FROM it_servers ORDER BY id ASC");
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      role: r.role,
      ip: r.ip,
      os: r.os,
      uptime: r.uptime,
      cpuUsage: r.cpu_usage,
      ramUsage: r.ram_usage,
      diskUsage: r.disk_usage,
      pingMs: r.ping_ms,
      status: r.status,
      ports: r.ports_json ? JSON.parse(r.ports_json) : [],
      services: r.services_json ? JSON.parse(r.services_json) : []
    }));
  }

  public saveITServers(servers: ITServerNode[]) {
    if (!this.db) return;
    this.db.exec("BEGIN TRANSACTION; DELETE FROM it_servers;");
    const stmt = this.db.prepare(`
      INSERT INTO it_servers (
        id, name, role, ip, os, uptime, cpu_usage, ram_usage, disk_usage, ping_ms, status, ports_json, services_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of servers) {
      stmt.run([
        s.id, s.name, s.role, s.ip, s.os, s.uptime, s.cpuUsage, s.ramUsage, s.diskUsage, s.pingMs, s.status,
        JSON.stringify(s.ports || []), JSON.stringify(s.services || [])
      ]);
    }
    stmt.free();
    this.db.exec("COMMIT;");
    this.saveToStorage();
  }

  public getITVLANs(): ITVLAN[] {
    const rows = this.query<any>("SELECT * FROM it_vlans ORDER BY id ASC");
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      subnet: r.subnet,
      dhcpScope: r.dhcp_scope,
      gateway: r.gateway,
      activeHosts: r.active_hosts,
      purpose: r.purpose,
      color: r.color
    }));
  }

  public saveITVLANs(vlans: ITVLAN[]) {
    if (!this.db) return;
    this.db.exec("BEGIN TRANSACTION; DELETE FROM it_vlans;");
    const stmt = this.db.prepare(`
      INSERT INTO it_vlans (
        id, name, subnet, dhcp_scope, gateway, active_hosts, purpose, color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const v of vlans) {
      stmt.run([
        v.id, v.name, v.subnet, v.dhcpScope, v.gateway, v.activeHosts, v.purpose, v.color
      ]);
    }
    stmt.free();
    this.db.exec("COMMIT;");
    this.saveToStorage();
  }

  public getITLicenses(): ITLicense[] {
    const rows = this.query<any>("SELECT * FROM it_licenses ORDER BY id ASC");
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      vendor: r.vendor,
      type: r.type,
      usedSeats: r.used_seats,
      totalSeats: r.total_seats,
      expiresAt: r.expires_at,
      status: r.status
    }));
  }

  public saveITLicenses(licenses: ITLicense[]) {
    if (!this.db) return;
    this.db.exec("BEGIN TRANSACTION; DELETE FROM it_licenses;");
    const stmt = this.db.prepare(`
      INSERT INTO it_licenses (
        id, name, vendor, type, used_seats, total_seats, expires_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const l of licenses) {
      stmt.run([
        l.id, l.name, l.vendor, l.type, l.usedSeats, l.totalSeats, l.expiresAt, l.status
      ]);
    }
    stmt.free();
    this.db.exec("COMMIT;");
    this.saveToStorage();
  }

  public getServiceMemos(): ServiceMemo[] {
    const rows = this.query<any>("SELECT * FROM service_memos ORDER BY created_date DESC");
    return rows.map(r => ({
      id: r.id,
      number: r.number,
      title: r.title,
      category: r.category as ServiceMemo["category"],
      priority: r.priority as ServiceMemo["priority"],
      status: r.status as ServiceMemo["status"],
      description: r.description || "",
      author: r.author || "",
      authorRole: r.author_role || "",
      department: r.department || "",
      recipient: r.recipient || "",
      createdDate: r.created_date || "",
      deadlineDate: r.deadline_date || "",
      notifyDaysBefore: r.notify_days_before ?? 15,
      estimatedCost: r.estimated_cost ?? 0,
      resolution: r.resolution || undefined,
      resolvedBy: r.resolved_by || undefined,
      resolvedDate: r.resolved_date || undefined,
      attachments: r.attachments_json ? JSON.parse(r.attachments_json) : [],
      comments: r.comments_json ? JSON.parse(r.comments_json) : [],
      tags: r.tags_json ? JSON.parse(r.tags_json) : []
    }));
  }

  public saveServiceMemos(memos: ServiceMemo[]) {
    if (!this.db) return;
    this.db.exec("BEGIN TRANSACTION; DELETE FROM service_memos;");
    const stmt = this.db.prepare(`
      INSERT INTO service_memos (
        id, number, title, category, priority, status, description, author, author_role,
        department, recipient, created_date, deadline_date, notify_days_before, estimated_cost,
        resolution, resolved_by, resolved_date, attachments_json, comments_json, tags_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const m of memos) {
      stmt.run([
        m.id, m.number, m.title, m.category, m.priority, m.status, m.description,
        m.author, m.authorRole, m.department, m.recipient, m.createdDate, m.deadlineDate,
        m.notifyDaysBefore ?? 15, m.estimatedCost ?? 0,
        m.resolution || "", m.resolvedBy || "", m.resolvedDate || "",
        JSON.stringify(m.attachments || []),
        JSON.stringify(m.comments || []),
        JSON.stringify(m.tags || [])
      ]);
    }
    stmt.free();
    this.db.exec("COMMIT;");
    this.saveToStorage();
  }

  public addServiceMemo(memo: ServiceMemo): boolean {
    if (!this.db) return false;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO service_memos (
        id, number, title, category, priority, status, description, author, author_role,
        department, recipient, created_date, deadline_date, notify_days_before, estimated_cost,
        resolution, resolved_by, resolved_date, attachments_json, comments_json, tags_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      memo.id, memo.number, memo.title, memo.category, memo.priority, memo.status, memo.description,
      memo.author, memo.authorRole, memo.department, memo.recipient, memo.createdDate, memo.deadlineDate,
      memo.notifyDaysBefore ?? 15, memo.estimatedCost ?? 0,
      memo.resolution || "", memo.resolvedBy || "", memo.resolvedDate || "",
      JSON.stringify(memo.attachments || []),
      JSON.stringify(memo.comments || []),
      JSON.stringify(memo.tags || [])
    ]);
    stmt.free();
    this.saveToStorage();
    return true;
  }

  public deleteServiceMemo(id: string): boolean {
    if (!this.db) return false;
    this.run("DELETE FROM service_memos WHERE id = ?", [id]);
    return true;
  }
}

export const sqliteDb = new SQLiteService();
