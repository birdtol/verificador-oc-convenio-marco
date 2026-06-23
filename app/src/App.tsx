import React, { useState } from "react";
import Uploader from "./components/Uploader";
import ReportView from "./components/ReportView";
import { VerificationResult, VericadorResultado } from "./types";
import { FileText, AlertCircle, RefreshCw, Layers } from "lucide-react";

export default function App() {
  const [isParsing, setIsParsing] = useState(false);
  const [isLoadingIa, setIsLoadingIa] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ filename: string; rawText: string } | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const PLIEGO_PLAZO = 10;

  // Perform calculations according to strict administrative rules requested:
  const computeVerificationResult = (
    duracionContrato: number | null,
    plazoEntrega: number | null
  ): Omit<VerificationResult, "explicacionIa"> => {
    // 1. DATO_INCOMPLETO detection
    if (duracionContrato === null || plazoEntrega === null) {
      let missing = "";
      if (duracionContrato === null && plazoEntrega === null) {
        missing = "Duración del contrato y Plazo de entrega";
      } else if (duracionContrato === null) {
        missing = "Duración del contrato";
      } else {
        missing = "Plazo de entrega";
      }

      return {
        resultado: "DATO_INCOMPLETO",
        duracionContrato,
        plazoEntrega,
        plazoPliego: PLIEGO_PLAZO,
        campoFaltante: missing,
        detalleDiscrepancia: `No se pudo emitir veredicto de concordancia por faltar el dato: ${missing}.`,
      };
    }

    // 2. CONCORDANTE detection
    if (duracionContrato === PLIEGO_PLAZO && plazoEntrega === PLIEGO_PLAZO) {
      return {
        resultado: "CONCORDANTE",
        duracionContrato,
        plazoEntrega,
        plazoPliego: PLIEGO_PLAZO,
        campoFaltante: null,
        detalleDiscrepancia: null,
      };
    }

    // 3. DISCREPANCIA detection
    // All 3 different
    if (
      duracionContrato !== plazoEntrega &&
      duracionContrato !== PLIEGO_PLAZO &&
      plazoEntrega !== PLIEGO_PLAZO
    ) {
      return {
        resultado: "DISCREPANCIA",
        duracionContrato,
        plazoEntrega,
        plazoPliego: PLIEGO_PLAZO,
        campoFaltante: null,
        detalleDiscrepancia: `Los tres plazos son distintos: Duración del Contrato (${duracionContrato} días), Plazo de Entrega (${plazoEntrega} días) y Plazo de Pliego (${PLIEGO_PLAZO} días).`,
      };
    }

    // Two are equal, one is different
    let detalle = "";
    if (duracionContrato === plazoEntrega && duracionContrato !== PLIEGO_PLAZO) {
      detalle = `La Duración del Contrato y el Plazo de Entrega coinciden en ${duracionContrato} días, pero difieren del Plazo del Pliego que de forma invariable exige ${PLIEGO_PLAZO} días.`;
    } else if (duracionContrato === PLIEGO_PLAZO && plazoEntrega !== PLIEGO_PLAZO) {
      detalle = `El Plazo de Entrega (${plazoEntrega} días) se desvía de los otros dos valores coordinados que son la Duración del Contrato y el Pliego (${PLIEGO_PLAZO} días).`;
    } else if (plazoEntrega === PLIEGO_PLAZO && duracionContrato !== PLIEGO_PLAZO) {
      detalle = `La Duración del Contrato (${duracionContrato} días) se desvía de los otros dos valores coordinados que son el Plazo de Entrega y el Pliego (${PLIEGO_PLAZO} días).`;
    }

    return {
      resultado: "DISCREPANCIA",
      duracionContrato,
      plazoEntrega,
      plazoPliego: PLIEGO_PLAZO,
      campoFaltante: null,
      detalleDiscrepancia: detalle,
    };
  };

  const generateIaExplanation = async (verificationObj: Omit<VerificationResult, "explicacionIa">) => {
    setIsLoadingIa(true);
    try {
      const response = await fetch("/api/gemini/generate-explanation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verificationObj),
      });

      if (!response.ok) {
        throw new Error("Respuesta no satisfactoria del servidor de IA");
      }

      const data = await response.json();
      setResult({
        ...verificationObj,
        explicacionIa: data.explanation || null,
      });
    } catch (err: any) {
      console.error(err);
      // Degrade gracefully with a generic fallback that conforms exactly to system prompts rules
      let fallbackText = "";
      if (verificationObj.resultado === "CONCORDANTE") {
        fallbackText = `Se concluye que el informe es CONCORDANTE debido a que la duración del contrato y el plazo de entrega coinciden exactamente con el término predefinido de ${PLIEGO_PLAZO} días del Pliego de Convenio Marco.`;
      } else if (verificationObj.resultado === "DISCREPANCIA") {
        fallbackText = `Se observa una discrepancia ya que el plazo de duración de contrato (${verificationObj.duracionContrato !== null ? verificationObj.duracionContrato : "no consignado"} días) o de entrega (${verificationObj.plazoEntrega !== null ? verificationObj.plazoEntrega : "no consignado"} días) no coinciden con el plazo del Pliego (${PLIEGO_PLAZO} días); conforme al Artículo 19 del Pliego PLIEG-2025-22986458-GDEBA-DATOPCGP, el plazo se fija como máximo, no obstante, la práctica administrativa de control aplica un criterio de igualdad estricta entre los valores comparados.`;
      } else {
        const campo = verificationObj.campoFaltante || "del documento de compra";
        fallbackText = `El resultado de control es DATO_INCOMPLETO. La ausencia verificada de datos relativos a ${campo} impide de forma absoluta emitir una resolución concluyente sobre la concordancia.`;
      }

      setResult({
        ...verificationObj,
        explicacionIa: fallbackText,
      });
    } finally {
      setIsLoadingIa(false);
    }
  };

  const handleStartParsing = () => {
    setIsParsing(true);
    setErrorMessage(null);
  };

  const handleFinishParsing = async (extracted: {
    duracionContrato: number | null;
    plazoEntrega: number | null;
    rawText: string;
    filename: string;
  }) => {
    setIsParsing(false);
    setFileMeta({
      filename: extracted.filename,
      rawText: extracted.rawText,
    });

    const verificationObj = computeVerificationResult(
      extracted.duracionContrato,
      extracted.plazoEntrega
    );

    // Call the server API endpoint to query Gemini and complete the report
    await generateIaExplanation(verificationObj);
  };

  const handleUpdateValues = async (
    newDuracion: number | null,
    newPlazo: number | null
  ) => {
    const updatedVerification = computeVerificationResult(newDuracion, newPlazo);
    // Recalculate and fetch the new explanation
    await generateIaExplanation(updatedVerification);
  };

  const handleReset = () => {
    setResult(null);
    setFileMeta(null);
    setErrorMessage(null);
    setIsParsing(false);
    setIsLoadingIa(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between" id="app-root-div">
      
      {/* Government Ribbon Banner Header */}
      <header className="bg-slate-900 border-b border-gray-800 py-4 px-6 shadow-sm print:hidden" id="app-nav-header">
        <div className="max-w-5xl mx-auto flex items-center justify-between" id="app-nav-flex-box">
          <div className="flex items-center gap-3" id="app-nav-brand-area">
            <div className="p-2 bg-slate-800 rounded-lg text-slate-300" id="brand-badge-box">
              <Layers className="w-5 h-5 text-gray-100" id="brand-layers-icon" />
            </div>
            <div>
              <h1 className="text-sm font-sans font-semibold tracking-tight text-white m-0 leading-tight">
                GDEBA — Concordancia de Convenio Marco
              </h1>
              <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase m-0 mt-0.5">
                Contaduría General de la Provincia de Buenos Aires
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2" id="app-nav-indicators">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider font-mono bg-slate-800/80 px-2 py-1 rounded border border-gray-700/50">
              Mesa de Control
            </span>
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider font-mono bg-emerald-950/40 px-2 py-1 rounded border border-emerald-900/40">
              Sistema Operativo
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 md:py-12" id="app-main-content">
        
        {/* Error Alert Display */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-900 rounded-lg flex items-start gap-3" id="app-error-display-box">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-800">
                Observación Externa de Operación
              </h3>
              <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="mt-2 text-xs font-semibold underline text-red-900 hover:text-red-950 cursor-pointer"
              >
                Descartar advertencia
              </button>
            </div>
          </div>
        )}

        {isParsing ? (
          /* Parsing loading display state */
          <div className="flex flex-col items-center justify-center py-20 space-y-4" id="app-parser-loader">
            <RefreshCw className="w-10 h-10 text-slate-800 animate-spin stroke-[1.5]" />
            <div className="text-center space-y-1">
              <span className="block text-sm font-semibold text-gray-800">
                Leyendo archivo PDF
              </span>
              <span className="block text-xs text-gray-400 font-mono">
                Extrayendo variables mediante patrones de examen administrativo...
              </span>
            </div>
          </div>
        ) : !result ? (
          /* Normal Uploader input screen */
          <Uploader
            onStartParsing={handleStartParsing}
            onFinishParsing={handleFinishParsing}
            onError={(msg) => setErrorMessage(msg)}
          />
        ) : (
          /* Render detailed report once calculated */
          <ReportView
            result={result}
            filename={fileMeta?.filename || "Orden_de_Compra_Extraccion.pdf"}
            isLoadingIa={isLoadingIa}
            onReset={handleReset}
            onUpdateValues={handleUpdateValues}
          />
        )}

      </main>

      {/* Footer info containing standard PBA notes */}
      <footer className="border-t border-gray-200 py-6 px-6 bg-white print:hidden" id="app-footer">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400 font-mono" id="app-footer-grid">
          <p>© 2026 Contaduría General de la Provincia de Buenos Aires.</p>
          <p className="text-[10px]">VERSIÓN 1.29 (COMPOSICIÓN DE CONCORDANCIA PLIEG-2025)</p>
        </div>
      </footer>

    </div>
  );
}
