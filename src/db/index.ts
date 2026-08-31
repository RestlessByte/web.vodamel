import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import path from 'path';
import * as schema from './schema.ts';

const dbPath = path.join(process.cwd(), 'archon_inventory.sqlite');
const client = createClient({
  url: `file:${dbPath}`,
});

export const sqliteClient = client;
export const db = drizzle(client, { schema });

// Auto-initialize tables on startup
export async function initSqliteDatabase() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS computers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        assigned_user_id TEXT DEFAULT '',
        assigned_user_name TEXT DEFAULT '',
        os TEXT DEFAULT '',
        cpu TEXT DEFAULT '',
        ram TEXT DEFAULT '',
        storage TEXT DEFAULT '',
        ipv4 TEXT DEFAULT '',
        mac TEXT DEFAULT '',
        status TEXT DEFAULT 'OK',
        last_check TEXT DEFAULT '',
        integrity_hash TEXT DEFAULT '',
        services TEXT DEFAULT '[]',
        department TEXT DEFAULT '',
        subdepartment TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS cartridge_models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        printer_model TEXT DEFAULT '',
        empty_weight REAL DEFAULT 0,
        full_weight REAL DEFAULT 0,
        toner_weight REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS toner_tubs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT DEFAULT '',
        capacity_grams REAL DEFAULT 0,
        remaining_grams REAL DEFAULT 0,
        color TEXT DEFAULT 'black',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS weighing_logs (
        id TEXT PRIMARY KEY,
        model_id TEXT DEFAULT '',
        model_name TEXT DEFAULT '',
        measured_weight REAL DEFAULT 0,
        fill_percentage REAL DEFAULT 0,
        date TEXT DEFAULT '',
        operator TEXT DEFAULT '',
        status TEXT DEFAULT 'perfect',
        notes TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS it_tickets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        priority TEXT DEFAULT 'MEDIUM',
        status TEXT DEFAULT 'NEW',
        category TEXT DEFAULT 'HARDWARE',
        assignee TEXT DEFAULT '',
        requester TEXT DEFAULT '',
        department TEXT DEFAULT '',
        created_at TEXT DEFAULT '',
        updated_at TEXT DEFAULT ''
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS it_servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT DEFAULT '',
        ip TEXT DEFAULT '',
        os TEXT DEFAULT '',
        uptime TEXT DEFAULT '',
        cpu_usage REAL DEFAULT 0,
        ram_usage REAL DEFAULT 0,
        disk_usage REAL DEFAULT 0,
        ping_ms REAL DEFAULT 0,
        status TEXT DEFAULT 'ONLINE',
        ports TEXT DEFAULT '[]',
        services TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS it_vlans (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        subnet TEXT DEFAULT '',
        dhcp_scope TEXT DEFAULT '',
        gateway TEXT DEFAULT '',
        active_hosts INTEGER DEFAULT 0,
        purpose TEXT DEFAULT '',
        color TEXT DEFAULT 'blue',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS it_licenses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        vendor TEXT DEFAULT '',
        type TEXT DEFAULT 'Subscription',
        used_seats INTEGER DEFAULT 0,
        total_seats INTEGER DEFAULT 0,
        expires_at TEXT DEFAULT '',
        status TEXT DEFAULT 'ACTIVE',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS service_memos (
        id TEXT PRIMARY KEY,
        number TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'OTHER',
        priority TEXT DEFAULT 'NORMAL',
        status TEXT DEFAULT 'DRAFT',
        description TEXT DEFAULT '',
        author TEXT DEFAULT '',
        authorRole TEXT DEFAULT '',
        department TEXT DEFAULT '',
        recipient TEXT DEFAULT '',
        created_date TEXT DEFAULT '',
        deadline_date TEXT DEFAULT '',
        notify_days_before INTEGER DEFAULT 15,
        estimated_cost REAL DEFAULT 0,
        resolution TEXT DEFAULT '',
        resolved_by TEXT DEFAULT '',
        resolved_date TEXT DEFAULT '',
        attachments TEXT DEFAULT '[]',
        comments TEXT DEFAULT '[]',
        tags TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        user TEXT NOT NULL,
        role TEXT DEFAULT 'ADMIN',
        action TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        details TEXT NOT NULL,
        ip TEXT DEFAULT '127.0.0.1',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS alert_settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        telegram_bot_token TEXT DEFAULT '',
        telegram_chat_id TEXT DEFAULT '',
        sms_api_url TEXT DEFAULT '',
        sms_api_key TEXT DEFAULT '',
        cpu_threshold REAL DEFAULT 85,
        temp_threshold REAL DEFAULT 75,
        toner_tub_threshold REAL DEFAULT 20,
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    console.log("SQLite schema tables verified and ready (archon_inventory.sqlite)");

    // Auto-seed if computers table is empty
    const checkRes = await client.execute("SELECT count(*) as count FROM computers;");
    const count = Number(checkRes.rows[0]?.count ?? checkRes.rows[0]?.[0] ?? 0);
    if (count === 0) {
      console.log("Seeding initial fleet and inventory data into SQLite...");
      await seedDatabase();
    }
  } catch (err) {
    console.error("Error initializing SQLite database:", err);
  }
}

export async function seedDatabase() {
  const { 
    initialComputers, 
    initialCartridgeModels, 
    initialTonerTubs, 
    initialWeighingLogs, 
    initialITTickets, 
    initialITServers, 
    initialITVLANs, 
    initialITLicenses, 
    initialServiceMemos, 
    initialAuditLogs 
  } = await import("../data.ts");

  for (const pc of initialComputers) {
    await db.insert(schema.computers).values({
      id: pc.id,
      name: pc.name,
      assignedUserId: pc.assignedUserId,
      assignedUserName: pc.assignedUserName,
      os: pc.os,
      cpu: pc.cpu,
      ram: pc.ram,
      storage: pc.storage,
      ipv4: pc.ipv4,
      mac: pc.mac,
      status: pc.status,
      lastCheck: pc.lastCheck,
      integrityHash: pc.integrityHash,
      services: JSON.stringify(pc.services),
      department: pc.department || "",
      subdepartment: pc.subdepartment || ""
    }).onConflictDoNothing();
  }

  for (const cm of initialCartridgeModels) {
    await db.insert(schema.cartridgeModels).values({
      id: cm.id,
      name: cm.name,
      printerModel: cm.printerModel,
      emptyWeight: cm.emptyWeight,
      fullWeight: cm.fullWeight,
      tonerWeight: cm.tonerWeight
    }).onConflictDoNothing();
  }

  for (const tub of initialTonerTubs) {
    await db.insert(schema.tonerTubs).values({
      id: tub.id,
      name: tub.name,
      brand: tub.brand,
      capacityGrams: tub.capacityGrams,
      remainingGrams: tub.remainingGrams,
      color: tub.color
    }).onConflictDoNothing();
  }

  for (const log of initialWeighingLogs) {
    await db.insert(schema.weighingLogs).values({
      id: log.id,
      modelId: log.modelId,
      modelName: log.modelName,
      measuredWeight: log.measuredWeight,
      fillPercentage: log.fillPercentage,
      date: log.date,
      operator: log.operator,
      status: log.status,
      notes: log.notes || ""
    }).onConflictDoNothing();
  }

  for (const ticket of initialITTickets) {
    await db.insert(schema.itTickets).values({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      category: ticket.category,
      assignee: ticket.assignee,
      requester: ticket.requester,
      department: ticket.department,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt
    }).onConflictDoNothing();
  }

  for (const srv of initialITServers) {
    await db.insert(schema.itServers).values({
      id: srv.id,
      name: srv.name,
      role: srv.role,
      ip: srv.ip,
      os: srv.os,
      uptime: srv.uptime,
      cpuUsage: srv.cpuUsage,
      ramUsage: srv.ramUsage,
      diskUsage: srv.diskUsage,
      pingMs: srv.pingMs,
      status: srv.status,
      ports: JSON.stringify(srv.ports),
      services: JSON.stringify(srv.services)
    }).onConflictDoNothing();
  }

  for (const vlan of initialITVLANs) {
    await db.insert(schema.itVlans).values({
      id: vlan.id,
      name: vlan.name,
      subnet: vlan.subnet,
      dhcpScope: vlan.dhcpScope,
      gateway: vlan.gateway,
      activeHosts: vlan.activeHosts,
      purpose: vlan.purpose,
      color: vlan.color
    }).onConflictDoNothing();
  }

  for (const lic of initialITLicenses) {
    await db.insert(schema.itLicenses).values({
      id: lic.id,
      name: lic.name,
      vendor: lic.vendor,
      type: lic.type,
      usedSeats: lic.usedSeats,
      totalSeats: lic.totalSeats,
      expiresAt: lic.expiresAt,
      status: lic.status
    }).onConflictDoNothing();
  }

  for (const memo of initialServiceMemos) {
    await db.insert(schema.serviceMemos).values({
      id: memo.id,
      number: memo.number,
      title: memo.title,
      category: memo.category,
      priority: memo.priority,
      status: memo.status,
      description: memo.description,
      author: memo.author,
      authorRole: memo.authorRole,
      department: memo.department,
      recipient: memo.recipient,
      createdDate: memo.createdDate,
      deadlineDate: memo.deadlineDate,
      notifyDaysBefore: memo.notifyDaysBefore,
      estimatedCost: memo.estimatedCost,
      resolution: memo.resolution || "",
      resolvedBy: memo.resolvedBy || "",
      resolvedDate: memo.resolvedDate || "",
      attachments: JSON.stringify(memo.attachments),
      comments: JSON.stringify(memo.comments),
      tags: JSON.stringify(memo.tags)
    }).onConflictDoNothing();
  }

  for (const aud of initialAuditLogs) {
    await db.insert(schema.auditLogs).values({
      id: aud.id,
      timestamp: aud.timestamp,
      user: aud.user,
      role: aud.role,
      action: aud.action,
      type: aud.type,
      details: aud.details,
      ip: aud.ip
    }).onConflictDoNothing();
  }

  console.log("SQLite database seeded successfully with full fleet data.");
}
