/**
 * Utility to extract text from PDF using PDF.js on the client-side
 * and extract exact fields using regular expressions.
 */

export const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Get PDF.js from window global loaded via index.html
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) {
    throw new Error(
      "La librería PDF.js no está disponible. Verifique su conexión de red o refresque la página."
    );
  }

  // Configure worker src dynamically using local Blob URL to bypass browser cross-origin worker worker restriction
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    try {
      const workerUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      const response = await fetch(workerUrl);
      if (response.ok) {
        const workerCode = await response.text();
        const blob = new Blob([workerCode], { type: "application/javascript" });
        pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
      } else {
        throw new Error("HTTP error " + response.status);
      }
    } catch (error) {
      console.warn("No se pudo iniciar el worker mediante Blob local. Usando fallback de URL directa cdnjs:", error);
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    
    fullText += pageText + "\n";
  }

  return fullText;
};

export interface ExtractedFields {
  duracionContrato: number | null;
  plazoEntrega: number | null;
  rawText: string;
}

export const extractFieldsFromText = (text: string): ExtractedFields => {
  // Pattern 1: "Duración del contrato:" followed by a number and "Días" or "Día"
  // Regex: /Duración del contrato:\s*(\d+)\s*Días?\s*corridos/i
  const duracionRegex = /Duración del contrato:\s*(\d+)\s*Días?\s*corridos/i;
  const duracionMatch = text.match(duracionRegex);
  const duracionContrato = duracionMatch ? parseInt(duracionMatch[1], 10) : null;

  // Pattern 2: "Durante los" or "Durante el" followed by a number and "Días corridos"
  // Regex: /Durante\s+los?\s+(\d+)\s*Días?\s*corridos/i
  const plazoRegex = /Durante\s+los?\s+(\d+)\s*Días?\s*corridos/i;
  const plazoMatch = text.match(plazoRegex);
  const plazoEntrega = plazoMatch ? parseInt(plazoMatch[1], 10) : null;

  return {
    duracionContrato,
    plazoEntrega,
    rawText: text,
  };
};

/**
 * Standard test PDF helpers to simulate a text output for testing purposes
 * if the user uploads a non-readable PDF or wants automated mock-loads.
 */
export const MOCK_TEXTS = {
  concordante: `PROVINCIA DE BUENOS AIRES
ORDEN DE COMPRA NRO. 402/2026
Convenio Marco: Artículos de Limpieza
Duración del contrato: 10 Días corridos contados a partir de...
Detalle y plazos: Durante los 10 Días corridos la entrega se realizará de acuerdo a las especificaciones...`,
  
  discrepanciaEntrega: `PROVINCIA DE BUENOS AIRES
ORDEN DE COMPRA NRO. 402/2026
Convenio Marco: Artículos de Limpieza
Duración del contrato: 10 Días corridos contados a partir de...
Detalle y plazos: Durante los 15 Días corridos la entrega se realizará de acuerdo a las especificaciones...`,

  discrepanciaAmbos: `PROVINCIA DE BUENOS AIRES
ORDEN DE COMPRA NRO. 402/2026
Convenio Marco: Artículos de Limpieza
Duración del contrato: 30 Días corridos contados a partir de...
Detalle y plazos: Durante el 12 Días corridos la entrega se realizará de acuerdo a las especificaciones...`,

  incompleto: `PROVINCIA DE BUENOS AIRES
ORDEN DE COMPRA NRO. 402/2026
Convenio Marco: Artículos de Limpieza
Detalle y plazos de entrega que no coincide con las regex pedidas.`
};
