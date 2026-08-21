import React, { useState } from "react";
import { Send, Bell, Settings, ShieldCheck, Mail, MessageSquare, Terminal, Eye, Sparkles, RefreshCw } from "lucide-react";
import { AlertSettings, UserRole } from "../types";

interface AlertConfigProps {
  alertSettings: AlertSettings;
  currentUserRole: UserRole;
  onUpdateSettings: (updated: AlertSettings) => void;
  onAddAuditLog: (action: string, type: "info" | "success" | "warning" | "error", details: string) => void;
}

export default function AlertConfig({
  alertSettings,
  currentUserRole,
  onUpdateSettings,
  onAddAuditLog
}: AlertConfigProps) {
  
  const [botToken, setBotToken] = useState(alertSettings.telegramBotToken);
  const [chatId, setChatId] = useState(alertSettings.telegramChatId);
  const [smsUrl, setSmsUrl] = useState(alertSettings.smsApiUrl);
  const [smsKey, setSmsKey] = useState(alertSettings.smsApiKey);
  const [cpuThresh, setCpuThresh] = useState(alertSettings.cpuThreshold);
  const [tonerThresh, setTonerThresh] = useState(alertSettings.tonerTubThreshold);

  // Simulated Console and Phone Previews states
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "System: Инициализация модуля оповещений...",
    "System: Состояние SMS-шлюза: ГОТОВ к отправке.",
    "System: Подключение к Telegram Bot API: OK (Бот активен)."
  ]);
  const [phoneMessage, setPhoneMessage] = useState<string>("");
  const [phoneMessageType, setPhoneMessageType] = useState<"telegram" | "sms" | null>(null);
  const [isSendingSim, setIsSendingSim] = useState<boolean>(false);

  // Update Settings handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AlertSettings = {
      telegramBotToken: botToken,
      telegramChatId: chatId,
      smsApiUrl: smsUrl,
      smsApiKey: smsKey,
      cpuThreshold: cpuThresh,
      tempThreshold: alertSettings.tempThreshold,
      tonerTubThreshold: tonerThresh
    };
    onUpdateSettings(updated);
    onAddAuditLog(
      "Изменение настроек шлюзов",
      "success",
      "Обновлены API-токены Telegram, SMS-ключ авторизации и правила критических порогов нагрузки."
    );
    
    // Add console log
    setConsoleLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] System: Настройки изменены администратором. Конфигурационные файлы сохранены в env.`
    ]);
  };

  // Run Test trigger simulation for Telegram
  const triggerTelegramTest = () => {
    setIsSendingSim(true);
    setPhoneMessageType("telegram");
    
    const messageBody = `⚠️ [КРИТИЧЕСКАЯ УГРОЗА]: На узле PC-LABEL-PRINTER (192.168.1.75) остановлена служба 'CUPS Server'. Принтер этикеток Zebra не печатает! Требуется ручное вмешательство. Склад заблокирован!`;
    setPhoneMessage(messageBody);

    const logs = [
      `[${new Date().toLocaleTimeString()}] API_POST: Запрос к https://api.telegram.org/bot${botToken.substring(0, 8)}.../sendMessage`,
      `[${new Date().toLocaleTimeString()}] HEADERS: { "Content-Type": "application/json" }`,
      `[${new Date().toLocaleTimeString()}] PAYLOAD: { "chat_id": "${chatId}", "text": "${messageBody.substring(0, 60)}...", "parse_mode": "Markdown" }`,
      `[${new Date().toLocaleTimeString()}] RESPONSE_STATUS: 200 OK`,
      `[${new Date().toLocaleTimeString()}] RESPONSE_BODY: { "ok": true, "result": { "message_id": 451, "chat": { "id": ${chatId} } } }`,
      `[${new Date().toLocaleTimeString()}] System: Сообщение успешно отправлено в Telegram-чат техподдержки.`
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) {
        setConsoleLogs(prev => [...prev, logs[i]]);
        i++;
      } else {
        clearInterval(interval);
        setIsSendingSim(false);
      }
    }, 400);

    onAddAuditLog(
      "Тестовый алерт Telegram",
      "warning",
      "Инициирована тестовая отправка критического алерта по службам принтера в Telegram."
    );
  };

  // Run Test trigger simulation for SMS
  const triggerSmsTest = () => {
    setIsSendingSim(true);
    setPhoneMessageType("sms");

    const messageBody = `Внимание! Запас тонера в тумбе HP Premium снизился до 16%. Закажите тонер у поставщика во избежание остановки склада.`;
    setPhoneMessage(messageBody);

    const logs = [
      `[${new Date().toLocaleTimeString()}] API_POST: Запрос к ${smsUrl}`,
      `[${new Date().toLocaleTimeString()}] PARAMS: { "api_id": "${smsKey.substring(0, 6)}-XXXX", "to": "+79991234567", "msg": "${messageBody.substring(0, 40)}..." }`,
      `[${new Date().toLocaleTimeString()}] RESPONSE_STATUS: 200 OK (Запрос выполнен шлюзом)`,
      `[${new Date().toLocaleTimeString()}] RESPONSE_BODY: { "status": "OK", "status_code": 100, "sms": { "+79991234567": { "status": "OK", "status_code": 100, "sms_id": "4529-1052" } }, "balance": 1424.50 }`,
      `[${new Date().toLocaleTimeString()}] System: СМС успешно передано сотовому оператору. Баланс SMS.RU: 1424.50 руб.`
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) {
        setConsoleLogs(prev => [...prev, logs[i]]);
        i++;
      } else {
        clearInterval(interval);
        setIsSendingSim(false);
      }
    }, 400);

    onAddAuditLog(
      "Тестовый алерт СМС",
      "warning",
      "Отправлено тестовое СМС оповещение о снижении запасов тонера через шлюз SMS.RU."
    );
  };

  const clearConsole = () => {
    setConsoleLogs([`[${new Date().toLocaleTimeString()}] System: Консоль логов очищена.`]);
  };

  return (
    <div id="alerts_config_section" className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      
      {/* Settings Form Column (Col 7) */}
      <div className="xl:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-100">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-5">
          <Bell className="h-5.5 w-5.5 text-indigo-400" />
          <div>
            <h2 className="text-lg font-bold text-white font-display">Интеграция Telegram & SMS шлюзов</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Настройте оповещения о критических сбоях серверов, остановке служб принтеров или исчерпании тонера.</p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          
          {/* Telegram Credentials Group */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block flex items-center gap-1 font-mono">
              <MessageSquare className="h-3.5 w-3.5" /> Оповещения в Telegram-чат
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Telegram Bot API Token:</label>
                <input
                  type="password"
                  disabled={currentUserRole !== UserRole.ADMIN}
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono focus:border-indigo-500/50 outline-none"
                  placeholder="7139048352:AAG8eXzO88..."
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Telegram ID Чат-Группы (Chat ID):</label>
                <input
                  type="text"
                  disabled={currentUserRole !== UserRole.ADMIN}
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono focus:border-indigo-500/50 outline-none"
                  placeholder="-1002148425232"
                />
              </div>
            </div>
            {currentUserRole === UserRole.ADMIN && (
              <button
                id="btn_test_telegram"
                type="button"
                onClick={triggerTelegramTest}
                disabled={isSendingSim}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-rose-500/30 text-rose-300 font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-3 w-3" /> Проверить отправку Telegram
              </button>
            )}
          </div>

          {/* SMS.ru Credentials Group */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1 font-mono">
              <Mail className="h-3.5 w-3.5" /> СМС-оповещения (SMS.RU API)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">SMS.RU API URL шлюза:</label>
                <input
                  type="text"
                  disabled={currentUserRole !== UserRole.ADMIN}
                  value={smsUrl}
                  onChange={(e) => setSmsUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono focus:border-indigo-500/50 outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Ключ авторизации API Key:</label>
                <input
                  type="password"
                  disabled={currentUserRole !== UserRole.ADMIN}
                  value={smsKey}
                  onChange={(e) => setSmsKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono focus:border-indigo-500/50 outline-none"
                  placeholder="C3E2929B-4D2A..."
                />
              </div>
            </div>
            {currentUserRole === UserRole.ADMIN && (
              <button
                id="btn_test_sms"
                type="button"
                onClick={triggerSmsTest}
                disabled={isSendingSim}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/30 text-amber-300 font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-3 w-3" /> Проверить СМС-оповещение
              </button>
            )}
          </div>

          {/* Threshold sliders config */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              Автоматические Триггеры и Пороги Срабатывания
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CPU threshold */}
              <div>
                <div className="flex justify-between mb-1 text-slate-400">
                  <span>Порог тревоги CPU нагрузка:</span>
                  <span className="font-bold text-rose-400">{cpuThresh}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={cpuThresh}
                  disabled={currentUserRole !== UserRole.ADMIN}
                  onChange={(e) => setCpuThresh(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-xl appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Toner threshold */}
              <div>
                <div className="flex justify-between mb-1 text-slate-400">
                  <span>Порог остатка сырья в тумбе:</span>
                  <span className="font-bold text-amber-400">{tonerThresh}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={tonerThresh}
                  disabled={currentUserRole !== UserRole.ADMIN}
                  onChange={(e) => setTonerThresh(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-xl appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>

          {currentUserRole === UserRole.ADMIN && (
            <div className="flex justify-end pt-2">
              <button
                id="btn_save_alert_settings"
                type="submit"
                className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                Сохранить параметры оповещений
              </button>
            </div>
          )}

        </form>
      </div>

      {/* Developer Log Console & Live Smartphone Simulator (Col 5) */}
      <div className="xl:col-span-5 space-y-6">
        
        {/* Terminal Logger */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 flex flex-col h-[230px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">API Webhook Logs Console</span>
            </div>
            <button
              onClick={clearConsole}
              className="text-[9px] font-semibold text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="h-2.5 w-2.5" /> Очистить
            </button>
          </div>

          {/* Console Text block */}
          <div className="flex-1 overflow-y-auto font-mono text-[9px] text-slate-300 space-y-1.5 pr-2 custom-scrollbar">
            {(consoleLogs || []).filter(Boolean).map((log, idx) => {
              const logStr = typeof log === "string" ? log : String(log || "");
              const is200 = logStr.includes("RESPONSE_STATUS: 200") || logStr.includes('ok": true');
              const isPost = logStr.includes("API_POST") || logStr.includes("PAYLOAD");
              const isSys = logStr.includes("System:");
              return (
                <p
                  key={idx}
                  className={
                    is200
                      ? "text-emerald-400"
                      : isPost
                      ? "text-cyan-300"
                      : isSys
                      ? "text-slate-500"
                      : "text-slate-200"
                  }
                >
                  {logStr}
                </p>
              );
            })}
          </div>
        </div>

        {/* Realistic Smartphone mockup for message preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col items-center">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-3">Визуальный симулятор смартфона</span>
          
          {/* SmartPhone body */}
          <div className="w-[230px] h-[250px] bg-slate-950 border-4 border-slate-800 rounded-3xl p-3 relative shadow-2xl flex flex-col">
            {/* Speaker Camera Notch */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-slate-800 rounded-full flex items-center justify-center">
              <span className="h-1 w-1 bg-slate-900 rounded-full"></span>
            </div>

            {/* Simulated UI Phone status bar */}
            <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold px-1.5 pt-1.5 mb-4 select-none">
              <span>22:35</span>
              <div className="flex items-center gap-1">
                <span>5G</span>
                <span className="h-2 w-3.5 border border-slate-400 rounded-sm"></span>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 flex flex-col justify-end">
              {phoneMessageType && phoneMessage ? (
                <div
                  className={`p-2 rounded-xl text-[9px] animate-bounce-in leading-snug shadow-md ${
                    phoneMessageType === "telegram"
                      ? "bg-slate-800/80 border border-slate-700/80 text-white self-start w-11/12"
                      : "bg-[#25d366]/10 border border-[#25d366]/20 text-emerald-300 self-end w-11/12"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1 font-bold text-[8px]">
                    <span className={phoneMessageType === "telegram" ? "text-indigo-400" : "text-emerald-400"}>
                      {phoneMessageType === "telegram" ? "✈️ Telegram (Бот-ОТК)" : "💬 СМС (SMS.RU)"}
                    </span>
                    <span className="text-[7px] text-slate-500 font-normal">сейчас</span>
                  </div>
                  <p>{phoneMessage}</p>
                </div>
              ) : (
                <div className="text-center pb-12">
                  <Eye className="h-8 w-8 text-slate-800 mx-auto mb-1" />
                  <p className="text-[9px] text-slate-600 font-semibold uppercase">Ожидание тестовой отправки</p>
                </div>
              )}
            </div>

            {/* Simulated Home button bar */}
            <div className="w-16 h-1 bg-slate-800 rounded-full mx-auto mt-2 select-none"></div>

          </div>
        </div>

      </div>

    </div>
  );
}
