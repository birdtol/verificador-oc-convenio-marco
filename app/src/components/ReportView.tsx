import React, { useState } from "react";
import {
  Printer,
  Copy,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  RefreshCw,
  Sliders,
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { VerificationResult, VericadorResultado } from "../types";

interface ReportViewProps {
  result: VerificationResult;
  filename: string;
  isLoadingIa: boolean;
  onReset: () => void;
  onUpdateValues: (duracion: number | null, plazo: number | null) => void;
}

export default function ReportView({
  result,
  filename,
  isLoadingIa,
  onReset,
  onUpdateValues,
}: ReportViewProps) {
  const [copied, setCopied] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  
  // Local form inputs corresponding to the state
  const [manualDuracion, setManualDuracion] = useState<string>(
    result.duracionContrato !== null ? String(result.duracionContrato) : ""
  );
  const [manualPlazo, setManualPlazo] = useState<string>(
    result.plazoEntrega !== null ? String(result.plazoEntrega) : ""
  );
  const [duracionIsNull, setDuracionIsNull] = useState(result.duracionContrato === null);
  const [plazoIsNull, setPlazoIsNull] = useState(result.plazoEntrega === null);

  const handleCopy = async () => {
    const textToCopy = `REPORT EVALUATION SUMMARY
==================================================
DOCUMENTO: ${filename}
ESTADO: ${result.resultado}

${result.detalleDiscrepancia || "Verificación sin discrepancias encontradas."}

VALORES REGISTRADOS:
- Duración del contrato: ${result.duracionContrato !== null ? `${result.duracionContrato} días` : "[NO CONSIGNADO]"}
- Plazo de entrega: ${result.plazoEntrega !== null ? `${result.plazoEntrega} días` : "[NO CONSIGNADO]"}
- Plazo del Pliego (Referencia): ${result.plazoPliego} días

FUNDAMENTO NORMATIVO Y DE PRÁCTICA (DGC-PBA):
${result.explicacionIa || "Esperando generación del fundamento por IA..."}

--------------------------------------------------
ADVERTENCIA: Este resultado es un borrador de verificación preliminar. No constituye evidencia de auditoría ni reemplaza la validación de un responsable humano.
==================================================`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error copying text: ", err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dur = duracionIsNull ? null : (manualDuracion === "" ? null : parseInt(manualDuracion, 10));
    const pla = plazoIsNull ? null : (manualPlazo === "" ? null : parseInt(manualPlazo, 10));
    
    // Ensure numbers are logical
    if (!duracionIsNull && dur !== null && isNaN(dur)) return;
    if (!plazoIsNull && pla !== null && isNaN(pla)) return;

    onUpdateValues(dur, pla);
  };

  const getResultBadgeStyles = (status: VericadorResultado) => {
    switch (status) {
      case "CONCORDANTE":
        return {
          wrapper: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          label: "CONCORDANTE",
          desc: "Los plazos indicados en el documento coinciden plenamente con los establecidos en el Pliego de Convenio Marco."
        };
      case "DISCREPANCIA":
        return {
          wrapper: "bg-amber-50 text-amber-850 border-amber-200",
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          label: "DISCREPANCIA",
          desc: "Se han identificado variaciones o desvíos entre los plazos estipulados de forma real y el Pliego."
        };
      case "DATO_INCOMPLETO":
        return {
          wrapper: "bg-slate-100 text-slate-800 border-slate-300",
          icon: <HelpCircle className="w-5 h-5 text-slate-500" />,
          label: "DATO INCOMPLETO",
          desc: "No fue posible extraer o verificar la totalidad de los parámetros de plazo debido a omisiones de formato o lectura."
        };
    }
  };

  const badgeStyles = getResultBadgeStyles(result.resultado);

  return (
    <div className="space-y-6" id="report-view-container">
      
      {/* 1. Printable / Display Report Wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden print:border-0 print:shadow-none"
        id="report-printable-area"
      >
        {/* Report Top Header Pattern (Provincia de Buenos Aires look) */}
        <div className="bg-slate-900 border-b border-slate-700 text-white p-6 print:bg-white print:text-black print:border-b-2 print:border-slate-800" id="report-header">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="report-header-flex">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 print:text-slate-500 font-medium">
                Contaduría General de la Provincia de Buenos Aires
              </span>
              <h1 className="text-sm font-sans font-medium tracking-tight text-white leading-relaxed print:text-black print:font-bold">
                VERIFICACIÓN DE CONCORDANCIA — ORDEN DE COMPRA / Convenio Marco: Artículos de Limpieza (PLIEG-2025-22986458-GDEBA-DATOPCGP)
              </h1>
            </div>
            <div className="text-right text-xs font-mono text-slate-400 print:text-slate-600" id="report-meta">
              <p>Doc Analizado: <span className="text-white print:text-black font-semibold">{filename}</span></p>
              <p>Fecha Análisis: {new Date().toLocaleDateString("es-AR")}</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6" id="report-body">
          
          {/* Status Banner */}
          <div className={`p-4 border rounded-lg flex items-start gap-3 ${badgeStyles.wrapper}`} id="status-banner">
            <div className="mt-0.5" id="status-banner-icon">{badgeStyles.icon}</div>
            <div className="space-y-0.5" id="status-banner-text">
              <div className="text-sm font-bold font-sans uppercase tracking-wider">
                Resultado: {badgeStyles.label}
              </div>
              <p className="text-xs font-sans leading-relaxed">{badgeStyles.desc}</p>
              {result.detalleDiscrepancia && (
                <p className="text-xs font-mono font-medium mt-1.5 border-t border-amber-200/50 pt-1.5 text-amber-900">
                  {result.detalleDiscrepancia}
                </p>
              )}
            </div>
          </div>

          {/* Side-by-side Parameter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="parameters-dashboard-grid">
            
            {/* Card 1: Duración del contrato */}
            <div className="border border-gray-150 rounded-lg p-4 bg-[#fafafa] flex flex-col justify-between space-y-2 h-full" id="param-card-duracion">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 font-mono">
                  Documento (Regex 1)
                </span>
                <h3 className="text-xs font-medium text-gray-700 font-sans">
                  Duración del contrato
                </h3>
              </div>
              <div className="py-2">
                <span className={`text-2xl font-mono font-semibold tracking-tight ${result.duracionContrato === null ? "text-red-400 italic text-lg" : "text-gray-800"}`}>
                  {result.duracionContrato !== null ? `${result.duracionContrato} Días` : "[NO CONSIGNADO]"}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-1 font-sans">
                Patrón: "Duración del contrato: X Días..."
              </div>
            </div>

            {/* Card 2: Plazo de entrega */}
            <div className="border border-gray-150 rounded-lg p-4 bg-[#fafafa] flex flex-col justify-between space-y-2 h-full" id="param-card-plazo">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 font-mono">
                  Documento (Regex 2)
                </span>
                <h3 className="text-xs font-medium text-gray-700 font-sans">
                  Plazo de entrega (Detalle)
                </h3>
              </div>
              <div className="py-2">
                <span className={`text-2xl font-mono font-semibold tracking-tight ${result.plazoEntrega === null ? "text-red-400 italic text-lg" : "text-gray-800"}`}>
                  {result.plazoEntrega !== null ? `${result.plazoEntrega} Días` : "[NO CONSIGNADO]"}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-1 font-sans">
                Patrón: "Durante los X Días..."
              </div>
            </div>

            {/* Card 3: Plazo del Pliego */}
            <div className="border border-gray-150 rounded-lg p-4 bg-[#f3f4f6] flex flex-col justify-between space-y-2 h-full border-l-4 border-l-slate-800" id="param-card-pliego">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 font-mono">
                  Pliego CM (Referencia)
                </span>
                <h3 className="text-xs font-semibold text-slate-700 font-sans">
                  Plazo de Pliego Establecido
                </h3>
              </div>
              <div className="py-2">
                <span className="text-2xl font-mono font-bold tracking-tight text-slate-850">
                  {result.plazoPliego} Días
                </span>
              </div>
              <div className="text-[10px] text-slate-500 border-t border-gray-200 pt-1 font-medium font-sans">
                Criterio: Igualdad Estricta (Práctica)
              </div>
            </div>

          </div>

          {/* Gemini AI paragraph */}
          <div className="border border-gray-200/80 rounded-lg p-5 bg-stone-50/50 space-y-3" id="ai-explanation-box">
            <div className="flex items-center justify-between border-b border-gray-150 pb-2" id="ai-explanation-header">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 font-sans">
                  Fundamento Normativo y de Práctica
                </span>
                <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-gray-200/50 font-mono">
                  Informe de Control IA
                </span>
              </div>
            </div>

            <div className="min-h-[4rem]" id="ai-explanation-workspace">
              {isLoadingIa ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-2" id="ai-loader">
                  <RefreshCw className="w-5 h-5 text-slate-600 animate-spin" />
                  <span className="text-xs text-slate-500 font-mono">Generando párrafo reglamentario con Gemini API...</span>
                </div>
              ) : result.explicacionIa ? (
                <p className="text-sm text-gray-850 leading-relaxed font-serif italic text-balance pl-3 border-l-2 border-slate-400">
                  "{result.explicacionIa}"
                </p>
              ) : (
                <p className="text-sm text-gray-450 italic font-mono">
                  No se pudo constituir el dictamen del fundamento normativo.
                </p>
              )}
            </div>
          </div>

          {/* Hardcoded Warning block */}
          <div className="border-l-4 border-l-red-400 bg-red-50/40 border border-gray-200 p-4 rounded-r-lg" id="audit-system-warning">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-red-800 flex items-center gap-1.5 mb-1 font-sans">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Observación de Uso Administrativo
            </h4>
            <p className="text-xs text-red-700 leading-relaxed font-sans">
              Este resultado es un borrador de verificación preliminar. No constituye evidencia de auditoría ni reemplaza la validación de un responsable humano.
            </p>
          </div>

        </div>
      </motion.div>

      {/* 2. Control Actions Panel */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl p-4 print:hidden" id="report-controls">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-sans text-xs font-semibold rounded-lg hover:bg-slate-850 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            id="action-btn-back"
          >
            <RotateCcw className="w-4 h-4" />
            Analizar otro PDF
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-sans text-xs font-medium rounded-lg active:scale-[0.98] transition-all cursor-pointer"
            id="action-btn-print"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            Imprimir Informe
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-sans text-xs font-medium rounded-lg active:scale-[0.98] transition-all cursor-pointer min-w-[130px] justify-center"
            id="action-btn-copy"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span className="text-emerald-700 font-bold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-gray-500" />
                Copiar Reporte
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowManualForm(!showManualForm);
            // Sync values from current result when opening
            setManualDuracion(result.duracionContrato !== null ? String(result.duracionContrato) : "");
            setManualPlazo(result.plazoEntrega !== null ? String(result.plazoEntrega) : "");
            setDuracionIsNull(result.duracionContrato === null);
            setPlazoIsNull(result.plazoEntrega === null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer font-sans ${
            showManualForm
              ? "bg-slate-100 text-slate-800"
              : "text-slate-600 hover:bg-gray-100"
          }`}
          id="action-btn-toggle-adjust"
        >
          <Sliders className="w-3.5 h-3.5" />
          Ajustes Manuales
          {showManualForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 3. Collapsible Manual Adjustment Panel */}
      <AnimatePresence>
        {showManualForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden print:hidden"
            id="manual-form-collapse"
          >
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <div className="border-b border-gray-150 pb-2">
                <h3 className="text-sm font-semibold text-gray-800 font-sans flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-slate-600" />
                  Corregir o Forzar Parámetros de Verificación
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 font-sans">
                  Si la lectura automática por OCR/re-extraído falló debido a la calidad del documento escaneado, modifique manualmente los valores para recalcular el informe.
                </p>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4" id="manual-adjust-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Duración del contrato block */}
                  <div className="space-y-2 p-3 bg-slate-50/50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700 font-sans">
                        Duración del contrato
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer font-sans">
                        <input
                          type="checkbox"
                          checked={duracionIsNull}
                          onChange={(e) => {
                            setDuracionIsNull(e.target.checked);
                            if (e.target.checked) setManualDuracion("");
                          }}
                          className="rounded border-gray-300 pointer-events-auto cursor-pointer"
                        />
                        Sin consignar o nulo
                      </label>
                    </div>
                    <input
                      type="number"
                      disabled={duracionIsNull}
                      value={manualDuracion}
                      onChange={(e) => setManualDuracion(e.target.value)}
                      placeholder="Ej: 10"
                      min="1"
                      className="w-full text-xs p-2 border border-gray-200 rounded bg-white disabled:bg-gray-100 disabled:text-gray-400 font-mono focus:border-slate-800 outline-hidden"
                    />
                  </div>

                  {/* Plazo de entrega block */}
                  <div className="space-y-2 p-3 bg-slate-50/50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700 font-sans">
                        Plazo de entrega (Detalle)
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer font-sans">
                        <input
                          type="checkbox"
                          checked={plazoIsNull}
                          onChange={(e) => {
                            setPlazoIsNull(e.target.checked);
                            if (e.target.checked) setManualPlazo("");
                          }}
                          className="rounded border-gray-300 pointer-events-auto cursor-pointer"
                        />
                        Sin consignar o nulo
                      </label>
                    </div>
                    <input
                      type="number"
                      disabled={plazoIsNull}
                      value={manualPlazo}
                      onChange={(e) => setManualPlazo(e.target.value)}
                      placeholder="Ej: 10"
                      min="1"
                      className="w-full text-xs p-2 border border-gray-200 rounded bg-white disabled:bg-gray-100 disabled:text-gray-400 font-mono focus:border-slate-800 outline-hidden"
                    />
                  </div>

                </div>

                <div className="flex justify-end pt-2 border-t border-gray-150">
                  <button
                    type="submit"
                    disabled={isLoadingIa}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-white font-sans text-xs font-semibold rounded-lg disabled:bg-stone-300 disabled:border-stone-200 transition-all cursor-pointer shadow-xs"
                    id="submit-manual-calc"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingIa ? "animate-spin" : ""}`} />
                    Recalcular y Generar Fundamento
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
