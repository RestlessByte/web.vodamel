import React, { useState, useMemo, useRef } from "react";
import {
  Folder,
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  Plus,
  Paperclip,
  Printer,
  FileCheck,
  Building2,
  User,
  Shield,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  FileImage,
  FileCode,
  Check,
  X,
  MessageSquare,
  Send,
  SlidersHorizontal,
  BellRing
} from "lucide-react";
import {
  ServiceMemo,
  ServiceMemoCategory,
  ServiceMemoPriority,
  ServiceMemoStatus,
  MemoAttachment,
  MemoComment,
  UserRole
} from "../types";
import { dbService } from "../services/apiClient";

interface ServiceMemosFolderProps {
  memos: ServiceMemo[];
  onSaveMemos: (memos: ServiceMemo[]) => void;
  currentUserRole?: UserRole;
  currentOperatorName?: string;
}

const CATEGORIES: { id: ServiceMemoCategory | "ALL"; label: string; icon: any; color: string }[] = [
  { id: "ALL", label: "Все категории", icon: Layers, color: "text-indigo-400" },
  { id: "PURCHASE", label: "Закупка ЗИП и оборудования", icon: FileSpreadsheet, color: "text-emerald-400" },
  { id: "WRITE_OFF", label: "Списание ОС и техники", icon: Trash2, color: "text-rose-400" },
  { id: "ACCESS_VPN", label: "Доступы, 1С и VPN", icon: Shield, color: "text-blue-400" },
  { id: "MAINTENANCE", label: "Ремонт и ТО", icon: RefreshCw, color: "text-amber-400" },
  { id: "UPGRADE", label: "Модернизация серверов", icon: Sparkles, color: "text-purple-400" },
  { id: "SECURITY", label: "Безопасность и регламенты", icon: Shield, color: "text-teal-400" },
  { id: "STAFF", label: "Кадры и командировки", icon: User, color: "text-cyan-400" },
  { id: "OTHER", label: "Прочие служебки", icon: Folder, color: "text-slate-400" }
];

const TEMPLATES = [
  {
    title: "Срочная закупка тонера и фотобарабанов",
    category: "PURCHASE" as ServiceMemoCategory,
    priority: "URGENT" as ServiceMemoPriority,
    cost: 55000,
    recipient: "Козлов Д. В. (Руководитель IT)",
    desc: "В связи с критическим остатком тонера для складских картриджей HP 85A/78A (менее 10% от нормы) и возросшим объемом маркировочной печати, прошу согласовать закупку расходных материалов согласно спецификации.",
    tags: ["Тонер", "Склад", "Срочно", "Картриджи"]
  },
  {
    title: "Списание вышедшего из строя ПК склада",
    category: "WRITE_OFF" as ServiceMemoCategory,
    priority: "HIGH" as ServiceMemoPriority,
    cost: 0,
    recipient: "Козлов Д. В. (Руководитель IT)",
    desc: "В результате короткого замыкания повреждена системная плата и накопитель рабочего ПК. Восстановление экономически нецелесообразно. Прошу оформить списание по акту тех. состояния №ОТК-88.",
    tags: ["Списание", "ОТК", "Акт", "Оборудование"]
  },
  {
    title: "Предоставление прав к 1С:Склад и WireGuard VPN",
    category: "ACCESS_VPN" as ServiceMemoCategory,
    priority: "NORMAL" as ServiceMemoPriority,
    cost: 0,
    recipient: "Козлов Д. В. (Руководитель IT)",
    desc: "Прошу организовать доменную учетную запись Active Directory, предоставить права оператора в базе 1С:Предприятие и выдать конфигурационный файл WireGuard для удаленной работы.",
    tags: ["1С", "VPN", "Доступы", "Active Directory"]
  },
  {
    title: "Плановая замена аккумуляторов серверных ИБП",
    category: "MAINTENANCE" as ServiceMemoCategory,
    priority: "HIGH" as ServiceMemoPriority,
    cost: 92000,
    recipient: "Генеральный директор / Главный энергетик",
    desc: "Срок службы батарейных блоков APC RBC44 в серверной стойке превысил нормативный срок 3 года. Требуется плановая закупка и замена 2 комплектов АКБ для обеспечения автономности серверов.",
    tags: ["ИБП", "Серверная", "ТО", "Питание"]
  }
];

export default function ServiceMemosFolder({
  memos,
  onSaveMemos,
  currentUserRole = UserRole.ADMIN,
  currentOperatorName = "Дмитрий Козлов (Руководитель IT)"
}: ServiceMemosFolderProps) {
  const [selectedCategory, setSelectedCategory] = useState<ServiceMemoCategory | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState<"ALL" | "URGENT_15_DAYS" | "OVERDUE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(memos[0]?.id || null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");

  // New Memo Form State
  const [newMemo, setNewMemo] = useState<Partial<ServiceMemo>>({
    title: "",
    category: "PURCHASE",
    priority: "NORMAL",
    status: "PENDING_APPROVAL",
    description: "",
    author: currentOperatorName,
    authorRole: "Начальник IT-отдела",
    department: "IT-служба",
    recipient: "Козлов Д. В. (Руководитель IT-отдела)",
    createdDate: new Date().toISOString().split("T")[0],
    deadlineDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notifyDaysBefore: 15,
    estimatedCost: 0,
    attachments: [],
    comments: [],
    tags: []
  });

  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const memoAttachmentInputRef = useRef<HTMLInputElement>(null);

  // Helper to calculate days remaining until deadline
  const getDaysRemaining = (deadlineStr: string): number => {
    if (!deadlineStr) return 999;
    const now = new Date();
    // Use midnight of current day
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [year, month, day] = deadlineStr.split("-").map(Number);
    const deadline = new Date(year, (month || 1) - 1, day || 1);
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Find active memo
  const activeMemo = useMemo(() => {
    return memos.find((m) => m.id === selectedMemoId) || memos[0] || null;
  }, [memos, selectedMemoId]);

  // Urgent memos needing attention (<= 15 days left and not closed)
  const urgentMemos = useMemo(() => {
    return memos.filter((m) => {
      if (m.status === "COMPLETED" || m.status === "REJECTED") return false;
      const days = getDaysRemaining(m.deadlineDate);
      return days <= (m.notifyDaysBefore || 15);
    });
  }, [memos]);

  // Filtered memos
  const filteredMemos = useMemo(() => {
    return memos.filter((m) => {
      // Category
      if (selectedCategory !== "ALL" && m.category !== selectedCategory) return false;
      // Status
      if (selectedStatus !== "ALL" && m.status !== selectedStatus) return false;
      // Urgency
      if (urgencyFilter === "URGENT_15_DAYS") {
        const days = getDaysRemaining(m.deadlineDate);
        if (days > 15 || days < 0 || m.status === "COMPLETED" || m.status === "REJECTED") return false;
      } else if (urgencyFilter === "OVERDUE") {
        const days = getDaysRemaining(m.deadlineDate);
        if (days >= 0 || m.status === "COMPLETED" || m.status === "REJECTED") return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inNum = (m.number || "").toLowerCase().includes(q);
        const inTitle = (m.title || "").toLowerCase().includes(q);
        const inDesc = (m.description || "").toLowerCase().includes(q);
        const inAuthor = (m.author || "").toLowerCase().includes(q);
        const inTags = Array.isArray(m.tags) ? m.tags.some((t) => (t || "").toLowerCase().includes(q)) : false;
        if (!inNum && !inTitle && !inDesc && !inAuthor && !inTags) return false;
      }
      return true;
    });
  }, [memos, selectedCategory, selectedStatus, urgencyFilter, searchQuery]);

  // Fast resolution actions for the boss
  const handleSetResolution = (
    status: ServiceMemoStatus,
    resolutionText: string
  ) => {
    if (!activeMemo) return;
    const updated = memos.map((m) => {
      if (m.id === activeMemo.id) {
        return {
          ...m,
          status,
          resolution: resolutionText,
          resolvedBy: currentOperatorName,
          resolvedDate: new Date().toISOString().replace("T", " ").substring(0, 16)
        };
      }
      return m;
    });
    onSaveMemos(updated);
  };

  // Add comment to active memo
  const handleAddComment = () => {
    if (!newCommentText.trim() || !activeMemo) return;
    const newComm: MemoComment = {
      id: "comm-" + Date.now(),
      author: currentOperatorName,
      role: "Руководитель IT",
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      text: newCommentText.trim()
    };
    const updated = memos.map((m) => {
      if (m.id === activeMemo.id) {
        return {
          ...m,
          comments: [...m.comments, newComm]
        };
      }
      return m;
    });
    onSaveMemos(updated);
    setNewCommentText("");
  };

  // Handle file uploads to active memo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeMemo) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const att: MemoAttachment = {
          id: "att-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          uploadedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
          dataUrl: event.target?.result as string
        };
        const updated = memos.map((m) => {
          if (m.id === activeMemo.id) {
            return {
              ...m,
              attachments: [...m.attachments, att]
            };
          }
          return m;
        });
        onSaveMemos(updated);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove attachment
  const handleRemoveAttachment = (attId: string) => {
    if (!activeMemo) return;
    const updated = memos.map((m) => {
      if (m.id === activeMemo.id) {
        return {
          ...m,
          attachments: m.attachments.filter((a) => a.id !== attId)
        };
      }
      return m;
    });
    onSaveMemos(updated);
  };

  // Delete entire memo
  const handleDeleteMemo = async (memoId: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту служебную записку из базы данных?")) return;
    const updated = memos.filter((m) => m.id !== memoId);
    onSaveMemos(updated);
    await dbService.deleteServiceMemo(memoId);
    if (selectedMemoId === memoId) {
      setSelectedMemoId(updated[0]?.id || null);
    }
  };

  // Create new memo submission
  const handleCreateMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemo.title || !newMemo.description) return;

    const nextId = "memo-" + Date.now();
    const memoNum = `СЗ-ИТ/${new Date().getFullYear()}-${String(memos.length + 1).padStart(3, "0")}`;

    const created: ServiceMemo = {
      id: nextId,
      number: memoNum,
      title: newMemo.title || "Служебная записка",
      category: (newMemo.category as ServiceMemoCategory) || "PURCHASE",
      priority: (newMemo.priority as ServiceMemoPriority) || "NORMAL",
      status: (newMemo.status as ServiceMemoStatus) || "PENDING_APPROVAL",
      description: newMemo.description || "",
      author: newMemo.author || currentOperatorName,
      authorRole: newMemo.authorRole || "Сотрудник IT",
      department: newMemo.department || "IT-отдел",
      recipient: newMemo.recipient || "Козлов Д. В. (Руководитель IT)",
      createdDate: newMemo.createdDate || new Date().toISOString().split("T")[0],
      deadlineDate: newMemo.deadlineDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notifyDaysBefore: newMemo.notifyDaysBefore || 15,
      estimatedCost: Number(newMemo.estimatedCost) || 0,
      attachments: newMemo.attachments || [],
      comments: [],
      tags: newMemo.tags || []
    };

    const updated = [created, ...memos];
    onSaveMemos(updated);
    setSelectedMemoId(created.id);
    setIsCreateModalOpen(false);

    // Reset form
    setNewMemo({
      title: "",
      category: "PURCHASE",
      priority: "NORMAL",
      status: "PENDING_APPROVAL",
      description: "",
      author: currentOperatorName,
      authorRole: "Начальник IT-отдела",
      department: "IT-служба",
      recipient: "Козлов Д. В. (Руководитель IT-отдела)",
      createdDate: new Date().toISOString().split("T")[0],
      deadlineDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notifyDaysBefore: 15,
      estimatedCost: 0,
      attachments: [],
      comments: [],
      tags: []
    });
  };

  // Helper format file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Байт";
    const k = 1024;
    const sizes = ["Байт", "КБ", "МБ", "ГБ"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Get file icon by type
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (["pdf"].includes(ext)) return <FileText className="h-4 w-4 text-rose-400" />;
    if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet className="h-4 w-4 text-emerald-400" />;
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return <FileImage className="h-4 w-4 text-cyan-400" />;
    if (["txt", "log", "json", "sql"].includes(ext)) return <FileCode className="h-4 w-4 text-amber-400" />;
    return <Paperclip className="h-4 w-4 text-slate-400" />;
  };

  // Get status badge styling
  const getStatusBadge = (status: ServiceMemoStatus) => {
    switch (status) {
      case "APPROVED":
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Согласовано</span>;
      case "PENDING_APPROVAL":
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 flex items-center gap-1"><Clock className="h-3 w-3" /> На согласовании</span>;
      case "IN_PROGRESS":
        return <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> В работе</span>;
      case "COMPLETED":
        return <span className="px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-[10px] font-bold text-slate-400 flex items-center gap-1"><FileCheck className="h-3 w-3" /> Исполнено</span>;
      case "REJECTED":
        return <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-400 flex items-center gap-1"><XCircle className="h-3 w-3" /> Отклонено</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">Черновик</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Automation & 15-day Deadline Reminder for the Manager */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/40 text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1">
                <Folder className="h-3 w-3 text-indigo-400" />
                СЭД ИТ-ОТДЕЛА &amp; АВТОМАТИЗАЦИЯ
              </span>
              {urgentMemos.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[10px] font-mono font-bold text-rose-300 flex items-center gap-1 animate-pulse">
                  <Flame className="h-3 w-3 text-rose-400" />
                  Горящих служебок: {urgentMemos.length}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
              <span>Папка служебных записок и файлов</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                Всего: {memos.length} документов
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Автоматизированный документооборот для руководителя. Прикрепление файлов, счетов, актов и автоматические напоминания за 15 дней до наступления дедлайна.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setUrgencyFilter(urgencyFilter === "URGENT_15_DAYS" ? "ALL" : "URGENT_15_DAYS");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                urgencyFilter === "URGENT_15_DAYS"
                  ? "bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                  : "bg-slate-800/80 hover:bg-slate-700 text-rose-300 border-rose-500/30"
              }`}
            >
              <BellRing className="h-3.5 w-3.5" />
              <span>Напоминания &lt;15 дн. ({urgentMemos.length})</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Создать служебку</span>
            </button>
          </div>
        </div>

        {/* 15-Day Urgent Deadline Warning Strip */}
        {urgentMemos.length > 0 && urgencyFilter !== "URGENT_15_DAYS" && (
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                <strong>Внимание руководителя:</strong> У вас есть <strong>{urgentMemos.length}</strong> {urgentMemos.length === 1 ? "служебка" : "служебок"}, срок исполнения которых наступает менее чем через <strong>15 дней</strong>!
              </span>
            </div>
            <button
              onClick={() => setUrgencyFilter("URGENT_15_DAYS")}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold flex items-center gap-1"
            >
              <span>Показать горящие документы</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Main Folder Workspace: Left Categories & List, Right Detail Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Category Tree & Filters (Col 4) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Categories Palette */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5 text-indigo-400" />
                Папки по категориям
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{memos.length} файлов</span>
            </div>

            <div className="space-y-1">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const count = cat.id === "ALL" 
                  ? memos.length 
                  : memos.filter((m) => m.category === cat.id).length;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setUrgencyFilter("ALL");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${cat.color}`} />
                      <span className="truncate">{cat.label}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isSelected ? "bg-indigo-500/20 text-indigo-300 font-bold" : "bg-slate-800 text-slate-500"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по номеру, теме, автору..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="ALL">Все статусы</option>
                <option value="PENDING_APPROVAL">⏳ На согласовании</option>
                <option value="APPROVED">✅ Согласовано</option>
                <option value="IN_PROGRESS">⚙️ В работе</option>
                <option value="COMPLETED">🎉 Исполнено</option>
                <option value="REJECTED">❌ Отклонено</option>
              </select>

              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value as any)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="ALL">Все сроки</option>
                <option value="URGENT_15_DAYS">🔥 Дедлайн &lt; 15 дн.</option>
                <option value="OVERDUE">⛔ Просроченные</option>
              </select>
            </div>
          </div>

          {/* Memo List in Left Column */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl space-y-2 max-h-[620px] overflow-y-auto">
            <div className="flex items-center justify-between px-2 py-1 text-[10px] text-slate-500 font-mono uppercase">
              <span>Документы ({filteredMemos.length})</span>
              <span>Срок / Статус</span>
            </div>

            {filteredMemos.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <p>Служебных записок не найдено</p>
                <button
                  onClick={() => {
                    setSelectedCategory("ALL");
                    setSelectedStatus("ALL");
                    setUrgencyFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="mt-2 text-indigo-400 hover:underline text-[11px]"
                >
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              filteredMemos.map((memo) => {
                const isSelected = activeMemo?.id === memo.id;
                const daysRemaining = getDaysRemaining(memo.deadlineDate);
                const isUrgent = daysRemaining <= (memo.notifyDaysBefore || 15) && daysRemaining >= 0 && memo.status !== "COMPLETED" && memo.status !== "REJECTED";
                const isOverdue = daysRemaining < 0 && memo.status !== "COMPLETED" && memo.status !== "REJECTED";

                return (
                  <div
                    key={memo.id}
                    onClick={() => setSelectedMemoId(memo.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative group ${
                      isSelected
                        ? "bg-indigo-600/15 border-indigo-500/40 shadow-md"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700"
                    }`}
                  >
                    {/* Urgency Ribbon for < 15 days */}
                    {isUrgent && (
                      <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold shadow-md animate-pulse flex items-center gap-1">
                        <Flame className="h-2.5 w-2.5" />
                        {daysRemaining === 0 ? "СЕГОДНЯ" : `${daysRemaining} дн.`}
                      </div>
                    )}
                    {isOverdue && (
                      <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-red-700 text-white font-mono text-[9px] font-bold shadow-md">
                        ПРОСРОЧЕНО
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono text-indigo-400 font-bold">{memo.number}</span>
                      {getStatusBadge(memo.status)}
                    </div>

                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 mb-1.5 group-hover:text-indigo-300 transition-colors">
                      {memo.title}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/50">
                      <span className="truncate max-w-[140px]">{memo.author}</span>
                      <div className="flex items-center gap-1 text-slate-500">
                        {memo.attachments.length > 0 && (
                          <span className="flex items-center gap-0.5 text-indigo-400">
                            <Paperclip className="h-3 w-3" />
                            {memo.attachments.length}
                          </span>
                        )}
                        <span className="font-mono text-slate-400">до {memo.deadlineDate}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Document Viewer, Files Manager & Manager Resolution Panel (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          {activeMemo ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
              
              {/* Document Header & Quick Actions */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-xs font-mono font-bold text-indigo-400">
                      {activeMemo.number}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-xs text-slate-300 font-mono">
                      {CATEGORIES.find((c) => c.id === activeMemo.category)?.label || activeMemo.category}
                    </span>
                    {getStatusBadge(activeMemo.status)}
                    {activeMemo.priority === "URGENT" && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                        🔥 Срочно
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-100 mt-1">
                    {activeMemo.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Печать / Бланк</span>
                  </button>
                  <button
                    onClick={() => handleDeleteMemo(activeMemo.id)}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition-colors"
                    title="Удалить служебную записку"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Deadline & Warning Ribbon for this Document */}
              {(() => {
                const daysRemaining = getDaysRemaining(activeMemo.deadlineDate);
                const isUrgent = daysRemaining <= (activeMemo.notifyDaysBefore || 15) && daysRemaining >= 0 && activeMemo.status !== "COMPLETED" && activeMemo.status !== "REJECTED";
                const isOverdue = daysRemaining < 0 && activeMemo.status !== "COMPLETED" && activeMemo.status !== "REJECTED";

                return (
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    isOverdue 
                      ? "bg-rose-950/40 border-rose-500/40 text-rose-200" 
                      : isUrgent 
                      ? "bg-amber-950/40 border-amber-500/40 text-amber-200" 
                      : "bg-slate-950/60 border-slate-800 text-slate-300"
                  }`}>
                    <div className="flex items-center gap-3">
                      {isOverdue ? (
                        <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
                      ) : isUrgent ? (
                        <Flame className="h-5 w-5 text-amber-400 shrink-0 animate-bounce" />
                      ) : (
                        <Clock className="h-5 w-5 text-indigo-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <span>Срок исполнения: {activeMemo.deadlineDate}</span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                            Создано: {activeMemo.createdDate}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          {isOverdue
                            ? `Дедлайн просрочен на ${Math.abs(daysRemaining)} дн.! Требуется срочное закрытие.`
                            : isUrgent
                            ? `Осталось ${daysRemaining} дн. (напоминание настроено за 15 дней до срока).`
                            : `До дедлайна осталось ${daysRemaining} дн. Статус под контролем.`}
                        </p>
                      </div>
                    </div>

                    {activeMemo.estimatedCost > 0 && (
                      <div className="text-right sm:border-l sm:border-slate-800/80 sm:pl-4">
                        <span className="text-[10px] text-slate-400 block font-mono">Сумма к согласованию:</span>
                        <span className="text-sm font-bold font-mono text-emerald-400">
                          {activeMemo.estimatedCost.toLocaleString()} ₽
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Author & Recipient Meta Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">ОТ КОГО (СОСТАВИТЕЛЬ):</span>
                  <p className="text-slate-200 font-semibold">{activeMemo.author}</p>
                  <p className="text-slate-400 text-[11px]">{activeMemo.authorRole} • {activeMemo.department}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">КОМУ (АДРЕСАТ / НАЧАЛЬНИК):</span>
                  <p className="text-slate-200 font-semibold">{activeMemo.recipient}</p>
                  <p className="text-indigo-400 text-[11px]">Руководство IT и материального обеспечения</p>
                </div>
              </div>

              {/* Document Text / Description */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold block">
                  Текст и обоснование служебной записки:
                </span>
                <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {activeMemo.description}
                </div>
              </div>

              {/* Tags */}
              {activeMemo.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeMemo.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-400 font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Attached Files & Upload Manager Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-indigo-400" />
                    Прикрепленные файлы и документы ({activeMemo.attachments.length})
                  </span>

                  <button
                    onClick={() => memoAttachmentInputRef.current?.click()}
                    className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-indigo-500/30 transition-colors"
                  >
                    <Upload className="h-3 w-3" />
                    <span>Загрузить файл / скан</span>
                  </button>
                  <input
                    type="file"
                    ref={memoAttachmentInputRef}
                    onChange={handleFileUpload}
                    multiple
                    className="hidden"
                  />
                </div>

                {activeMemo.attachments.length === 0 ? (
                  <div 
                    onClick={() => memoAttachmentInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/40 group"
                  >
                    <Upload className="h-6 w-6 text-slate-600 group-hover:text-indigo-400 mx-auto mb-2 transition-colors" />
                    <p className="text-xs text-slate-400 group-hover:text-slate-200">
                      Перетащите сюда файлы или нажмите для загрузки (PDF, сканы счетов, акты, фото)
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">Поддерживаются любые типы файлов</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeMemo.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 group hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                            {getFileIcon(att.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-indigo-300">
                              {att.name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {formatBytes(att.size)} • {att.uploadedAt}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {att.dataUrl && (
                            <a
                              href={att.dataUrl}
                              download={att.name}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                              title="Скачать файл"
                            >
                              <Download className="h-3.5 w-3.5 text-indigo-400" />
                            </a>
                          )}
                          <button
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Удалить файл"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manager Fast Resolution Bar (1-Click Automation) */}
              <div className="bg-slate-950 border border-indigo-500/20 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Панель решений руководителя (Быстрый выбор в 1 клик)
                  </span>
                  {activeMemo.resolvedBy && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Резолюция: {activeMemo.resolvedBy} ({activeMemo.resolvedDate})
                    </span>
                  )}
                </div>

                {activeMemo.resolution && (
                  <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3 text-xs text-indigo-200">
                    <span className="font-bold block text-[10px] text-indigo-400 uppercase">Текущая резолюция:</span>
                    {activeMemo.resolution}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    onClick={() => handleSetResolution("APPROVED", "Согласовано в полном объеме. Направить в бухгалтерию / снабжение на исполнение.")}
                    className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-xs font-bold border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Согласовать</span>
                  </button>

                  <button
                    onClick={() => handleSetResolution("IN_PROGRESS", "Принято в работу IT-службой. Назначить ответственного инженера.")}
                    className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl text-xs font-bold border border-blue-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>В работу</span>
                  </button>

                  <button
                    onClick={() => handleSetResolution("COMPLETED", "Работы полностью выполнены, оборудование установлено и протестировано.")}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    <FileCheck className="h-3.5 w-3.5" />
                    <span>Исполнено</span>
                  </button>

                  <button
                    onClick={() => handleSetResolution("REJECTED", "Отклонено. Требуется уточнение спецификации или пересмотр бюджета.")}
                    className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold border border-rose-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Отклонить</span>
                  </button>
                </div>
              </div>

              {/* Comments & Discussion Log */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                  История согласования и комментарии ({activeMemo.comments.length})
                </span>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activeMemo.comments.map((comm) => (
                    <div key={comm.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-300">{comm.author} ({comm.role})</span>
                        <span className="text-slate-500 font-mono">{comm.date}</span>
                      </div>
                      <p className="text-slate-300">{comm.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Добавить примечание к служебке..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddComment}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Отправить</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-400">Выберите служебную записку</h3>
              <p className="text-xs text-slate-500 mt-1">Выберите документ из списка слева или создайте новый</p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE NEW MEMO MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest font-bold">СОЗДАНИЕ СЛУЖЕБНОЙ ЗАПИСКИ</span>
                <h3 className="text-base font-bold text-slate-100">Новый документ СЭД</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Templates Buttons */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Быстрые корпоративные шаблоны:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setNewMemo({
                        ...newMemo,
                        title: tpl.title,
                        category: tpl.category,
                        priority: tpl.priority,
                        estimatedCost: tpl.cost,
                        recipient: tpl.recipient,
                        description: tpl.desc,
                        tags: tpl.tags
                      });
                    }}
                    className="p-2.5 bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left transition-colors text-xs text-slate-300 flex items-start gap-2"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-200">{tpl.title}</strong>
                      <span className="text-[10px] text-slate-500">{tpl.desc.substring(0, 65)}...</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateMemo} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Тема служебной записки *</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Закупка партии тонера Static Control на склад"
                  value={newMemo.title || ""}
                  onChange={(e) => setNewMemo({ ...newMemo, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Категория</label>
                  <select
                    value={newMemo.category}
                    onChange={(e) => setNewMemo({ ...newMemo, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.filter((c) => c.id !== "ALL").map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Приоритет</label>
                  <select
                    value={newMemo.priority}
                    onChange={(e) => setNewMemo({ ...newMemo, priority: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Обычный (Низкий)</option>
                    <option value="NORMAL">Стандартный</option>
                    <option value="HIGH">Высокий</option>
                    <option value="URGENT">🔥 Срочный (Критический)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Сумма (₽, если закупка)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newMemo.estimatedCost || 0}
                    onChange={(e) => setNewMemo({ ...newMemo, estimatedCost: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Срок исполнения (Дедлайн) *</label>
                  <input
                    type="date"
                    required
                    value={newMemo.deadlineDate || ""}
                    onChange={(e) => setNewMemo({ ...newMemo, deadlineDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Напоминать за (дней до дедлайна)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={newMemo.notifyDaysBefore || 15}
                    onChange={(e) => setNewMemo({ ...newMemo, notifyDaysBefore: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Составитель (ФИО и должность)</label>
                  <input
                    type="text"
                    value={newMemo.author || ""}
                    onChange={(e) => setNewMemo({ ...newMemo, author: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Адресат (Кому)</label>
                  <input
                    type="text"
                    value={newMemo.recipient || ""}
                    onChange={(e) => setNewMemo({ ...newMemo, recipient: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Текст и детальное обоснование *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Опишите причину служебной записки, технические параметры, необходимость и спецификацию..."
                  value={newMemo.description || ""}
                  onChange={(e) => setNewMemo({ ...newMemo, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Зарегистрировать служебку
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* PRINTABLE OFFICIAL MEMO FORM MODAL */}
      {isPrintModalOpen && activeMemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-300">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-slate-800" />
                <div>
                  <h4 className="font-bold text-sm tracking-wide uppercase">ООО «АРХОН ТЕХНОЛОДЖИ»</h4>
                  <p className="text-[10px] text-slate-500">Система электронного документооборота</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Печать</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-base font-bold tracking-wider uppercase">СЛУЖЕБНАЯ ЗАПИСКА</h2>
              <p className="text-xs font-mono text-slate-600">
                № {activeMemo.number} от {activeMemo.createdDate} г.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <p className="font-bold text-slate-600 text-[10px] uppercase">КОМУ:</p>
                <p className="font-semibold text-slate-900">{activeMemo.recipient}</p>
              </div>
              <div>
                <p className="font-bold text-slate-600 text-[10px] uppercase">ОТ КОГО:</p>
                <p className="font-semibold text-slate-900">{activeMemo.author}</p>
                <p className="text-slate-600 text-[11px]">{activeMemo.authorRole}</p>
              </div>
            </div>

            <div className="pt-2">
              <p className="font-bold text-xs mb-1.5">Тема: {activeMemo.title}</p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed whitespace-pre-wrap">
                {activeMemo.description}
              </div>
            </div>

            {activeMemo.estimatedCost > 0 && (
              <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg text-xs font-bold">
                <span>Предварительная стоимость:</span>
                <span className="font-mono">{activeMemo.estimatedCost.toLocaleString()} ₽</span>
              </div>
            )}

            {/* Resolution Block */}
            <div className="border-2 border-slate-300 rounded-xl p-4 space-y-2 bg-slate-50">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">РЕЗОЛЮЦИЯ РУКОВОДИТЕЛЯ:</span>
              <p className="text-xs font-semibold text-slate-900">
                {activeMemo.resolution || "На рассмотрении у руководителя IT-отдела"}
              </p>
              <div className="flex justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                <span>Подпись: _______________ ({activeMemo.resolvedBy || activeMemo.recipient})</span>
                <span>Дата: {activeMemo.resolvedDate || "___.___.2026 г."}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-2">
              Документ сформирован в корпоративной системе Archon IT Desk • Срок действия дедлайна: {activeMemo.deadlineDate}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
