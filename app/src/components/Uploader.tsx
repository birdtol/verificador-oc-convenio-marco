import React, { useState, useRef } from "react";
import { UploadCloud, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { extractTextFromPdf, extractFieldsFromText, MOCK_TEXTS } from "../utils/pdfParser";

interface UploaderProps {
  onStartParsing: () => void;
  onFinishParsing: (data: {
    duracionContrato: number | null;
    plazoEntrega: number | null;
    rawText: string;
    filename: string;
  }) => void;
  onError: (error: string) => void;
}

export default function Uploader({
  onStartParsing,
  onFinishParsing,
  onError,
}: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      onError("Por favor, suba únicamente archivos con extensión PDF.");
      return;
    }

    onStartParsing();

    try {
      const text = await extractTextFromPdf(file);
      const fields = extractFieldsFromText(text);

      onFinishParsing({
        ...fields,
        filename: file.name,
      });
    } catch (err: any) {
      console.error(err);
      onError(
        `Error al extraer texto del PDF: ${err.message || "Asegúrese de subir un PDF válido con texto seleccionable."}`
      );
    }
  };

  const handleLoadMock = (type: "concordante" | "discrepanciaEntrega" | "discrepanciaAmbos" | "incompleto", label: string) => {
    onStartParsing();
    setTimeout(() => {
      const text = MOCK_TEXTS[type];
      const fields = extractFieldsFromText(text);
      onFinishParsing({
        ...fields,
        filename: `Ejemplo_OC_${label.replace(/\s+/g, "_")}.pdf`,
      });
    }, 1000);
  };

  return (
    <div className="space-y-6" id="uploader-container">
      <div className="text-center max-w-lg mx-auto space-y-2 mb-4">
        <h2 className="text-xl font-sans font-medium text-gray-800 tracking-tight">
          Verificación de Órdenes de Compra
        </h2>
        <p className="text-sm text-gray-500 font-sans">
          Suba el documento de la Orden de Compra de la Provincia de Buenos Aires para iniciar el análisis automático de concordancia con el Convenio Marco.
        </p>
      </div>

      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-10 cursor-pointer flex flex-col items-center justify-center transition-all ${
          isDragging
            ? "border-slate-800 bg-slate-50/50 scale-[1.01]"
            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/30"
        }`}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        id="drag-drop-zone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-file-input"
        />

        <div className="p-4 bg-slate-50 rounded-full border border-gray-100 text-gray-600 mb-4" id="uploader-icon-bg">
          <UploadCloud className="w-8 h-8 stroke-[1.5]" id="uploader-cloud-icon" />
        </div>

        <span className="text-base font-medium text-gray-750 font-sans" id="uploader-primary-text">
          Arrastre aquí la Orden de Compra o haga clic para buscar
        </span>
        <span className="text-xs text-gray-400 mt-1 font-mono" id="uploader-secondary-text">
          Formato admitido: PDF (con capa de texto digitalizado)
        </span>
      </motion.div>

      {/* Quick Mock Templates area for audits/testing */}
      <div className="border border-gray-155 rounded-xl p-5 bg-white space-y-4" id="mock-examples-box">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500" id="mock-examples-header">
          <Sparkles className="w-4 h-4 text-slate-500" id="mock-sparkles-icon" />
          <span>Simulador de Casos Administrativos (Para Pruebas)</span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed font-sans">
          ¿No dispone de un PDF con la estructura requerida? Puede cargar de forma inmediata ejemplos predefinidos que cumplen las condiciones del pliego para evaluar los distintos dictámenes:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2" id="mock-examples-grid">
          <button
            type="button"
            onClick={() => handleLoadMock("concordante", "Concordante")}
            className="flex items-center gap-2 text-left p-2.5 rounded-lg border border-gray-100 font-sans text-xs font-medium text-gray-700 bg-[#fbfbfb] hover:bg-emerald-50/30 hover:border-emerald-200 transition-colors cursor-pointer"
            id="mock-btn-concordante"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div>
              <span className="block text-gray-800 font-bold">OC Concordante (10 y 10 d.)</span>
              <span className="block text-[10px] text-gray-400 font-normal">Coincide plenamente con el Pliego general</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleLoadMock("discrepanciaEntrega", "Discrepancia Simple")}
            className="flex items-center gap-2 text-left p-2.5 rounded-lg border border-gray-100 font-sans text-xs font-medium text-gray-700 bg-[#fbfbfb] hover:bg-amber-50/30 hover:border-amber-200 transition-colors cursor-pointer"
            id="mock-btn-discrepancia-simple"
          >
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <div>
              <span className="block text-gray-800 font-bold">OC Discrepancia Simple</span>
              <span className="block text-[10px] text-gray-400 font-normal">Plazo de entrega de 15 días frente a 10 de contrato</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleLoadMock("discrepanciaAmbos", "Discrepancia Total")}
            className="flex items-center gap-2 text-left p-2.5 rounded-lg border border-gray-100 font-sans text-xs font-medium text-gray-700 bg-[#fbfbfb] hover:bg-amber-50/30 hover:border-amber-200 transition-colors cursor-pointer"
            id="mock-btn-discrepancia-total"
          >
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div>
              <span className="block text-gray-800 font-bold">OC Discrepancia Total</span>
              <span className="block text-[10px] text-gray-400 font-normal">Tres valores distintos (30, 12 y 10 días)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleLoadMock("incompleto", "Incompleto")}
            className="flex items-center gap-2 text-left p-2.5 rounded-lg border border-gray-100 font-sans text-xs font-medium text-gray-700 bg-[#fbfbfb] hover:bg-slate-100 hover:border-gray-200 transition-colors cursor-pointer"
            id="mock-btn-incompleto"
          >
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <div>
              <span className="block text-gray-800 font-bold">OC Dato Incompleto</span>
              <span className="block text-[10px] text-gray-400 font-normal">Texto genérico donde no se extraen las variables</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
