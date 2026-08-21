import React, { useState } from "react";
import { Terminal, Copy, Check, FileCode, Server, HelpCircle, ArrowRight } from "lucide-react";

export default function DockerGuide() {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const dockerfileContent = `# Stage 1: Build the client React static assets
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve using high-performance Nginx web server
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom nginx.conf if routing fallback is needed (e.g., react router support)
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;

  const dockerComposeContent = `version: "3.8"

services:
  it-warehouse-desktop:
    build: .
    container_name: it_warehouse_system
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"`;

  const commands = [
    { desc: "Собрать контейнер локально", cmd: "docker build -t it-warehouse-desktop ." },
    { desc: "Запустить в фоновом режиме", cmd: "docker run -d -p 3000:80 --name warehouse_desktop it-warehouse-desktop" },
    { desc: "Запуск через Docker Compose (рекомендуется)", cmd: "docker-compose up -d" }
  ];

  const handleCopy = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div id="docker_guide_section" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-100">
      
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-5">
        <Server className="h-5.5 w-5.5 text-cyan-400" />
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight font-display">Docker Контейнеризация и Развертывание</h2>
          <p className="text-xs text-slate-400 mt-1">
            Готовые конфигурационные файлы Dockerfile и Docker Compose для быстрого развертывания рабочего стола на серверах вашего склада.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Files display (Col 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Dockerfile Panel */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/40 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                <FileCode className="h-4 w-4" /> Dockerfile (Многоэтапная сборка)
              </span>
              <button
                onClick={() => handleCopy(dockerfileContent, "dockerfile")}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                {copiedTab === "dockerfile" ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" /> Скопировано!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Копировать
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto font-mono text-[10px] text-slate-300 leading-relaxed max-h-[250px] custom-scrollbar">
              {dockerfileContent}
            </pre>
          </div>

          {/* docker-compose.yml Panel */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/40 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                <FileCode className="h-4 w-4" /> docker-compose.yml
              </span>
              <button
                onClick={() => handleCopy(dockerComposeContent, "compose")}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                {copiedTab === "compose" ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" /> Скопировано!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Копировать
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto font-mono text-[10px] text-slate-300 leading-relaxed max-h-[200px] custom-scrollbar">
              {dockerComposeContent}
            </pre>
          </div>

        </div>

        {/* Deploy Instructions (Col 4) */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Terminal className="h-4 w-4" /> Консольные команды
            </h3>
            
            <div className="space-y-4">
              {commands.map((c, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[10px] text-slate-400 block">{c.desc}:</span>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 font-mono text-[10px] text-slate-200 break-all select-all flex justify-between items-center group">
                    <span>{c.cmd}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1">
              <HelpCircle className="h-4 w-4 text-indigo-400" /> Почему Docker?
            </h3>
            <ul className="space-y-2 text-[11px] text-slate-300 leading-normal list-none p-0">
              <li className="flex gap-1.5 items-start">
                <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>Изолирует драйверы весов и портов от остальной ОС.</span>
              </li>
              <li className="flex gap-1.5 items-start">
                <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>Разворачивается на сервере склада ровно за 2 минуты.</span>
              </li>
              <li className="flex gap-1.5 items-start">
                <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>Встроенное кэширование зависимостей ускоряет сборку.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
