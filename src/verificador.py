python# -*- coding: utf-8 -*-
"""
v1 — Extracción de campos + lógica de comparación (SIN generación de IA todavía).

Lee una Orden de Compra en PDF (formato PBAC, layout fijo confirmado para el
Convenio Marco de artículos de limpieza) y extrae los tres campos necesarios
para la regla de consistencia interna de plazos:

  1. Duración del contrato       (Datos de la orden de compra)
  2. Plazo de entrega            (Detalle de entrega — texto puede venir
                                   fragmentado en varias líneas por el PDF)
  3. Plazo fijo del Pliego       (constante, no se extrae del PDF: este MVP
                                   cubre un único Convenio Marco)

Decisión de diseño (ver /docs/bitacora.md, Entrada 1): el plazo del Pliego
se aplica como valor EXACTO, no como máximo, por criterio de práctica
administrativa real, no por lectura literal del Artículo 19.
"""

import re
import pdfplumber

# Valor fijo del Pliego para el Convenio Marco de artículos de limpieza
# (PLIEG-2025-22986458-GDEBA-DATOPCGP, Proceso PBAC 614-0563-LPU25, Art. 19).
# Aplicado como valor exacto, no como máximo (criterio de práctica administrativa).
PLAZO_PLIEGO_DIAS = 10
ARTICULO_FUNDAMENTO = "Artículo 19 del Pliego PLIEG-2025-22986458-GDEBA-DATOPCGP"


def extraer_texto_completo(path_pdf: str) -> str:
    """Concatena el texto de todas las páginas del PDF."""
    texto = ""
    with pdfplumber.open(path_pdf) as pdf:
        for pagina in pdf.pages:
            contenido = pagina.extract_text()
            if contenido:
                texto += contenido + "\n"
    return texto


def extraer_duracion_contrato(texto: str):
    """
    Busca la línea 'Duración del contrato: X Días corridos'.
    Devuelve un entero (días) o None si el campo no fue consignado o no se
    encontró el patrón esperado.
    """
    match = re.search(r"Duración del contrato:\s*(\d+)\s*Días?\s*corridos", texto, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None  # cubre tanto "[CAMPO NO CONSIGNADO]" como ausencia total del campo


def extraer_plazo_entrega_detalle(texto: str):
    """
    Busca el patrón 'Durante los/el X Día(s) corridos' dentro del Detalle de
    entrega. Este campo puede aparecer fragmentado en varias líneas en el
    texto extraído del PDF (el salto de línea visual de la tabla no respeta
    el límite del campo) — por eso NO se busca línea por línea, sino con una
    expresión regular sobre el texto completo, permitiendo saltos de línea
    entre "corridos" y el resto de la cláusula.
    """
    match = re.search(
        r"Durante\s+los?\s+(\d+)\s*Días?\s*corridos",
        texto,
        re.IGNORECASE,
    )
    if match:
        return int(match.group(1))
    return None


def extraer_campos(path_pdf: str) -> dict:
    """Extrae todos los campos relevantes de una Orden de Compra en PDF."""
    texto = extraer_texto_completo(path_pdf)
    return {
        "archivo": path_pdf,
        "duracion_contrato": extraer_duracion_contrato(texto),
        "plazo_entrega_detalle": extraer_plazo_entrega_detalle(texto),
        "plazo_pliego": PLAZO_PLIEGO_DIAS,
    }


def verificar_consistencia(campos: dict) -> dict:
    """
    Aplica la regla de consistencia interna de plazos (3 puntos de
    verificación): duración del contrato, plazo de entrega del detalle y
    plazo fijo del Pliego deben ser EXACTAMENTE iguales entre sí.

    Devuelve un diccionario con el resultado y, si corresponde, el detalle
    de qué campo(s) no coinciden o no pudieron leerse.
    """
    duracion = campos["duracion_contrato"]
    plazo_detalle = campos["plazo_entrega_detalle"]
    plazo_pliego = campos["plazo_pliego"]

    campos_faltantes = []
    if duracion is None:
        campos_faltantes.append("Duración del contrato")
    if plazo_detalle is None:
        campos_faltantes.append("Plazo de entrega (detalle de entrega)")

    if campos_faltantes:
        return {
            "resultado": "DATO_INCOMPLETO",
            "campos_faltantes": campos_faltantes,
            "detalle": campos,
        }

    valores = {duracion, plazo_detalle, plazo_pliego}
    if len(valores) == 1:
        return {
            "resultado": "CONCORDANTE",
            "valor_coincidente": duracion,
            "detalle": campos,
        }

    # Identificar el patrón de discrepancia: con 3 puntos de verificación,
    # cuando hay desacuerdo lo más informativo es señalar cuál de los tres
    # campos es el que se "desvía" de los otros dos (o, si los tres difieren
    # entre sí, reportarlo como tal), en lugar de listar cada comparación
    # de a pares por separado — varias comparaciones de a pares suelen
    # describir el mismo problema de fondo visto desde ángulos distintos.
    campos_nombre = {
        "duracion": ("Duración del contrato", duracion),
        "detalle": ("Plazo de entrega (detalle de entrega)", plazo_detalle),
        "pliego": ("Plazo fijado por el Pliego", plazo_pliego),
    }

    # ¿Hay un campo que es el único distinto (los otros dos coinciden)?
    valores_individuales = {
        "duracion": duracion, "detalle": plazo_detalle, "pliego": plazo_pliego
    }
    contador = {}
    for clave, val in valores_individuales.items():
        contador.setdefault(val, []).append(clave)

    grupo_mayoritario = max(contador.items(), key=lambda kv: len(kv[1]))
    valor_correcto, claves_correctas = grupo_mayoritario

    if len(claves_correctas) == 2:
        # Patrón claro: un campo se desvía, los otros dos concuerdan.
        clave_desviada = [c for c in valores_individuales if c not in claves_correctas][0]
        nombre_desviado, valor_desviado = campos_nombre[clave_desviada]
        observacion = (
            f"{nombre_desviado} indica {valor_desviado} días, mientras que el resto "
            f"de los campos verificados coincide en {valor_correcto} días."
        )
    else:
        # Los tres valores son distintos entre sí: no hay un único campo
        # "desviado", se informan los tres valores tal como fueron leídos.
        observacion = (
            "Los tres campos verificados no coinciden entre sí: "
            f"Duración del contrato = {duracion} días, "
            f"Plazo de entrega (detalle) = {plazo_detalle} días, "
            f"Plazo fijado por el Pliego = {plazo_pliego} días."
        )

    return {
        "resultado": "DISCREPANCIA",
        "observacion": observacion,
        "detalle": campos,
    }


def procesar_orden_compra(path_pdf: str) -> dict:
    """Función principal: extrae y verifica en un solo paso."""
    campos = extraer_campos(path_pdf)
    return verificar_consistencia(campos)


if __name__ == "__main__":
    import json

    casos = [
        "casos_prueba/Caso_1_Concordante.pdf",
        "casos_prueba/Caso_2_Discrepancia_Duracion_Contrato.pdf",
        "casos_prueba/Caso_3_Discrepancia_Plazo_Entrega.pdf",
        "casos_prueba/Caso_4_Dato_Incompleto.pdf",
    ]

    for caso in casos:
        resultado = procesar_orden_compra(caso)
        print(f"\n{'=' * 70}")
        print(f"Archivo: {caso}")
        print(f"{'=' * 70}")
        print(json.dumps(resultado, indent=2, ensure_ascii=False))
