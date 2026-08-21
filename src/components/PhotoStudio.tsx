import React, { useState, useRef, useEffect } from "react";
import { Upload, Download, RotateCw, ZoomIn, ZoomOut, Eye, Trash2, Sliders, RefreshCw, Sparkles, Check, Info } from "lucide-react";
import { UserRole } from "../types";

interface PhotoStudioProps {
  currentUserRole: UserRole;
  currentUserName: string;
  onAddAuditLog: (action: string, type: "info" | "success" | "warning" | "error", details: string) => void;
}

export default function PhotoStudio({ currentUserRole, currentUserName, onAddAuditLog }: PhotoStudioProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100); // percentage 20% to 300%
  const [rotate, setRotate] = useState<number>(0); // degrees
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  
  // Background Removal & Color parameters
  const [bgRemoveEnabled, setBgRemoveEnabled] = useState<boolean>(true);
  const [keyColor, setKeyColor] = useState<{ r: number; g: number; b: number }>({ r: 255, g: 255, b: 255 }); // Default key: white
  const [tolerance, setTolerance] = useState<number>(45); // distance tolerance
  const [feather, setFeather] = useState<number>(15);
  const [replacementType, setReplacementType] = useState<"transparent" | "blue" | "white" | "gray">("white");
  
  // Color correction
  const [brightness, setBrightness] = useState<number>(100); // 50 to 150
  const [contrast, setContrast] = useState<number>(100);   // 50 to 150
  const [saturation, setSaturation] = useState<number>(100); // 0 to 200

  // Manual Color Sampler Mode
  const [isSamplingColor, setIsSamplingColor] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  // Load image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      loadImage(file);
    }
  };

  const loadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const img = new Image();
        img.onload = () => {
          setImgElement(img);
          setImageSrc(event.target!.result as string);
          // Auto center & reset
          setZoom(100);
          setRotate(0);
          setPanX(0);
          setPanY(0);
          
          // Auto sample key-color from top-left corner
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          const tempCtx = tempCanvas.getContext("2d");
          if (tempCtx) {
            tempCtx.drawImage(img, 0, 0);
            const pixel = tempCtx.getImageData(10, 10, 1, 1).data;
            setKeyColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
          }

          onAddAuditLog(
            "Загрузка фото в Студию 3х4",
            "info",
            `Загружен файл '${file.name}' (${img.width}x${img.height}px) для форматирования.`
          );
        };
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handling
  const [dragOver, setDragOver] = useState<boolean>(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadImage(e.dataTransfer.files[0]);
    }
  };

  // Background replacements RGBA
  const getReplacementRGBA = () => {
    switch (replacementType) {
      case "transparent":
        return { r: 0, g: 0, b: 0, a: 0 };
      case "blue":
        return { r: 195, g: 218, b: 247, a: 1 }; // Soft official light blue document background
      case "gray":
        return { r: 240, g: 240, b: 240, a: 1 };
      case "white":
      default:
        return { r: 255, g: 255, b: 255, a: 1 };
    }
  };

  // Renders the modified preview
  const renderPreview = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !imgElement) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width; // 300px
    const height = canvas.height; // 400px (3x4 ratio)

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create offscreen canvas to apply transformations
    const offCanvas = document.createElement("canvas");
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext("2d");
    if (!offCtx) return;

    // Apply Solid Background on the lower layer if not transparent
    const bg = getReplacementRGBA();
    if (bg.a > 0) {
      offCtx.fillStyle = `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${bg.a})`;
      offCtx.fillRect(0, 0, width, height);
    }

    // Now render the user image on a temporary canvas to apply background removal
    const imgCanvas = document.createElement("canvas");
    imgCanvas.width = width;
    imgCanvas.height = height;
    const imgCtx = imgCanvas.getContext("2d");
    if (!imgCtx) return;

    // Save state, transform and draw
    imgCtx.save();
    // Translate to center of panning
    imgCtx.translate(width / 2 + panX, height / 2 + panY);
    imgCtx.rotate((rotate * Math.PI) / 180);
    
    // Scale proportionally
    const scaleFactor = (zoom / 100) * Math.min(width / imgElement.width, height / imgElement.height);
    const drawWidth = imgElement.width * scaleFactor;
    const drawHeight = imgElement.height * scaleFactor;
    
    // Set color correction filters
    imgCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    
    imgCtx.drawImage(imgElement, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    imgCtx.restore();

    // Apply Background Removal (Chroma key) on imgCanvas pixels
    if (bgRemoveEnabled) {
      const imgData = imgCtx.getImageData(0, 0, width, height);
      const data = imgData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a === 0) continue;

        // Euclidean color distance
        const dist = Math.sqrt(
          Math.pow(r - keyColor.r, 2) +
          Math.pow(g - keyColor.g, 2) +
          Math.pow(b - keyColor.b, 2)
        );

        if (dist < tolerance) {
          if (feather > 0 && dist > tolerance - feather) {
            // Smooth edge feathering
            const alphaRatio = (dist - (tolerance - feather)) / feather;
            data[i + 3] = Math.round(a * alphaRatio);
          } else {
            // Completely transparent (background removed)
            data[i + 3] = 0;
          }
        }
      }
      imgCtx.putImageData(imgData, 0, 0);
    }

    // Composite imgCanvas on top of offCanvas (which contains backdrop)
    offCtx.drawImage(imgCanvas, 0, 0);

    // Draw offscreen content to the screen canvas
    ctx.drawImage(offCanvas, 0, 0);
  };

  // Re-run render on any parameter change
  useEffect(() => {
    renderPreview();
  }, [imgElement, zoom, rotate, panX, panY, bgRemoveEnabled, keyColor, tolerance, feather, replacementType, brightness, contrast, saturation]);

  // Dragging the image inside the viewport
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageSrc || isSamplingColor) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging.current) {
      setPanX(e.clientX - dragStart.current.x);
      setPanY(e.clientY - dragStart.current.y);
    }
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  // Color Sampler tool
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSamplingColor || !previewCanvasRef.current || !imgElement) return;

    const canvas = previewCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Scale coordinate based on canvas real resolution vs display width
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = Math.round((e.clientX - rect.left) * scaleX);
    const clickY = Math.round((e.clientY - rect.top) * scaleY);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const pixel = ctx.getImageData(clickX, clickY, 1, 1).data;
      // Make sure we aren't sampling transparency or replaced color if bg is already gone
      setKeyColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
      setIsSamplingColor(false);
      onAddAuditLog(
        "Выбор цвета фона",
        "info",
        `Выбран новый ключевой цвет для удаления: RGB(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
      );
    }
  };

  const downloadResult = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !imageSrc) return;

    // Create high-resolution download canvas (600x800 for perfect 3x4 print quality)
    const downloadCanvas = document.createElement("canvas");
    downloadCanvas.width = 600;
    downloadCanvas.height = 800;
    const dlCtx = downloadCanvas.getContext("2d");
    if (!dlCtx) return;

    // Run the identical drawing routine but at 2x resolution
    const width = downloadCanvas.width;
    const height = downloadCanvas.height;

    // Fill backdrop
    const bg = getReplacementRGBA();
    if (bg.a > 0) {
      dlCtx.fillStyle = `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${bg.a})`;
      dlCtx.fillRect(0, 0, width, height);
    }

    const imgCanvas = document.createElement("canvas");
    imgCanvas.width = width;
    imgCanvas.height = height;
    const imgCtx = imgCanvas.getContext("2d");
    if (!imgCtx || !imgElement) return;

    imgCtx.save();
    // Scale translation coordinates from 300x400 to 600x800 (multiply by 2)
    imgCtx.translate(width / 2 + panX * 2, height / 2 + panY * 2);
    imgCtx.rotate((rotate * Math.PI) / 180);

    const scaleFactor = (zoom / 100) * Math.min(width / imgElement.width, height / imgElement.height);
    const drawWidth = imgElement.width * scaleFactor;
    const drawHeight = imgElement.height * scaleFactor;

    imgCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    imgCtx.drawImage(imgElement, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    imgCtx.restore();

    if (bgRemoveEnabled) {
      const imgData = imgCtx.getImageData(0, 0, width, height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a === 0) continue;

        const dist = Math.sqrt(
          Math.pow(r - keyColor.r, 2) +
          Math.pow(g - keyColor.g, 2) +
          Math.pow(b - keyColor.b, 2)
        );

        if (dist < tolerance) {
          if (feather > 0 && dist > tolerance - feather) {
            const alphaRatio = (dist - (tolerance - feather)) / feather;
            data[i + 3] = Math.round(a * alphaRatio);
          } else {
            data[i + 3] = 0;
          }
        }
      }
      imgCtx.putImageData(imgData, 0, 0);
    }

    dlCtx.drawImage(imgCanvas, 0, 0);

    // Create download link
    const link = document.createElement("a");
    link.download = `photo_3x4_${Date.now()}.png`;
    link.href = downloadCanvas.toDataURL("image/png");
    link.click();

    onAddAuditLog(
      "Экспорт фото 3х4",
      "success",
      `Успешно подготовлено и скачано фото 3х4 (600х800px) сотрудником ${currentUserName}.`
    );
  };

  const handleReset = () => {
    setZoom(100);
    setRotate(0);
    setPanX(0);
    setPanY(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setTolerance(45);
    setFeather(15);
    setBgRemoveEnabled(true);
    setReplacementType("white");
  };

  return (
    <div id="photo_studio_section" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-100">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5.5 w-5.5 text-indigo-400" />
            <h2 className="text-lg font-bold tracking-tight text-white font-display">Интеллектуальная Фотостудия 3х4</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Подготовка фотографий сотрудников для пропусков и личных дел. Удаление заднего фона и масштабирование по регламенту.
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex gap-2">
          {imageSrc && (
            <button
              id="btn_reset_photo"
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Сбросить всё
            </button>
          )}
        </div>
      </div>

      {!imageSrc ? (
        <div
          id="drop_zone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[350px] ${
            dragOver
              ? "border-emerald-500 bg-emerald-950/20"
              : "border-slate-800 hover:border-emerald-500/50 hover:bg-slate-950/40"
          }`}
        >
          <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 border border-slate-700">
            <Upload className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1 font-display">Перетащите оригинал фотографии сюда</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-md">
            Поддерживаются форматы JPEG, PNG, WEBP. Мы автоматически распознаем границы и предложим инструменты кадрирования.
          </p>
          <button
            id="btn_choose_photo"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            Выбрать файл на компьютере
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Workspace Area: Viewport Canvas with Guideline overlays (Left side - Col 7) */}
          <div className="xl:col-span-7 flex flex-col items-center">
            <div className="text-center mb-3">
              <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] uppercase tracking-wider text-emerald-400 font-bold font-mono">
                Режим позиционирования
              </span>
              <p className="text-xs text-slate-400 mt-1">
                Перетаскивайте фото мышкой внутри рамки. Совместите лицо с шаблоном.
              </p>
            </div>

            {/* Canvas Outer Wrapper representing actual 3x4 portrait */}
            <div className="relative group select-none">
              {/* Interactive canvas */}
              <canvas
                id="preview_canvas"
                ref={previewCanvasRef}
                width={300}
                height={400}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onClick={handleCanvasClick}
                className={`border border-slate-800 rounded-2xl shadow-2xl bg-neutral-900 overflow-hidden ${
                  isSamplingColor ? "cursor-crosshair ring-2 ring-emerald-500" : "cursor-move"
                }`}
                style={{ width: "300px", height: "400px" }}
              />

              {/* Static HTML Overlay: Transparent official 3x4 guidelines */}
              <div className="absolute inset-0 pointer-events-none border border-emerald-500/20 rounded-2xl">
                {/* Horizontal center lines & vertical alignment lines */}
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-emerald-500/30"></div>
                <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-emerald-500/30"></div>

                {/* Eye line (approx. 45% from top) */}
                <div className="absolute inset-x-0 top-[42%] border-t border-emerald-400/40">
                  <span className="absolute right-2 -top-4 text-[9px] text-emerald-400 font-mono tracking-tight uppercase">
                    ЛИНИЯ ГЛАЗ
                  </span>
                </div>

                {/* Face Oval bounds */}
                <div className="absolute top-[18%] left-[20%] right-[20%] bottom-[22%] border-2 border-emerald-500/40 rounded-[50%/60%]">
                  {/* Outer edge */}
                  <div className="absolute inset-1 border border-dashed border-emerald-500/20 rounded-[50%/60%]"></div>
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] text-emerald-400/70 font-mono text-center leading-tight">
                    КОНТУР<br />ГОЛОВЫ
                  </span>
                </div>

                {/* Chin alignment marker (at approx. 72% from top) */}
                <div className="absolute inset-x-0 top-[78%] border-t border-dashed border-amber-500/40">
                  <span className="absolute left-2 -top-4 text-[9px] text-amber-400 font-mono uppercase">
                    ЛИНИЯ ПОДБОРОДКА
                  </span>
                </div>

                {/* Scale Grid overlay info */}
                <div className="absolute bottom-1.5 right-2 text-[8px] font-mono text-emerald-400/60 bg-black/50 px-1.5 py-0.5 rounded">
                  Формат 30х40 мм (3х4)
                </div>
              </div>

              {/* Sampling Color Badge Overlay */}
              {isSamplingColor && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg font-medium animate-pulse flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-white"></span>
                  Кликните по цвету фона на фотографии
                </div>
              )}
            </div>

            {/* Viewport Control Sliders */}
            <div className="w-full max-w-[320px] mt-6 bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-wrap justify-between items-center gap-2">
              <button
                id="btn_zoom_out"
                onClick={() => setZoom(Math.max(20, zoom - 10))}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-xl transition-all cursor-pointer"
                title="Уменьшить"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              
              <span className="text-xs font-mono text-slate-400 select-none">
                Масштаб: {zoom}%
              </span>

              <button
                id="btn_zoom_in"
                onClick={() => setZoom(Math.min(300, zoom + 10))}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-xl transition-all cursor-pointer"
                title="Увеличить"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <div className="h-4 w-px bg-slate-800"></div>

              <button
                id="btn_rotate_ccw"
                onClick={() => setRotate((rotate - 5 + 360) % 360)}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-xl transition-all cursor-pointer"
                title="Повернуть влево"
              >
                <RotateCw className="h-4 w-4 scale-x-[-1]" />
              </button>

              <span className="text-xs font-mono text-slate-400 select-none">
                {rotate}°
              </span>

              <button
                id="btn_rotate_cw"
                onClick={() => setRotate((rotate + 5) % 360)}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-xl transition-all cursor-pointer"
                title="Повернуть вправо"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-3 mt-6 w-full max-w-[320px]">
              <button
                id="btn_delete_photo"
                onClick={() => {
                  setImageSrc(null);
                  setImgElement(null);
                  onAddAuditLog("Очистка Фотостудии", "info", "Очищен рабочий холст фотостудии.");
                }}
                className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" /> Удалить фото
              </button>

              <button
                id="btn_download_photo"
                onClick={downloadResult}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Download className="h-4 w-4" /> Скачать 3х4
              </button>
            </div>
          </div>

          {/* Settings Console Panel (Right side - Col 5) */}
          <div className="xl:col-span-5 bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-6">
            
            {/* Background Removal controls */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-400" /> Удаление заднего фона
                </h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bgRemoveEnabled}
                    onChange={(e) => setBgRemoveEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {bgRemoveEnabled && (
                <div className="space-y-4 p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
                  {/* Chroma Key Selector */}
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1.5">Метод определения фона:</span>
                    <div className="flex items-center gap-3">
                      {/* Color Dot display */}
                      <div
                        className="h-8 w-8 rounded-lg border border-slate-800 shadow-inner transition-transform hover:scale-105 cursor-pointer"
                        style={{ backgroundColor: `rgb(${keyColor.r}, ${keyColor.g}, ${keyColor.b})` }}
                        title="Текущий ключевой цвет фона"
                      ></div>

                      <button
                        id="btn_sample_color"
                        onClick={() => setIsSamplingColor(!isSamplingColor)}
                        className={`flex-1 text-xs py-2 px-3 rounded-xl border font-medium transition-all cursor-pointer ${
                          isSamplingColor
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750"
                        }`}
                      >
                        {isSamplingColor ? "Ожидание клика..." : "Пипетка (выбрать на фото)"}
                      </button>
                    </div>
                  </div>

                  {/* Preset Background selectors */}
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1.5">Популярные пресеты исходного фона:</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setKeyColor({ r: 255, g: 255, b: 255 })}
                        className="py-1 px-1.5 bg-white text-slate-900 border border-slate-300 hover:opacity-90 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Белый
                      </button>
                      <button
                        onClick={() => setKeyColor({ r: 240, g: 242, b: 245 })}
                        className="py-1 px-1.5 bg-slate-200 text-slate-800 border border-slate-300 hover:opacity-90 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Светло-серый
                      </button>
                      <button
                        onClick={() => setKeyColor({ r: 46, g: 139, b: 87 })}
                        className="py-1 px-1.5 bg-[#2E8B57] text-white border border-neutral-700 hover:opacity-90 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Хромакей
                      </button>
                    </div>
                  </div>

                  {/* Tolerance slider */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Чувствительность удаления:</span>
                      <span className="font-mono text-emerald-400">{tolerance}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      value={tolerance}
                      onChange={(e) => setTolerance(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-xl appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* Feathering slider */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Сглаживание краев силуэта:</span>
                      <span className="font-mono text-emerald-400">{feather}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={feather}
                      onChange={(e) => setFeather(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-xl appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Replacement Backdrop Color Select */}
            <div>
              <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-emerald-400" /> Выберите новый задний фон
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "white", label: "Белый", class: "bg-white text-black" },
                  { id: "blue", label: "Документ", class: "bg-[#c3daf7] text-slate-950" },
                  { id: "gray", label: "Серый", class: "bg-[#f0f0f0] text-slate-900" },
                  { id: "transparent", label: "Прозрач.", class: "bg-transparent text-white border border-dashed border-slate-800" }
                ].map((bgOption) => (
                  <button
                    key={bgOption.id}
                    onClick={() => setReplacementType(bgOption.id as any)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold text-center transition-all relative cursor-pointer ${
                      bgOption.class
                    } ${replacementType === bgOption.id ? "ring-2 ring-emerald-500 scale-105 shadow-md shadow-emerald-500/20" : "opacity-75 hover:opacity-100"}`}
                  >
                    {replacementType === bgOption.id && (
                      <span className="absolute top-0.5 right-0.5 h-3 w-3 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="h-2 w-2 text-white" />
                      </span>
                    )}
                    {bgOption.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Correction Sliders */}
            <div>
              <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-emerald-400" /> Цветокоррекция лица и яркость
              </h4>
              <div className="space-y-4 p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
                {/* Brightness */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Яркость:</span>
                    <span className="font-mono text-emerald-400">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-xl appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Контраст:</span>
                    <span className="font-mono text-emerald-400">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-xl appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Saturation */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Насыщенность:</span>
                    <span className="font-mono text-emerald-400">{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-xl appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Help / Regulation standard */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex gap-2.5">
              <Info className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-300 block mb-0.5">Регламент фото 3х4 см:</span>
                <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                  Лицо должно занимать не менее 70-80% площади фотографии. Голова должна быть расположена прямо, без наклонов. Макушка должна находиться на расстоянии не менее 2 мм от верхнего края, а глаза — на условной линии глаз.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
