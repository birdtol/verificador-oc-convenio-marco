# Verificador de Concordancia entre Orden de Compra y Pliego de Convenio Marco

> Trabajo Final Integrador — Diplomatura en IA Aplicada a Entornos Digitales de Gestión (FCE-UBA, Cohorte 2026)
> Autor: Nicolás Paolucci

**Estado actual: v0 — Definición de alcance y casos de prueba. Sin lógica de extracción ni comparación implementada todavía.**

## El problema

En la Contaduría General de la Provincia de Buenos Aires, el control de Órdenes de Compra emitidas bajo la modalidad Convenio Marco incluye verificar que las condiciones consignadas en cada orden sean consistentes entre sí y con lo que establece el Pliego de Bases y Condiciones Particulares correspondiente. Esta verificación se hace hoy de forma manual, revisando cada documento contra el pliego del convenio al que pertenece.

Es una tarea repetitiva, basada en criterio profesional específico, y propensa a error humano por volumen — exactamente el tipo de tarea que vale la pena asistir con IA sin delegarle la decisión final.

## Qué hace este prototipo (alcance del MVP)

El sistema verifica **una sola regla de consistencia interna de plazos**, aplicada a Órdenes de Compra de **un único Convenio Marco** (Convenio Marco para la adquisición de artículos de limpieza y afines, Pliego PLIEG-2025-22986458-GDEBA-DATOPCGP, Proceso PBAC N° 614-0563-LPU25).

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
| **Agilidad** | El sistema se inserta en el flujo de trabajo real existente (carga de PDF de Orden de Compra tal como llega en el expediente digital), sin imponer un formato de entrada nuevo. |
| **Fluidez** | Pendiente de desarrollo y reflexión en versiones siguientes, a medida que se prueben los casos límite. |

## Estructura del repositorio

```
/casos_prueba       → Órdenes de Compra ficticias usadas como input de prueba
/docs               → Pliego de referencia, bitácora metodológica
/src                → Código del sistema (a partir de v1)
README.md           → Este archivo
```

## Plan de versiones

- **v0 (actual):** definición de alcance, casos de prueba, documentación inicial.
- **v1:** extracción de campos del PDF (parsing determinístico) + comparación de los tres puntos de verificación, sin redacción de alertas todavía.
- **v2:** generación de la explicación de cada alerta mediante IA generativa, citando el artículo del pliego correspondiente.
- **v3:** ajustes a partir de casos límite (ej.: manejo de campos no consignados en la Orden de Compra).
- **v4 (si el tiempo lo permite):** documentación final y registro de extensiones futuras no implementadas.

## Por qué este enfoque y no otro

Antes de llegar a este diseño se evaluaron y descartaron otras alternativas: un simulador educativo de formulación presupuestaria (descartado por no responder a un problema real verificado), un observatorio de riesgos contractuales con datos reales de contrataciones (descartado por incompatibilidad con normativa de protección de datos), un asistente de preguntas y respuestas sobre normativa vía RAG (descartado por alto riesgo de genericidad), y un anonimizador de documentos (válido, pero finalmente no elegido frente a esta opción). El proceso completo de descarte está documentado en la bitácora metodológica, porque forma parte de la metodología del trabajo, no solo su resultado final.
