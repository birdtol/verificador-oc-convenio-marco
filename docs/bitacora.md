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

## Entrada 4 — [pendiente]

*(Próxima entrada: decisiones tomadas durante la construcción de v1 — extracción de campos del PDF y lógica de comparación.)*
