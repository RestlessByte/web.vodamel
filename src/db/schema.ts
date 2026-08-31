import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const computers = sqliteTable("computers", {
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
  services: text("services", { mode: "json" }).notNull().default("[]"),
  department: text("department").default(""),
  subdepartment: text("subdepartment").default(""),
  createdAt: text("created_at").default(""),
});

export const cartridgeModels = sqliteTable("cartridge_models", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  printerModel: text("printer_model").notNull().default(""),
  emptyWeight: real("empty_weight").notNull().default(0),
  fullWeight: real("full_weight").notNull().default(0),
  tonerWeight: real("toner_weight").notNull().default(0),
  createdAt: text("created_at").default(""),
});

export const tonerTubs = sqliteTable("toner_tubs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand").notNull().default(""),
  capacityGrams: real("capacity_grams").notNull().default(0),
  remainingGrams: real("remaining_grams").notNull().default(0),
  color: text("color").notNull().default("black"),
  createdAt: text("created_at").default(""),
});

export const weighingLogs = sqliteTable("weighing_logs", {
  id: text("id").primaryKey(),
  modelId: text("model_id").notNull().default(""),
  modelName: text("model_name").notNull().default(""),
  measuredWeight: real("measured_weight").notNull().default(0),
  fillPercentage: real("fill_percentage").notNull().default(0),
  date: text("date").notNull().default(""),
  operator: text("operator").notNull().default(""),
  status: text("status").notNull().default("perfect"),
  notes: text("notes").default(""),
  createdAt: text("created_at").default(""),
});

export const itTickets = sqliteTable("it_tickets", {
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

export const itServers = sqliteTable("it_servers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull().default(""),
  ip: text("ip").notNull().default(""),
  os: text("os").notNull().default(""),
  uptime: text("uptime").notNull().default(""),
  cpuUsage: real("cpu_usage").notNull().default(0),
  ramUsage: real("ram_usage").notNull().default(0),
  diskUsage: real("disk_usage").notNull().default(0),
  pingMs: real("ping_ms").notNull().default(0),
  status: text("status").notNull().default("ONLINE"),
  ports: text("ports", { mode: "json" }).notNull().default("[]"),
  services: text("services", { mode: "json" }).notNull().default("[]"),
  createdAt: text("created_at").default(""),
});

export const itVlans = sqliteTable("it_vlans", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  subnet: text("subnet").notNull().default(""),
  dhcpScope: text("dhcp_scope").notNull().default(""),
  gateway: text("gateway").notNull().default(""),
  activeHosts: integer("active_hosts").notNull().default(0),
  purpose: text("purpose").notNull().default(""),
  color: text("color").notNull().default("blue"),
  createdAt: text("created_at").default(""),
});

export const itLicenses = sqliteTable("it_licenses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  vendor: text("vendor").notNull().default(""),
  type: text("type").notNull().default("Subscription"),
  usedSeats: integer("used_seats").notNull().default(0),
  totalSeats: integer("total_seats").notNull().default(0),
  expiresAt: text("expires_at").notNull().default(""),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: text("created_at").default(""),
});

export const serviceMemos = sqliteTable("service_memos", {
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
  estimatedCost: real("estimated_cost").notNull().default(0),
  resolution: text("resolution").default(""),
  resolvedBy: text("resolved_by").default(""),
  resolvedDate: text("resolved_date").default(""),
  attachments: text("attachments", { mode: "json" }).notNull().default("[]"),
  comments: text("comments", { mode: "json" }).notNull().default("[]"),
  tags: text("tags", { mode: "json" }).notNull().default("[]"),
  createdAt: text("created_at").default(""),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  user: text("user").notNull(),
  role: text("role").notNull().default("ADMIN"),
  action: text("action").notNull(),
  type: text("type").notNull().default("info"),
  details: text("details").notNull(),
  ip: text("ip").notNull().default("127.0.0.1"),
  createdAt: text("created_at").default(""),
});

export const alertSettings = sqliteTable("alert_settings", {
  id: text("id").primaryKey().default("default"),
  telegramBotToken: text("telegram_bot_token").notNull().default(""),
  telegramChatId: text("telegram_chat_id").notNull().default(""),
  smsApiUrl: text("sms_api_url").notNull().default(""),
  smsApiKey: text("sms_api_key").notNull().default(""),
  cpuThreshold: real("cpu_threshold").notNull().default(85),
  tempThreshold: real("temp_threshold").notNull().default(75),
  tonerTubThreshold: real("toner_tub_threshold").notNull().default(20),
  updatedAt: text("updated_at").default(""),
});
