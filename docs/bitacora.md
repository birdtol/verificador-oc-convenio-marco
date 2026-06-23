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

## Entrada 10 — [pendiente]

*(Próxima entrada: integración completa en Google AI Studio — conexión automática entre el resultado de verificador.py y la llamada al modelo de Gemini.)*
