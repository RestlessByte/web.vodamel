import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db, sqliteClient, initSqliteDatabase, seedDatabase } from "./src/db/index.ts";
import * as schema from "./src/db/schema.ts";
import { eq, desc } from "drizzle-orm";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite database schema
  await initSqliteDatabase();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // --- API HEALTH & DB STATUS ---
  app.get("/api/health", async (req, res) => {
    try {
      const result = await sqliteClient.execute("SELECT 1 as connected;");
      res.json({
        status: "ok",
        db: "connected",
        engine: "SQLite 3 (Local Database)",
        file: "archon_inventory.sqlite"
      });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: err.message });
    }
  });

  // --- COMPUTERS CRUD ---
  app.get("/api/computers", async (req, res) => {
    try {
      const items = await db.select().from(schema.computers).orderBy(desc(schema.computers.createdAt));
      res.json(items);
    } catch (err: any) {
      console.error("GET /api/computers error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/computers", async (req, res) => {
    try {
      const body = req.body;
      if (!body.id) body.id = `pc-${Date.now()}`;
      await db.insert(schema.computers).values(body).onConflictDoUpdate({
        target: schema.computers.id,
        set: body,
      });
      res.json({ success: true, item: body });
    } catch (err: any) {
      console.error("POST /api/computers error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/computers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.computers).where(eq(schema.computers.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      console.error("DELETE /api/computers error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- CARTRIDGE MODELS CRUD ---
  app.get("/api/cartridge-models", async (req, res) => {
    try {
      const items = await db.select().from(schema.cartridgeModels).orderBy(desc(schema.cartridgeModels.createdAt));
      res.json(items);
    } catch (err: any) {
      console.error("GET /api/cartridge-models error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/cartridge-models", async (req, res) => {
    try {
      const body = req.body;
      if (!body.id) body.id = `m-${Date.now()}`;
      await db.insert(schema.cartridgeModels).values(body).onConflictDoUpdate({
        target: schema.cartridgeModels.id,
        set: body,
      });
      res.json({ success: true, item: body });
    } catch (err: any) {
      console.error("POST /api/cartridge-models error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/cartridge-models/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.cartridgeModels).where(eq(schema.cartridgeModels.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      console.error("DELETE /api/cartridge-models error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- TONER TUBS CRUD ---
  app.get("/api/toner-tubs", async (req, res) => {
    try {
      const items = await db.select().from(schema.tonerTubs).orderBy(desc(schema.tonerTubs.createdAt));
      res.json(items);
    } catch (err: any) {
      console.error("GET /api/toner-tubs error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/toner-tubs", async (req, res) => {
    try {
      const body = req.body;
      if (!body.id) body.id = `t-${Date.now()}`;
      await db.insert(schema.tonerTubs).values(body).onConflictDoUpdate({
        target: schema.tonerTubs.id,
        set: body,
      });
      res.json({ success: true, item: body });
    } catch (err: any) {
      console.error("POST /api/toner-tubs error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/toner-tubs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.tonerTubs).where(eq(schema.tonerTubs.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      console.error("DELETE /api/toner-tubs error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- WEIGHING LOGS CRUD ---
  app.get("/api/weighing-logs", async (req, res) => {
    try {
      const items = await db.select().from(schema.weighingLogs).orderBy(desc(schema.weighingLogs.createdAt));
      res.json(items);
    } catch (err: any) {
      console.error("GET /api/weighing-logs error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/weighing-logs", async (req, res) => {
    try {
      const body = req.body;
      if (!body.id) body.id = `log-${Date.now()}`;
      await db.insert(schema.weighingLogs).values(body).onConflictDoUpdate({
        target: schema.weighingLogs.id,
        set: body,
      });
      res.json({ success: true, item: body });
    } catch (err: any) {
      console.error("POST /api/weighing-logs error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/weighing-logs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.weighingLogs).where(eq(schema.weighingLogs.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      console.error("DELETE /api/weighing-logs error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- IT TICKETS CRUD ---
  app.get("/api/it-tickets", async (req, res) => {
    try {
      const items = await db.select().from(schema.itTickets);
      res.json(items);
    } catch (err: any) {
      console.error("GET /api/it-tickets error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/it-tickets", async (req, res) => {
    try {
      const body = req.body;
      if (!body.id) body.id = `INC-${Date.now()}`;
      await db.insert(schema.itTickets).values(body).onConflictDoUpdate({
        target: schema.itTickets.id,
        set: body,
      });
      res.json({ success: true, item: body });
    } catch (err: any) {
      console.error("POST /api/it-tickets error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/it-tickets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.itTickets).where(eq(schema.itTickets.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      console.error("DELETE /api/it-tickets error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- IT SERVERS CRUD ---
  app.get("/api/it-servers", async (req, res) => {
    try {
      const items = await db.select().from(schema.itServers).orderBy(desc(schema.itServers.createdAt));
      res.json(items);
    } catch (err: any) {
      console.error("GET /api/it-servers error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/it-servers", async (req, res) => {
    try {
      const body = req.body;
      if (!body.id) body.id = `srv-${Date.now()}`;
      await db.insert(schema.itServers).values(body).onConflictDoUpdate({
        target: schema.itServers.id,
        set: body,
      });
      res.json({ success: true, item: body });
    } catch (err: any) {
      console.error("POST /api/it-servers error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/it-servers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.itServers).where(eq(schema.itServers.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      console.error("DELETE /api/it-servers error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- IT VLANS CRUD ---
  app.get("/api/it-vlans", async (req, res) => {
    try {
      const items = await db.select().from(schema.itVlans);
      res.json(items);
    } catch (err: any) {
      console.error("GET /api/it-vlans error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/it-vlans", async (req, res) => {
    try {
      const body = req.body;
      if (typeof body.id !== "number") body.id = Number(body.id) || Date.now() % 4000;
      await db.insert(schema.itVlans).values(body).onConflictDoUpdate({
        target: schema.itVlans.id,
        set: body,
      });
      res.json({ success: true, item: body });
    } catch (err: any) {
      console.error("POST /api/it-vlans error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/it-vlans/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      await db.delete(schema.itVlans).where(eq(schema.itVlans.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      console.error("DELETE /api/it-vlans error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- IT LICENSES CRUD ---
  app.get("/api/it-licenses", async (req, res) => {
    try {
      const items = await db.select().from(schema.itLicenses).orderBy(desc(schema.itLicenses.createdAt));
      res.json(items);
    } catch (err: any) {
      console.error("GET /api/it-licenses error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/it-licenses", async (req, res) => {
    try {
      const body = req.body;
      if (!body.id) body.id = `lic-${Date.now()}`;
      await db.insert(schema.itLicenses).values(body).onConflictDoUpdate({
        target: schema.itLicenses.id,
        set: body,
      });
      res.json({ success: true, item: body });
    } catch (err: any) {
      console.error("POST /api/it-licenses error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/it-licenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.itLicenses).where(eq(schema.itLicenses.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      console.error("DELETE /api/it-licenses error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- SERVICE MEMOS CRUD ---
  app.get("/api/service-memos", async (req, res) => {
    try {
      const items = await db.select().from(schema.serviceMemos).orderBy(desc(schema.serviceMemos.createdAt));
      res.json(items);
    } catch (err: any) {
      console.error("GET /api/service-memos error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/service-memos", async (req, res) => {
    try {
      const body = req.body;
      if (!body.id) body.id = `memo-${Date.now()}`;
      await db.insert(schema.serviceMemos).values(body).onConflictDoUpdate({
        target: schema.serviceMemos.id,
        set: body,
      });
      res.json({ success: true, item: body });
    } catch (err: any) {
      console.error("POST /api/service-memos error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/service-memos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.serviceMemos).where(eq(schema.serviceMemos.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      console.error("DELETE /api/service-memos error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- AUDIT LOGS CRUD ---
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const items = await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.createdAt)).limit(100);
      res.json(items);
    } catch (err: any) {
      console.error("GET /api/audit-logs error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/audit-logs", async (req, res) => {
    try {
      const body = req.body;
      if (!body.id) body.id = `audit-${Date.now()}`;
      await db.insert(schema.auditLogs).values(body);
      res.json({ success: true, item: body });
    } catch (err: any) {
      console.error("POST /api/audit-logs error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/audit-logs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      console.error("DELETE /api/audit-logs error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/audit-logs", async (req, res) => {
    try {
      await db.delete(schema.auditLogs);
      res.json({ success: true });
    } catch (err: any) {
      console.error("DELETE ALL /api/audit-logs error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- ALERT SETTINGS ---
  app.get("/api/alert-settings", async (req, res) => {
    try {
      const rows = await db.select().from(schema.alertSettings).where(eq(schema.alertSettings.id, "default"));
      if (rows.length > 0) {
        res.json(rows[0]);
      } else {
        res.json({
          telegramBotToken: "",
          telegramChatId: "",
          smsApiUrl: "https://sms.ru/sms/send",
          smsApiKey: "",
          cpuThreshold: 85,
          tempThreshold: 75,
          tonerTubThreshold: 20
        });
      }
    } catch (err: any) {
      console.error("GET /api/alert-settings error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/alert-settings", async (req, res) => {
    try {
      const body = { ...req.body, id: "default", updatedAt: new Date().toISOString() };
      await db.insert(schema.alertSettings).values(body).onConflictDoUpdate({
        target: schema.alertSettings.id,
        set: body,
      });
      res.json({ success: true, item: body });
    } catch (err: any) {
      console.error("POST /api/alert-settings error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- SQL QUERY EXECUTION FOR DATABASE CONSOLE ---
  app.post("/api/sql-query", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query string is required" });
      }

      let sqlToExecute = query.trim();
      const lower = sqlToExecute.toLowerCase();

      // Compatibility translation for meta commands & pg queries to SQLite
      if (
        lower === "\\dt" ||
        lower === "\\d" ||
        lower.startsWith("\\dt ") ||
        lower === ".tables" ||
        lower.includes("information_schema.tables")
      ) {
        sqlToExecute = "SELECT name as table_name, type, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;";
      } else if (lower.startsWith("\\d ") || lower.startsWith(".schema ")) {
        const tableName = sqlToExecute.split(/\s+/)[1]?.replace(/['";]/g, "") || "computers";
        sqlToExecute = `PRAGMA table_info('${tableName}');`;
      } else if (lower === "\\conninfo" || lower === ".dbinfo") {
        sqlToExecute = "SELECT 'SQLite 3 (Local Database)' as engine, 'archon_inventory.sqlite' as database_file, sqlite_version() as version;";
      }

      const startTime = Date.now();
      const result = await sqliteClient.execute(sqlToExecute);
      const duration = Date.now() - startTime;

      // Extract column names
      const columns = result.columns || [];
      const rows = (result.rows || []).map(row => {
        if (Array.isArray(row)) {
          const obj: Record<string, any> = {};
          columns.forEach((col, idx) => {
            obj[col] = row[idx];
          });
          return obj;
        }
        return row;
      });

      res.json({
        columns,
        rows,
        rowCount: result.rowsAffected ?? rows.length,
        durationMs: duration
      });
    } catch (err: any) {
      console.error("POST /api/sql-query error:", err);
      res.status(400).json({ error: err.message || "SQLite execution error" });
    }
  });

  // --- RE-SEED DEFAULT DATA ---
  app.post("/api/seed", async (req, res) => {
    try {
      await seedDatabase();
      res.json({ success: true, message: "База данных SQLite успешно заполнена эталонными данными парка и склада" });
    } catch (err: any) {
      console.error("POST /api/seed error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- CLEAR / RESET ALL TABLES ---
  app.post("/api/reset-all", async (req, res) => {
    try {
      await sqliteClient.batch([
        "DELETE FROM computers;",
        "DELETE FROM cartridge_models;",
        "DELETE FROM toner_tubs;",
        "DELETE FROM weighing_logs;",
        "DELETE FROM it_tickets;",
        "DELETE FROM it_servers;",
        "DELETE FROM it_vlans;",
        "DELETE FROM it_licenses;",
        "DELETE FROM service_memos;",
        "DELETE FROM audit_logs;"
      ]);
      res.json({ success: true, message: "Все таблицы локальной базы данных SQLite успешно очищены" });
    } catch (err: any) {
      console.error("POST /api/reset-all error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- VITE MIDDLEWARE FOR DEV & SPA SERVING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Archon IT Server (SQLite 3 Local) running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
