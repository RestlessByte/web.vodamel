import { pgTable, text, serial, integer, doublePrecision, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const computers = pgTable("computers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  assignedUserId: text("assigned_user_id").notNull().default(""),
  assignedUserName: text("assigned_user_name").notNull().default(""),
  os: text("os").notNull().default(""),
  cpu: text("cpu").notNull().default(""),
  ram: text("ram").notNull().default(""),
  storage: text("storage").notNull().default(""),
  ipv4: text("ipv4").notNull().default(""),
  mac: text("mac").notNull().default(""),
  status: text("status").notNull().default("OK"),
  lastCheck: text("last_check").notNull().default(""),
  integrityHash: text("integrity_hash").notNull().default(""),
  services: jsonb("services").notNull().default([]),
  department: text("department").default(""),
  subdepartment: text("subdepartment").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartridgeModels = pgTable("cartridge_models", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  printerModel: text("printer_model").notNull().default(""),
  emptyWeight: doublePrecision("empty_weight").notNull().default(0),
  fullWeight: doublePrecision("full_weight").notNull().default(0),
  tonerWeight: doublePrecision("toner_weight").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tonerTubs = pgTable("toner_tubs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand").notNull().default(""),
  capacityGrams: doublePrecision("capacity_grams").notNull().default(0),
  remainingGrams: doublePrecision("remaining_grams").notNull().default(0),
  color: text("color").notNull().default("black"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const weighingLogs = pgTable("weighing_logs", {
  id: text("id").primaryKey(),
  modelId: text("model_id").notNull().default(""),
  modelName: text("model_name").notNull().default(""),
  measuredWeight: doublePrecision("measured_weight").notNull().default(0),
  fillPercentage: doublePrecision("fill_percentage").notNull().default(0),
  date: text("date").notNull().default(""),
  operator: text("operator").notNull().default(""),
  status: text("status").notNull().default("perfect"),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const itTickets = pgTable("it_tickets", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  priority: text("priority").notNull().default("MEDIUM"),
  status: text("status").notNull().default("NEW"),
  category: text("category").notNull().default("HARDWARE"),
  assignee: text("assignee").notNull().default(""),
  requester: text("requester").notNull().default(""),
  department: text("department").notNull().default(""),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
});

export const itServers = pgTable("it_servers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull().default(""),
  ip: text("ip").notNull().default(""),
  os: text("os").notNull().default(""),
  uptime: text("uptime").notNull().default(""),
  cpuUsage: doublePrecision("cpu_usage").notNull().default(0),
  ramUsage: doublePrecision("ram_usage").notNull().default(0),
  diskUsage: doublePrecision("disk_usage").notNull().default(0),
  pingMs: doublePrecision("ping_ms").notNull().default(0),
  status: text("status").notNull().default("ONLINE"),
  ports: jsonb("ports").notNull().default([]),
  services: jsonb("services").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const itVlans = pgTable("it_vlans", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  subnet: text("subnet").notNull().default(""),
  dhcpScope: text("dhcp_scope").notNull().default(""),
  gateway: text("gateway").notNull().default(""),
  activeHosts: integer("active_hosts").notNull().default(0),
  purpose: text("purpose").notNull().default(""),
  color: text("color").notNull().default("blue"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const itLicenses = pgTable("it_licenses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  vendor: text("vendor").notNull().default(""),
  type: text("type").notNull().default("Subscription"),
  usedSeats: integer("used_seats").notNull().default(0),
  totalSeats: integer("total_seats").notNull().default(0),
  expiresAt: text("expires_at").notNull().default(""),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const serviceMemos = pgTable("service_memos", {
  id: text("id").primaryKey(),
  number: text("number").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull().default("OTHER"),
  priority: text("priority").notNull().default("NORMAL"),
  status: text("status").notNull().default("DRAFT"),
  description: text("description").notNull().default(""),
  author: text("author").notNull().default(""),
  authorRole: text("author_role").notNull().default(""),
  department: text("department").notNull().default(""),
  recipient: text("recipient").notNull().default(""),
  createdDate: text("created_date").notNull().default(""),
  deadlineDate: text("deadline_date").notNull().default(""),
  notifyDaysBefore: integer("notify_days_before").notNull().default(15),
  estimatedCost: doublePrecision("estimated_cost").notNull().default(0),
  resolution: text("resolution").default(""),
  resolvedBy: text("resolved_by").default(""),
  resolvedDate: text("resolved_date").default(""),
  attachments: jsonb("attachments").notNull().default([]),
  comments: jsonb("comments").notNull().default([]),
  tags: jsonb("tags").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  user: text("user").notNull(),
  role: text("role").notNull().default("ADMIN"),
  action: text("action").notNull(),
  type: text("type").notNull().default("info"),
  details: text("details").notNull(),
  ip: text("ip").notNull().default("127.0.0.1"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alertSettings = pgTable("alert_settings", {
  id: text("id").primaryKey().default("default"),
  telegramBotToken: text("telegram_bot_token").notNull().default(""),
  telegramChatId: text("telegram_chat_id").notNull().default(""),
  smsApiUrl: text("sms_api_url").notNull().default(""),
  smsApiKey: text("sms_api_key").notNull().default(""),
  cpuThreshold: doublePrecision("cpu_threshold").notNull().default(85),
  tempThreshold: doublePrecision("temp_threshold").notNull().default(75),
  tonerTubThreshold: doublePrecision("toner_tub_threshold").notNull().default(20),
  updatedAt: timestamp("updated_at").defaultNow(),
});
