import React, { useState } from "react";
import { Scale, Database, Plus, Sparkles, Check, AlertTriangle, HelpCircle, History, Info, BarChart3, TrendingDown, Trash2 } from "lucide-react";
import { CartridgeModel, TonerTub, WeighingLog, User, UserRole } from "../types";
import { dbService } from "../services/apiClient";

interface TonerWarehouseProps {
  cartridgeModels: CartridgeModel[];
  tonerTubs: TonerTub[];
  weighingLogs: WeighingLog[];
  users: User[];
  currentUserRole: UserRole;
  currentUserName: string;
  onUpdateCartridges: (updated: CartridgeModel[]) => void;
  onUpdateTonerTubs: (updated: TonerTub[]) => void;
  onUpdateWeighingLogs: (updated: WeighingLog[]) => void;
  onAddAuditLog: (action: string, type: "info" | "success" | "warning" | "error", details: string) => void;
}

export default function TonerWarehouse({
  cartridgeModels,
  tonerTubs,
  weighingLogs,
  users,
  currentUserRole,
  currentUserName,
  onUpdateCartridges,
  onUpdateTonerTubs,
  onUpdateWeighingLogs,
  onAddAuditLog
}: TonerWarehouseProps) {
  
  // Interactive weighing states
  const [selectedModelId, setSelectedModelId] = useState<string>(cartridgeModels[0]?.id || "");
  const [measuredWeight, setMeasuredWeight] = useState<number>(680);
  const [weighingNotes, setWeighingNotes] = useState<string>("");
  const [selectedTubId, setSelectedTubId] = useState<string>(tonerTubs[0]?.id || "");

  // Model creation states
  const [isAddingModel, setIsAddingModel] = useState<boolean>(false);
  const [newModelName, setNewModelName] = useState<string>("");
  const [newModelPrinter, setNewModelPrinter] = useState<string>("");
  const [newModelEmpty, setNewModelEmpty] = useState<number>(600);
  const [newModelFull, setNewModelFull] = useState<number>(680);

  // Tub creation states
  const [isAddingTub, setIsAddingTub] = useState<boolean>(false);
  const [newTubName, setNewTubName] = useState<string>("");
  const [newTubBrand, setNewTubBrand] = useState<string>("");
  const [newTubCapacity, setNewTubCapacity] = useState<number>(1000);

  // Compute live statistics for current selection
  const activeModel = cartridgeModels.find(m => m.id === selectedModelId);
  const emptyWeight = activeModel?.emptyWeight || 0;
  const fullWeight = activeModel?.fullWeight || 1;
  const nominalToner = activeModel?.tonerWeight || 1;

  // Fill Percentage calculation
  const calculatedFillPercent = activeModel 
    ? Math.round(((measuredWeight - emptyWeight) / nominalToner) * 100 * 10) / 10
    : 0;

  // Determine Quality status
  let fillStatus: "perfect" | "underfilled" | "overfilled" | "empty" = "empty";
  let statusText = "Пустой / Требует заправки";
  let statusColor = "text-rose-400 border-rose-950 bg-rose-950/20";

  if (calculatedFillPercent <= 10) {
    fillStatus = "empty";
    statusText = "Пустой / Израсходован";
    statusColor = "text-rose-400 border-rose-900 bg-rose-950/10";
  } else if (calculatedFillPercent > 10 && calculatedFillPercent < 85) {
    fillStatus = "underfilled";
    statusText = "Недозаправлен (требует досыпки)";
    statusColor = "text-amber-400 border-amber-900 bg-amber-950/10";
  } else if (calculatedFillPercent >= 85 && calculatedFillPercent <= 105) {
    fillStatus = "perfect";
    statusText = "Идеальная норма заправки! (ГОСТ)";
    statusColor = "text-emerald-400 border-emerald-900 bg-emerald-950/10";
  } else {
    fillStatus = "overfilled";
    statusText = "Пересып тонера! (Опасность просыпания)";
    statusColor = "text-purple-400 border-purple-900 bg-purple-950/10";
  }

  // Handle addition of a weighing transaction
  const handleLogWeighing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModel) return;

    const newLog: WeighingLog = {
      id: `log-${Date.now()}`,
      modelId: selectedModelId,
      modelName: activeModel.name,
      measuredWeight: measuredWeight,
      fillPercentage: calculatedFillPercent,
      date: new Date().toLocaleString("ru-RU"),
      operator: currentUserName,
      status: fillStatus,
      notes: weighingNotes || "Стандартный замер веса"
    };

    onUpdateWeighingLogs([newLog, ...weighingLogs]);

    // DEDUCT TONER FROM TUB automatically if cartridge is filled
    const tonerUsed = Math.max(0, measuredWeight - emptyWeight);
    if (tonerUsed > 0 && selectedTubId) {
      const updatedTubs = tonerTubs.map(tub => {
        if (tub.id === selectedTubId) {
          const rem = Math.max(0, tub.remainingGrams - tonerUsed);
          return { ...tub, remainingGrams: Math.round(rem) };
        }
        return tub;
      });
      onUpdateTonerTubs(updatedTubs);
    }

    onAddAuditLog(
      "Взвешивание картриджа",
      fillStatus === "perfect" ? "success" : "info",
      `Картридж ${activeModel.name} взвешен: ${measuredWeight}г (${calculatedFillPercent}%). Качество заправки: ${statusText}. Списано ${tonerUsed}г тонера.`
    );

    // Reset notes
    setWeighingNotes("");
  };

  // Add Cartridge Model to global database (Admin only)
  const handleAddModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserRole !== UserRole.ADMIN) return;

    const nominalToner = newModelFull - newModelEmpty;
    if (nominalToner <= 0) {
      alert("Вес полного картриджа должен превышать вес пустого!");
      return;
    }

    const newModel: CartridgeModel = {
      id: `m-${Date.now()}`,
      name: newModelName,
      printerModel: newModelPrinter,
      emptyWeight: newModelEmpty,
      fullWeight: newModelFull,
      tonerWeight: nominalToner
    };

    onUpdateCartridges([...cartridgeModels, newModel]);
    onAddAuditLog(
      "Добавлен стандарт картриджа",
      "success",
      `Создан весовой профиль для ${newModel.name}: пустой ${newModel.emptyWeight}г, полный ${newModel.fullWeight}г.`
    );

    // Reset form
    setIsAddingModel(false);
    setNewModelName("");
    setNewModelPrinter("");
  };

  // Add Toner Tub to database
  const handleAddTub = (e: React.FormEvent) => {
    e.preventDefault();
    const newTub: TonerTub = {
      id: `t-${Date.now()}`,
      name: newTubName,
      brand: newTubBrand,
      capacityGrams: newTubCapacity,
      remainingGrams: newTubCapacity,
      color: "black"
    };

    onUpdateTonerTubs([...tonerTubs, newTub]);
    onAddAuditLog(
      "Поставка тонера на склад",
      "success",
      `Получена новая тумба тонера '${newTub.name}' (${newTub.capacityGrams}г) бренда ${newTub.brand}.`
    );

    setIsAddingTub(false);
    setNewTubName("");
    setNewTubBrand("");
  };

  // Reset tub capacity to max
  const refillTubGrams = (id: string, name: string) => {
    const updated = tonerTubs.map(tub => {
      if (tub.id === id) {
        return { ...tub, remainingGrams: tub.capacityGrams };
      }
      return tub;
    });
    onUpdateTonerTubs(updated);
    onAddAuditLog(
      "Замена тумбы тонера",
      "info",
      `Тумба тонера '${name}' заменена на новую, емкость восстановлена.`
    );
  };

  // Delete log transaction
  const handleDeleteLog = async (id: string) => {
    if (currentUserRole !== UserRole.ADMIN) return;
    const updated = weighingLogs.filter(l => l.id !== id);
    onUpdateWeighingLogs(updated);
    await dbService.deleteWeighingLog(id);
    onAddAuditLog("Удалена запись взвешивания", "warning", `Удалена запись ОТК взвешивания ${id} из базы данных.`);
  };

  // Delete tub
  const handleDeleteTub = async (id: string, name: string) => {
    if (currentUserRole !== UserRole.ADMIN) return;
    if (confirm(`Удалить тумбу тонера '${name}' из базы данных?`)) {
      const updated = tonerTubs.filter(t => t.id !== id);
      onUpdateTonerTubs(updated);
      await dbService.deleteTonerTub(id);
      if (selectedTubId === id) setSelectedTubId("");
      onAddAuditLog("Удалена тумба тонера", "warning", `Тумба тонера '${name}' удалена из базы данных.`);
    }
  };

  // Delete cartridge model
  const handleDeleteModel = async (id: string, name: string) => {
    if (currentUserRole !== UserRole.ADMIN) return;
    if (confirm(`Удалить профиль картриджа '${name}' из каталога?`)) {
      const updated = cartridgeModels.filter(m => m.id !== id);
      onUpdateCartridges(updated);
      await dbService.deleteCartridgeModel(id);
      if (selectedModelId === id) setSelectedModelId(updated[0]?.id || "");
      onAddAuditLog("Удален стандарт картриджа", "warning", `Модель картриджа '${name}' удалена.`);
    }
  };

  return (
    <div id="warehouse_section" className="space-y-8 text-slate-100">
      
      {/* 2 Column Layout: Calculator Weighing (Col 7) + Toner Tubs shelf (Col 5) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Weighing Calculator Panel (Col 7) */}
        <div className="xl:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col">
          
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-5">
            <Scale className="h-5.5 w-5.5 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight font-display">Весовая Станция Контроля Заправки</h2>
              <p className="text-[11px] text-slate-400">Взвешивайте готовый картридж и ведите автоматический учет остатка тонера в реальном времени.</p>
            </div>
          </div>

          <form onSubmit={handleLogWeighing} className="space-y-5 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Select Cartridge Model */}
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">Выберите модель картриджа:</label>
                <select
                  id="select_cartridge_model"
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
                >
                  {cartridgeModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.printerModel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Toner Tub to deduct from */}
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">Списать расход тонера с тумбы:</label>
                <select
                  id="select_toner_tub"
                  value={selectedTubId}
                  onChange={(e) => setSelectedTubId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
                >
                  <option value="">-- Не списывать расход --</option>
                  {tonerTubs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Остаток: {t.remainingGrams}г)
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Scale visual input weight slider */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                  <Scale className="h-4 w-4 text-emerald-400 animate-pulse" /> ВЕС НА ВЕСАХ:
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    id="input_measured_weight"
                    type="number"
                    min="100"
                    max="1500"
                    value={measuredWeight}
                    onChange={(e) => setMeasuredWeight(parseInt(e.target.value) || 0)}
                    className="w-20 bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-center font-mono font-bold text-white text-base focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-slate-400 font-bold">грамм</span>
                </div>
              </div>

              <input
                type="range"
                min={(emptyWeight - 40) || 500}
                max={(fullWeight + 60) || 800}
                value={measuredWeight}
                onChange={(e) => setMeasuredWeight(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-xl appearance-none cursor-pointer accent-emerald-500"
              />

              {/* Diagnostic Weight comparison bounds */}
              {activeModel && (
                <div className="flex justify-between text-[10px] text-slate-500 font-mono select-none">
                  <span>Пустой: {emptyWeight}г</span>
                  <span className="text-emerald-400 font-bold">Норма: {fullWeight}г</span>
                  <span>Лимит: {fullWeight + 30}г</span>
                </div>
              )}
            </div>

            {/* Live calculation gauge */}
            {activeModel && (
              <div className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                fillStatus === "perfect" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" :
                fillStatus === "underfilled" ? "text-amber-400 border-amber-500/20 bg-amber-500/5" :
                fillStatus === "overfilled" ? "text-purple-400 border-purple-500/20 bg-purple-500/5" :
                "text-rose-400 border-rose-500/20 bg-rose-500/5"
              }`}>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold font-mono">Уровень заправки картриджа тонером</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-mono font-black">{calculatedFillPercent}%</span>
                    <span className="text-xs text-slate-300">({measuredWeight - emptyWeight}г из {nominalToner}г засыпа)</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold block">{statusText}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Спецификация: {activeModel.name}</span>
                </div>
              </div>
            )}

            {/* Note and Save */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-8">
                <input
                  type="text"
                  placeholder="Заметки (например: 'заменен ракель', 'смазан барабан')"
                  value={weighingNotes}
                  onChange={(e) => setWeighingNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="md:col-span-4">
                <button
                  id="btn_log_weighing"
                  type="submit"
                  disabled={!measuredWeight}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  Зафиксировать в журнал
                </button>
              </div>
            </div>

          </form>

          {/* Quick specs addition tool (Collapsible or toggle) */}
          {currentUserRole === UserRole.ADMIN && (
            <div className="mt-6 pt-5 border-t border-slate-800">
              {!isAddingModel ? (
                <button
                  onClick={() => setIsAddingModel(true)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  + Добавить новую модель картриджа в каталог стандартов веса
                </button>
              ) : (
                <form onSubmit={handleAddModel} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-white mb-2">Новый стандарт веса картриджа:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400">Название картриджа:</label>
                      <input
                        type="text"
                        required
                        placeholder="например: HP 85A (CE285A)"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Совместимые принтеры:</label>
                      <input
                        type="text"
                        required
                        placeholder="например: HP LaserJet P1102"
                        value={newModelPrinter}
                        onChange={(e) => setNewModelPrinter(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Вес пустого корпуса (грамм):</label>
                      <input
                        type="number"
                        required
                        value={newModelEmpty}
                        onChange={(e) => setNewModelEmpty(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Номинальный полный вес (грамм):</label>
                      <input
                        type="number"
                        required
                        value={newModelFull}
                        onChange={(e) => setNewModelFull(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingModel(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] text-slate-300 transition-colors cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-[10px] font-bold text-white transition-colors cursor-pointer"
                    >
                      Создать профиль
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Toner Tubs shelf & replenishment Panel (Col 5) */}
        <div className="xl:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white tracking-tight font-display">Полки Тонер-Тумб (Запасы)</h2>
              </div>
              <span className="text-[9px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                СВЕЖИЙ СКЛАД
              </span>
            </div>

            {/* List of Tubs */}
            <div className="space-y-4">
              {tonerTubs.map((tub) => {
                const percent = Math.round((tub.remainingGrams / tub.capacityGrams) * 100);
                const averageRefillsLeft = Math.floor(tub.remainingGrams / 80); // Assuming 80g is avg refill
                const isLow = percent < 25;

                return (
                  <div
                    key={tub.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isLow
                        ? "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40"
                        : "bg-slate-950 border-slate-800 hover:border-indigo-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          {tub.name}
                          {isLow && <AlertTriangle className="h-4 w-4 text-rose-400 animate-pulse" />}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono">{tub.brand}</p>
                      </div>

                      <button
                        onClick={() => refillTubGrams(tub.id, tub.name)}
                        className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 border border-slate-800 rounded-xl px-2.5 py-1 bg-slate-900 hover:bg-slate-850 transition-colors cursor-pointer"
                        title="Установить новую тумбу (Восстановить емкость)"
                      >
                        Заменить
                      </button>
                    </div>

                    {/* Progress Bar remaining */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-mono text-[11px]">
                          Осталось: <span className="text-white font-bold">{tub.remainingGrams}г</span> / {tub.capacityGrams}г
                        </span>
                        <span className={`font-mono font-bold ${isLow ? "text-rose-400" : "text-emerald-400"}`}>
                          {percent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLow ? "bg-rose-500" : percent < 50 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Left refills calculation statement */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2.5 font-mono">
                      <TrendingDown className="h-3.5 w-3.5 text-slate-500" />
                      <span>Хватит приблизительно на</span>
                      <span className={`font-bold px-1.5 py-0.5 rounded font-sans text-[10px] ${isLow ? "bg-rose-500/10 text-rose-300" : "bg-indigo-500/10 text-indigo-300"}`}>
                        {averageRefillsLeft} заправок
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Toner Tub Panel (Admin / or Warehouse) */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            {!isAddingTub ? (
              <button
                onClick={() => setIsAddingTub(true)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors w-full justify-center cursor-pointer"
              >
                + Зарегистрировать поступление новой банки/тумбы тонера
              </button>
            ) : (
              <form onSubmit={handleAddTub} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-white mb-2 font-display">Новое поступление сырья (Тонер):</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Название тонера (например: Samsung ML-1610)"
                    value={newTubName}
                    onChange={(e) => setNewTubName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Бренд (Static Control, Tomoegawa)"
                      value={newTubBrand}
                      onChange={(e) => setNewTubBrand(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="number"
                      required
                      placeholder="Вес нетто (грамм)"
                      value={newTubCapacity}
                      onChange={(e) => setNewTubCapacity(parseInt(e.target.value) || 1000)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingTub(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] transition-colors cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-bold text-white transition-colors cursor-pointer"
                  >
                    Принять на баланс
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

      </div>

      {/* History log ledger of weighing transactions (Full table) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
          <History className="h-5 w-5 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">История взвешиваний и ОТК заправки картриджей</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium font-mono">
                <th className="py-2.5 px-3">Дата / Время</th>
                <th className="py-2.5 px-3">Модель картриджа</th>
                <th className="py-2.5 px-3 font-mono">Вес (грамм)</th>
                <th className="py-2.5 px-3">Заполнение (%)</th>
                <th className="py-2.5 px-3">Качество (ОТК)</th>
                <th className="py-2.5 px-3">IT-специалист</th>
                <th className="py-2.5 px-3">Комментарий</th>
                {currentUserRole === UserRole.ADMIN && <th className="py-2.5 px-3 text-right">Действия</th>}
              </tr>
            </thead>
            <tbody>
              {(weighingLogs || []).filter(Boolean).map((log) => {
                let badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                let text = "Пустой";

                if (log.status === "perfect") {
                  badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                  text = "Норма (ГОСТ)";
                } else if (log.status === "underfilled") {
                  badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                  text = "Недосып";
                } else if (log.status === "overfilled") {
                  badgeClass = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                  text = "Пересып";
                }

                return (
                  <tr key={log.id} className="border-b border-slate-800/60 hover:bg-slate-950/40 transition-colors">
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">{log.date}</td>
                    <td className="py-3 px-3 font-bold text-white">{log.modelName}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{log.measuredWeight} г</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-200">{log.fillPercentage}%</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badgeClass}`}>
                        {text}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{log.operator}</td>
                    <td className="py-3 px-3 text-slate-400 truncate max-w-xs" title={log.notes}>{log.notes}</td>
                    {currentUserRole === UserRole.ADMIN && (
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                          title="Удалить запись"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {weighingLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-mono text-[11px]">
                    Журнал пуст. Взвесьте первый заправленный картридж для наполнения статистики.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
