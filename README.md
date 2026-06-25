# Verificador de Concordancia entre Orden de Compra y Pliego de Convenio Marco

> Trabajo Final Integrador — Diplomatura en IA Aplicada a Entornos Digitales de Gestión (FCE-UBA, Cohorte 2026)
> Autor: Nicolás Paolucci

**Estado actual: v3 — Aplicación web completa desplegada. Extracción de PDF en el navegador, comparación de los tres puntos de verificación, y generación de fundamento normativo y de práctica vía Gemini. Demo pública: https://verificaci-n-de-concordancia-convenio-marco-pba-872200808165.us-west1.run.app**

## El problema

En la Contaduría General de la Provincia de Buenos Aires, el control de Órdenes de Compra emitidas bajo la modalidad Convenio Marco incluye verificar que las condiciones consignadas en cada orden sean consistentes entre sí y con lo que establece el Pliego de Bases y Condiciones Particulares correspondiente. Esta verificación se hace hoy de forma manual, revisando cada documento contra el pliego del convenio al que pertenece.

Es una tarea repetitiva, basada en criterio profesional específico, y propensa a error humano por volumen — exactamente el tipo de tarea que vale la pena asistir con IA sin delegarle la decisión final.

## Qué hace este prototipo (alcance del MVP)

El sistema verifica **una sola regla de consistencia interna de plazos**, aplicada a Órdenes de Compra de **un único Convenio Marco** (Convenio Marco para la adquisición de artículos de limpieza y afines, Pliego PLIEG-2025-22986458-GDEBA-DATOPCGP, Proceso PBAC N° 614-0563-LPU25).

A partir de v3, el sistema funciona como una aplicación web: el usuario carga el PDF de la Orden de Compra directamente en el navegador, donde se extraen los tres valores a verificar, se aplica la regla de consistencia, y un modelo de lenguaje (Gemini) redacta el párrafo de fundamento normativo y de práctica a partir del resultado ya calculado — no genera el veredicto, solo la explicación en lenguaje natural de un resultado que la lógica determinística ya resolvió (ver /docs/bitacora.md, Entrada 6).

La regla tiene tres puntos de verificación que deben coincidir entre sí:

1. **Duración del contrato** (campo declarado en los datos generales de la Orden de Compra).
2. **Plazo de entrega** (campo declarado en el detalle de entrega de la misma Orden de Compra).
3. **Plazo fijado por el Pliego** para ese Convenio Marco (10 días corridos).

### Una aclaración metodológica importante

El Artículo 19 del Pliego establece este plazo como un **máximo** ("dentro de un plazo máximo de diez días corridos"). Sin embargo, la práctica de control administrativo real lo aplica como un **valor exacto**, no como un tope que la orden puede simplemente no superar. Esta distinción no surge de una lectura literal de la norma — surge de la experiencia de control diario del autor en su rol en la Contaduría General. El sistema implementa el criterio de la práctica administrativa (igualdad estricta), no la interpretación literal más permisiva del texto del pliego. Esta decisión, y su fundamento, se documentan en detalle en la bitácora metodológica (`/docs/bitacora.md`).

## Qué NO hace este prototipo (decisiones de alcance, no limitaciones por desconocimiento)

- **No verifica el lugar de entrega** (radio de 60 km establecido en el mismo Artículo 19). Esta verificación requiere geocodificación de direcciones de texto libre, con riesgo de imprecisión en direcciones administrativas informales. Se evaluó y se descartó del MVP por relación costo/beneficio desfavorable frente al tiempo disponible, priorizando la regla de plazos por ser la de mayor valor diferencial (criterio profesional propio, no texto ya explícito en la norma).
- **No generaliza a otros Convenios Marco.** El sistema está diseñado y probado contra un único pliego. Generalizar requeriría poder leer y parametrizar reglas de pliegos con estructuras distintas, lo cual está fuera del alcance de este TFI.
- **No persiste datos entre sesiones.** No se utiliza base de datos (se evaluó Supabase y se descartó por no resolver ningún problema real dentro de este alcance acotado).
- **No constituye evidencia válida de auditoría.** El resultado que produce el sistema es un borrador de verificación preliminar que requiere validación humana antes de tener cualquier efecto administrativo.

## Datos utilizados

Todos los casos de prueba (`/casos_prueba`) son **completamente ficticios**, diseñados específicamente para este trabajo. No se utilizó ningún documento real de contratación, conforme a lo establecido en el Artículo 12 de la Resolución N° RESO-2025-9-GDEBA-SSGDMGGP ("Reglas para el desarrollo, implementación y uso responsable de sistemas de Inteligencia Artificial para la Administración Pública de la Provincia de Buenos Aires"), que exige consentimiento expreso para el uso de datos personales en el entrenamiento o prueba de sistemas de IA, salvo excepciones legales que no aplican a este caso.

Cada PDF de caso de prueba incluye un encabezado visible que lo identifica como documento ficticio de uso académico.

## Marco normativo de referencia

- Pliego de Bases y Condiciones Particulares — PLIEG-2025-22986458-GDEBA-DATOPCGP (Convenio Marco artículos de limpieza).
- Ley N° 13.981 de Compras y Contrataciones de la Provincia de Buenos Aires y su Decreto Reglamentario N° DECTO-2019-59-GDEBA-GPBA.
- Resolución N° RESO-2025-9-GDEBA-SSGDMGGP — Reglas de IA para la Administración Pública de la Provincia de Buenos Aires (en particular, Artículos 6, 7, 8 y 12).

## Encuadre AIBPS

| Dimensión | Cómo se aborda |
|---|---|
| **Control** | El sistema señala discrepancias y las fundamenta; no decide ni ejecuta ninguna acción administrativa. La validación final queda siempre en una persona, conforme al principio de centralidad de la persona humana (Art. 6.III de la Resolución de IA de PBA). |
| **Protección** | Datos 100% sintéticos. Ningún dato personal o información contractual real es procesado, cargado ni almacenado por el sistema. |
| **Agilidad** | La verificación manual de los tres campos contra el pliego (ubicar valores en la Orden de Compra, comparar contra el Convenio Marco, redactar la observación) toma entre 5 y 7 minutos por documento, según cronometraje propio del autor en su rol de control en la Contaduría General. El sistema desplegado (v3) completa el mismo proceso — extracción, comparación y redacción del fundamento — en 2 a 3 segundos por documento. La reducción no elimina la revisión humana del resultado (ver dimensión Control), pero libera el tiempo que antes se usaba en la tarea mecánica de ubicar y comparar valores, dejándolo disponible para el juicio profesional sobre el caso. |
| **Fluidez** | El flujo de uso es directo: cargar el PDF, obtener resultado y fundamento en 2-3 segundos, sin pasos intermedios para el usuario final. Sin embargo, ajustar el comportamiento del modelo generativo vía prompt no resultó igualmente fluido: dos intentos de corrección de una ambigüedad puntual en la redacción libre del fundamento no modificaron el resultado generado, sin que se haya podido establecer con certeza la causa (ver /docs/bitacora.md, Entrada 13). La fluidez del producto final para el usuario de control no implica fluidez equivalente en el proceso de ajuste fino del comportamiento del LLM durante el desarrollo. |

## Estructura del repositorio

```
/app                → Aplicación web completa (v3), construida en Google AI Studio. Desplegada en Cloud Run.
/casos_prueba       → Órdenes de Compra ficticias usadas como input de prueba (5 casos)
/docs               → Pliego de referencia, bitácora metodológica
/src                → Lógica de extracción y comparación: verificador.py (v1, Python) y verificador.js (puerto a JavaScript, base de la integración en /app)
README.md           → Este archivo
```

## Plan de versiones

- **v0**: definición de alcance y casos de prueba ficticios (Entradas 1-3 de la bitácora)
- **v1**: extracción determinística de campos del PDF (pdfplumber + regex) y lógica de comparación de los tres puntos de verificación, sin redacción de alertas (Entradas 4-5).
- **v2**: generación del párrafo de fundamento normativo y de práctica mediante Gemini 3 Flash Preview, con prompt de 6 reglas explícitas, probado contra los tres resultados posibles (Entradas 6-7).
- **v3**: puerto de la lógica a JavaScript (pdf.js) e integración completa en una aplicación web construida en Google AI Studio — extracción en el navegador, comparación y generación de fundamento en un solo flujo, con migración no decidida a Gemini 3.5 Flash detectada y validada, y despliegue público en Cloud Run (Entradas 8-14).
- **v4 (no realizada)**: quedó fuera de alcance por límite de tiempo frente a la fecha de entrega; ver sección "Qué NO hace este prototipo" para las extensiones identificadas y conscientemente no implementadas.

## Por qué este enfoque y no otro

Antes de llegar a este diseño se evaluaron y descartaron otras alternativas: un simulador educativo de formulación presupuestaria (descartado por no responder a un problema real verificado), un observatorio de riesgos contractuales con datos reales de contrataciones (descartado por incompatibilidad con normativa de protección de datos), un asistente de preguntas y respuestas sobre normativa vía RAG (descartado por alto riesgo de genericidad), y un anonimizador de documentos (válido, pero finalmente no elegido frente a esta opción). El proceso completo de descarte está documentado en la bitácora metodológica, porque forma parte de la metodología del trabajo, no solo su resultado final.
