# Bitácora Metodológica

Este archivo registra, en orden cronológico, las decisiones de diseño tomadas durante el desarrollo del proyecto: qué se decidió, qué alternativas se evaluaron y descartaron, cuál fue el fundamento de cada decisión (conocimiento profesional propio vs. resultado de trabajar con una herramienta de IA), y los errores o correcciones que surgieron en el proceso.

El objetivo de esta bitácora es que la sección de Metodología del informe final se redacte a partir de estos registros, no de memoria reconstruida después de terminado el proyecto.

---

## Entrada 1 — 18/06/2026 — Definición de la regla de "máximo" como "exacto"

**Decisión:** la verificación de plazo de entrega no aplica el criterio literal del Artículo 19 del Pliego ("plazo máximo de diez días corridos"), sino un criterio de igualdad estricta: el plazo declarado en la Orden de Compra debe coincidir exactamente con el valor fijado por el Pliego para ese Convenio Marco, no simplemente no superarlo.

**Alternativa descartada:** aplicar el texto literal de la norma (validar que el plazo de entrega sea menor o igual al máximo establecido).

**Fundamento:** conocimiento profesional propio. Esta distinción no surge de una lectura del pliego — surge de mi experiencia de control diario de Órdenes de Compra en la Contaduría General de la Provincia de Buenos Aires, donde la práctica administrativa real aplica el plazo del pliego como valor fijo, no como tope. Verifiqué que este criterio es consistente en todos los Convenios Marco que controlo, no es una particularidad de un rubro puntual.

**Por qué importa documentarlo así:** si se le hubiera pedido a una IA generativa que programara esta regla únicamente a partir del texto del pliego, el resultado habría sido una validación de "menor o igual a 10 días", que es la lectura literal correcta de la norma pero incorrecta respecto de cómo se controla en la práctica. Este es un ejemplo concreto de una decisión que la herramienta no podía tomar por sí sola, y que requirió corrección de mi parte después de una primera formulación más laxa de la regla.

---

## Entrada 2 — 18/06/2026 — Descarte de la verificación de radio de entrega (60 km)

**Decisión:** el MVP no incluye la verificación de que el lugar de entrega esté dentro del radio de 60 km del domicilio de la Autoridad de Aplicación, establecido también en el Artículo 19 del Pliego.

**Alternativa descartada:** incluir esta verificación en el MVP, implementando geocodificación de direcciones y cálculo de distancia.

**Fundamento:** evaluación de costo/beneficio. Esta verificación requiere convertir direcciones de texto libre en coordenadas geográficas (geocoding) y calcular distancia contra un punto fijo. A diferencia de la regla de plazos, el criterio de "60 km" está escrito de forma explícita y literal en el pliego — no requiere conocimiento profesional adicional para identificarlo, por lo que su valor diferencial es menor. Además, las direcciones administrativas reales no siempre tienen un formato limpio para geocodificar de forma confiable, lo que agrega riesgo de error silencioso. Se priorizaron las horas disponibles en la regla de plazos, que sí requiere y demuestra criterio profesional propio.

**Estado:** queda documentada como extensión identificada y conscientemente no implementada, no como una limitación por desconocimiento.

---

## Entrada 3 — 18/06/2026 — Descarte de Supabase como capa de persistencia

**Decisión:** el proyecto no utiliza base de datos. El estado de cada verificación vive únicamente durante la sesión de uso.

**Alternativa descartada:** usar Supabase (parte del stack validado del curso) para persistir casos cargados e historial de verificaciones.

**Fundamento:** el MVP está acotado a un solo Convenio Marco y a una demostración con casos de prueba puntuales, sin necesidad de que el sistema "recuerde" información entre sesiones distintas ni de que sirva a múltiples usuarios con datos compartidos. Incluir Supabase sin un problema real que resuelva habría agregado complejidad técnica (configuración, esquema, manejo de conexión) sin sumar a los criterios de evaluación del TFI, que priorizan creatividad, rigor metodológico y capacidad analítica por sobre la complejidad técnica.

**Nota:** se documenta en el informe como una opción evaluada y descartada por alcance, no por desconocimiento del stack del curso.

---

## Entrada 4 — 18/06/2026 — Fragmentación del campo "Plazo de entrega" en el texto del PDF

**Decisión:** la extracción del campo "Plazo de entrega" (Detalle de entrega) no se busca como una línea de texto única, sino con una expresión regular que permite que el patrón "Durante los X Días corridos" aparezca seguido de saltos de línea antes del resto de la cláusula ("a partir del Perfeccionamiento del documento contractual").

**Alternativa descartada:** asumir que cada campo del PDF corresponde a una sola línea de texto extraído (lectura línea por línea), que era el supuesto inicial de diseño.

**Fundamento:** al inspeccionar el texto crudo extraído del PDF (no la imagen visual) antes de escribir el código de extracción, se encontró que el campo de plazo de entrega se fragmenta en cuatro líneas distintas en el texto subyacente, aunque visualmente se presenta como una sola celda de tabla. El layout fijo del documento (confirmado previamente) es válido a nivel visual, pero no garantiza que el texto interno del PDF respete esa misma estructura. Esto requirió diseñar la extracción contra el texto real, no contra la apariencia del documento.

**Por qué importa documentarlo así:** es un ejemplo concreto de un supuesto de diseño que resultó incompleto y que se corrigió antes de que generara errores silenciosos. Si el patrón se hubiera buscado solo dentro de una línea, el campo de plazo de entrega no se habría podido extraer nunca, y el sistema habría reportado "dato incompleto" en todos los casos, incluido el concordante.

---

## Entrada 5 — 18/06/2026 — Agrupamiento de discrepancias múltiples en una sola observación

**Decisión:** cuando la regla de consistencia de plazos detecta una discrepancia, el sistema identifica cuál de los tres campos verificados es el que se aparta de los otros dos, y redacta una única observación señalando ese campo — en lugar de listar cada comparación de a pares como una discrepancia independiente.

**Alternativa descartada:** la primera versión de la lógica comparaba cada par de campos por separado (duración vs. pliego, detalle vs. pliego, duración vs. detalle) y devolvía una lista con todas las comparaciones que fallaban. Esto producía, en el caso de un solo campo desviado, dos "discrepancias" reportadas que en los hechos describían el mismo problema visto desde dos ángulos.

**Fundamento:** decisión de criterio propio sobre cómo debe leerse un resultado de control en la práctica — un controlador no necesita que se le señale la misma desviación dos veces con redacciones distintas, necesita identificar rápido cuál es el campo mal cargado. Se ajustó la lógica para que, cuando dos de los tres valores coincidan entre sí, el sistema señale explícitamente cuál es el valor que se aparta, y solo en el caso (sin ejemplo de prueba disponible) de que los tres valores fueran distintos entre sí, se informen los tres por separado.

**Nota:** el caso de "los tres valores distintos entre sí" está contemplado en el código pero no fue verificado contra ningún PDF de prueba real, porque no se diseñó un caso de prueba para ese escenario. Queda registrado como una rama de la lógica no probada empíricamente, a diferencia del resto de las reglas, que sí fueron validadas contra los cuatro casos de `/casos_prueba`.

---

## Entrada 6 — 18/06/2026 — Separación entre redacción del LLM y datos determinísticos

**Decisión:** el LLM no genera el mensaje completo de la alerta. Solo redacta el párrafo de "fundamento normativo y de práctica" a partir del JSON ya calculado por la lógica determinística (`verificar_consistencia()`). El resto del informe (resultado, valores de los tres campos, advertencia final sobre validación humana) se ensambla con un template de texto fijo, sin intervención del LLM.

**Alternativa descartada:** pedirle al LLM que generara el mensaje completo de la alerta a partir de los datos crudos de la Orden de Compra.

**Fundamento:** si el LLM redactara el mensaje completo cada vez, existiría el riesgo de que alterara o redondeara mal alguno de los valores numéricos, o citara mal el artículo del pliego si no se le da con precisión en cada llamada. Separando las responsabilidades, los números y el resultado (CONCORDANTE / DISCREPANCIA / DATO_INCOMPLETO) siempre provienen de la lógica determinística de Python, y el LLM se usa exclusivamente donde aporta valor real: lenguaje natural con matices (la distinción entre lectura literal de la norma y práctica administrativa), no aritmética ni citas exactas.

---

## Entrada 7 — 18/06/2026 — Diseño y prueba del prompt de generación de alertas (Google AI Studio, Gemini 3 Flash Preview)

**Decisión:** se diseñó un prompt de instrucciones de sistema con seis reglas explícitas, y se probó contra los tres resultados posibles de la verificación (CONCORDANTE, DISCREPANCIA, DATO_INCOMPLETO) usando los casos de prueba reales del proyecto.

**Configuración usada:** Gemini 3 Flash Preview, con "Grounding with Google Search" desactivado (no se necesita búsqueda externa para esta tarea) y Thinking level en "Medium".

**Resultado de las pruebas:**
- Caso 2 (discrepancia, duración=15 vs. resto=10): el modelo citó correctamente el Artículo 19 del Pliego, mantuvo la distinción entre "máximo" (norma) y "criterio de igualdad estricta" (práctica), y no alteró ningún valor numérico.
- Caso 1 (concordante, los tres valores=10): el modelo confirmó la coincidencia sin forzar la distinción norma/práctica, que solo corresponde al caso de discrepancia (regla 3 del prompt).
- Caso 4 (dato incompleto, duración=null): este era el caso de mayor riesgo, porque los otros dos campos coinciden en 10 días y existía la posibilidad de que el modelo "completara" el patrón asumiendo que el campo faltante también valía 10. El modelo señaló explícitamente la ausencia del dato y no asumió ningún valor en su lugar — la regla 4 del prompt se cumplió en la prueba.

**Por qué importa documentar que se probó específicamente este riesgo:** que el modelo no haya alucinado el dato faltante no es un resultado automático de cualquier prompt — es el resultado de un prompt diseñado con esa regla explícita, probado deliberadamente contra el caso donde ese error era más probable. Esta distinción (diseño + prueba dirigida, no "salió bien porque sí") es la que se documenta en el informe como evidencia de rigor metodológico.

---

## Entrada 8 — 18/06/2026 — Error propio durante la edición de `verificador.py`: pérdida accidental de una función existente

**Qué pasó:** al agregar las funciones `formatear_valor_campo()` y `ensamblar_informe()` a `verificador.py`, la edición reemplazó por error la línea que contenía la firma de la función `procesar_orden_compra()` (ya existente desde v1), eliminándola del archivo sin que fuera intencional.

**Cómo se detectó:** al ejecutar el script para probar el ensamblado del template contra los casos reales, Python arrojó un `ImportError` indicando que la función no existía en el módulo.

**Corrección:** se reinsertó la función `procesar_orden_compra()` inmediatamente después de `ensamblar_informe()`, y se volvió a ejecutar la prueba completa contra los Casos 2 y 4 antes de dar por válido el archivo.

**Por qué se documenta este error:** es un ejemplo concreto de "qué salió mal y cómo se corrigió" tal como lo pide la consigna del TFI. No se descubrió por revisión visual del código, sino porque la ejecución falló — lo cual refuerza por qué cada cambio al script se vuelve a probar contra los casos de `/casos_prueba` antes de considerarlo cerrado, en lugar de asumir que una edición fue exitosa sin volver a correr las pruebas.

---

## Entrada 9 — 23/06/2026 — Caso de prueba para la rama de "discordancia total" (tres valores distintos)

**Decisión:** se diseñó y agregó un quinto caso de prueba (`Caso_5_Discordancia_Total.pdf`) con los tres campos verificados en valores distintos entre sí (Duración del contrato = 12 días, Plazo de entrega del detalle = 8 días, Plazo fijado por el Pliego = 10 días), para validar empíricamente la rama de la lógica de comparación que hasta este punto solo existía en el código sin haber sido probada contra un documento real (ver Entrada 5).

**Resultado de la prueba:** el sistema identificó correctamente que ningún par de valores coincide entre sí, y aplicó la rama de reporte que informa los tres valores por separado ("Los tres campos verificados no coinciden entre sí..."), en lugar de forzar la identificación de un único "campo desviado" — que es el comportamiento correcto para este escenario, distinto del usado en los Casos 2 y 3 (donde dos de los tres valores sí coinciden).

**Por qué importa documentarlo:** cierra una limitación que había quedado explícitamente registrada en la Entrada 5 ("rama de la lógica no probada empíricamente"). El código no cambió — la lógica ya estaba escrita correctamente desde v1 — pero ahora existe evidencia concreta de que se comporta como se diseñó, no solo una expectativa teórica.

---

Te paso el bloque completo, listo para copiar y pegar tal cual en GitHub:
Entrada 10 — 23/06/2026 — Integración completa en Google AI Studio
Decisión: se construyó la aplicación web completa de v3 directamente en Google AI Studio, integrando en un solo proyecto la extracción de PDF en el navegador (puerto de la lógica de verificador.js usando pdf.js), la lógica de comparación, y la llamada al modelo de Gemini para la generación del párrafo de fundamento (vía un endpoint propio en server.ts, no llamado directamente desde el cliente).

Fundamento: este paso reemplaza la separación previa entre script de extracción/comparación (Python/JS, probado en entorno de desarrollo) y la generación de texto con LLM (probada por separado en v2), unificando todo en una sola aplicación funcional desplegable, conforme al flujo validado del curso (AI Studio → GitHub → Supabase → Vercel, aunque sin la etapa de Supabase, ver Entrada 3).

Entrada 11 — 23/06/2026 — Resolución de CORS en la carga de PDF dentro de la app web (v3)
Qué pasó: al integrar la extracción de PDF directamente en el navegador, la carga del archivo fallaba por una restricción de CORS al intentar cargar el worker de pdf.js.

Cómo se detectó: la app mostraba el flujo funcionando con un caso simulado (datos hardcodeados para pruebas), pero esa prueba no pasaba por la extracción real de PDF — por lo tanto no validaba el problema. Se exigió una prueba con un PDF real (Caso_1_Concordante.pdf) antes de aceptar que el flujo estaba resuelto, en lugar de confiar en el resultado del caso simulado.

Qué resolvió la herramienta: Gemini implementó una solución usando Blob URL para evitar el conflicto de CORS al cargar el worker de pdf.js.

Verificación: la prueba con el PDF real confirmó que la extracción funciona correctamente sobre un documento real, no solo sobre datos de prueba precargados.

Limitación no resuelta, documentada honestamente: en paralelo a esta corrección, el contador de errores y advertencias del entorno de AI Studio aumentó de forma sostenida (de 3 a 9 errores, de 2 a 14 advertencias) sin que se haya identificado la causa de esa acumulación. No impidió que la app funcionara en los casos de prueba ejecutados, pero queda como una limitación abierta del proceso de desarrollo asistido por IA: cada corrección puntual no necesariamente limpia código o advertencias previas.

Entrada 12 — 23/06/2026 — Migración no decidida del modelo de Gemini entre v2 y v3
Qué pasó: la Entrada 7 documenta la elección y prueba deliberada de Gemini 3 Flash Preview (model: "gemini-3-flash-preview") para la generación del párrafo de fundamento. Al revisar server.ts durante la integración a GitHub (v3), la línea de llamada al modelo usa model: "gemini-3.5-flash" — una versión distinta a la decidida.

Cómo se detectó: no por revisión visual del código en busca de errores, sino al cruzar el código real contra la bitácora, verificando que lo implementado coincidiera con lo documentado como decisión propia.

Qué resolvió la herramienta, sin que se lo pidiera: al generar la app completa en AI Studio, Gemini usó gemini-3.5-flash en server.ts sin que esto fuera una instrucción explícita ni una decisión consciente de mi parte. Se verificó contra la documentación oficial de Google que "gemini-3.5-flash" es la migración recomendada y sucesora de "gemini-3-flash-preview" (modelo preview, sin garantía de disponibilidad a largo plazo) — es decir, no es un nombre inválido ni un error de la herramienta, sino una actualización a la versión estable recomendada por el proveedor.

Decisión tomada: mantener gemini-3.5-flash en lugar de revertir a la versión preview, dado que es la versión de disponibilidad general recomendada. Se re-ejecutaron los casos de prueba para confirmar que el comportamiento documentado en la Entrada 7 se sostiene contra la nueva versión del modelo (ver Entrada 13 para el resultado de esa verificación, incluyendo un comportamiento que no se sostuvo).

Por qué importa documentarlo así: es un ejemplo concreto de un cambio que la herramienta introdujo por su cuenta entre etapas del proyecto, detectado solo por verificación cruzada deliberada contra la bitácora, no porque la app fallara o lo mostrara en pantalla. Es relevante para la dimensión "bajo supervisión humana" del framework AIBPS: una migración de modelo no solicitada, aunque termine siendo una mejora técnica, requiere que el desarrollador la detecte activamente para poder dar cuenta de qué versión está realmente en producción.

Entrada 13 — 23/06/2026 — Intento de corrección de ambigüedad en la frase introductoria libre (regla 2): dos correcciones fallidas, causa no diagnosticada
Punto de partida: al validar el Caso 2 (discrepancia: Duración del Contrato=15, Plazo de Entrega=10, Plazo de Pliego=10) contra gemini-3.5-flash, el párrafo generado contenía una frase introductoria ambigua: "el plazo de duración de contrato (15 días) o de entrega (10 días) no coinciden con el plazo del Pliego" — el conector "o" no deja claro cuál de los dos campos es el que realmente se aparta del Pliego.

Primer intento de corrección: se modificó la regla 2 del prompt agregando una instrucción explícita para identificar con precisión el campo desviado y una prohibición directa de usar la conjunción "o" entre campos en discrepancia. Se verificó el cambio carácter por carácter en server.ts, se recargó la app y se volvió a correr el Caso 2.

Resultado del primer intento: el párrafo generado fue idéntico al original, palabra por palabra.

Segundo intento de corrección: se reemplazó la instrucción negativa por una plantilla de frase fija con campos para completar entre corchetes, replicando el principio que había funcionado en la Entrada 7 para la oración del Artículo 19 (instrucción positiva con estructura exacta, en lugar de descripción de qué evitar). Se verificó el cambio carácter por carácter, se recargó y se volvió a correr el Caso 2.

Resultado del segundo intento: el párrafo generado fue, otra vez, idéntico al original.

Diagnóstico parcial, no concluyente: se descartó que el problema fuera cache del navegador o falta de recompilación (se forzó recarga completa entre cada intento). Se descartó también que el front-end mostrara un resultado fijo sin relación con el documento subido: al probar con un PDF distinto (Caso 1, concordante), el resultado cambió correctamente, confirmando que el sistema sí lee cada documento y llama a Gemini de forma real en cada caso. No se completó el diagnóstico de la causa raíz (no se verificó mediante un log en el servidor si la versión del prompt efectivamente enviada a la API coincidía con la del archivo editado) — se decidió no continuar esa verificación por prioridad de tiempo.

Qué no falló: en los tres intentos (original y dos correcciones), la oración fija e inmutable del Artículo 19 se reprodujo siempre carácter por carácter, sin alteración. El problema está acotado exclusivamente a la frase libre introductoria.

Por qué se documenta así, sin resolver: es una limitación real sobre el grado de control que un prompt en lenguaje natural ejerce sobre la redacción libre de un LLM, incluso aplicando un principio de diseño que había funcionado para otra parte del mismo prompt. Queda como evidencia para el Análisis crítico de la dimensión "bajo supervisión humana" del framework AIBPS.

Verificación adicional (25/06/2026): se confirmó que la ambigüedad persiste también en el entorno de producción (Cloud Run, tras guardado y republicación desde AI Studio), no solo en el entorno de preview de desarrollo. Esto descarta que el comportamiento se debiera a un problema de cache o de sincronización entre código y entorno de ejecución — el modelo reproduce la misma ambigüedad de forma consistente entre dos entornos de despliegue distintos.
