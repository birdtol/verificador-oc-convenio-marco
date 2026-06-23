import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Server-side API endpoint for Gemini generation
app.post("/api/gemini/generate-explanation", async (req, res) => {
  try {
    const verificationData = req.body;
    if (!verificationData || typeof verificationData !== "object") {
      return res.status(400).json({ error: "Datos de verificación inválidos" });
    }

    const systemInstruction = `Sos un asistente que redacta observaciones de control para informes de verificación de Órdenes de Compra contra Pliegos de Convenio Marco, en el ámbito de la Contaduría General de la Provincia de Buenos Aires. Vas a recibir un resultado de verificación en formato JSON. Tu única tarea es redactar el campo "fundamento normativo y de práctica" del informe, en un párrafo breve (máximo 3 líneas), siguiendo estas reglas estrictas: 1. No inventes ni modifiques ningún valor numérico — usá exactamente los que aparecen en el JSON recibido. 2. Si el resultado es "DISCREPANCIA", primero indicá o mencioná cuáles son los valores numéricos de duración del contrato, plazo de entrega y plazo del pliego que no coinciden. Inmediatamente después, debés agregar de forma textual, idéntica e inmutable la siguiente oración completa, sin parafrasearla ni recombinarla de ninguna manera (ni siquiera cambiando el orden de las palabras): "conforme al Artículo 19 del Pliego PLIEG-2025-22986458-GDEBA-DATOPCGP, el plazo se fija como máximo, no obstante, la práctica administrativa de control aplica un criterio de igualdad estricta entre los valores comparados." 3. Si el resultado es "CONCORDANTE", redactá un párrafo breve confirmando que los tres valores coinciden, sin necesidad de explicar la distinción entre norma y práctica. 4. Si el resultado es "DATO_INCOMPLETO", indicá qué campo falta y aclará que no es posible emitir un veredicto de concordancia sin ese dato — nunca asumas un valor en su lugar. 5. No agregues ninguna recomendación de acción ni juicio sobre si la orden debe aprobarse o no — esa decisión queda en manos del responsable humano que revisa el informe. 6. Devolvé únicamente el párrafo solicitado, sin saludos ni texto adicional.`;

    const promptText = `JSON recibido:\n${JSON.stringify(verificationData, null, 2)}`;

    // Generate content using gemini-3.5-flash as specified in guidelines for basic text tasks
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for consistent rule adherence
      }
    });

    const explanation = response.text || "";
    return res.json({ explanation: explanation.trim() });
  } catch (error: any) {
    console.error("Error al llamar a la API de Gemini:", error);
    return res.status(500).json({
      error: "Ocurrió un error al generar el fundamento con Inteligencia Artificial.",
      details: error.message,
    });
  }
});

// Configure Vite integration or static file serving
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Corriendo en http://localhost:${PORT}`);
  });
};

startServer();
