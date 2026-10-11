#!/usr/bin/env python3
"""Prepare web assets from the delivered San Carlos workshop, without new raster analysis.

Usage:
    python scripts/prepare_assets.py --materiales /path/Taller_San_Carlos

Requires Pillow, Fiona, Shapely >= 2.1 and fontTools. The original IBM Plex Sans
variable font and its OFL license are bundled in docs/assets/fonts (dist in Sites). No network
connection is used. Install dependencies separately before running this script.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import os
from pathlib import Path

import fiona
from fontTools.ttLib import TTFont
from PIL import Image
import shapely
from shapely.geometry import shape


PROJECT = Path(__file__).resolve().parents[1]
OFFICIAL_SHA256 = "7ce31d8c5825ccb80836fb58830ba1053ce5784871b98a60cc1ad8e655cfde11"
SOURCE_NAME = "Instituto Geográfico Nacional / Registro Nacional, publicado mediante SNIT"
SOURCE_URL = "https://geos.snitcr.go.cr/be/IGN_5_CO/wfs?service=WFS&request=GetCapabilities"
METADATA_URL = "https://meta2.snitcr.go.cr/geonetwork/srv/api/records/CR_IGN_LTA_DTA_5K_VE/formatters/xml"
WEB_WIDTH, WEB_HEIGHT, PADDING = 900, 1000, 28
SIMPLIFICATION_M = 25.0


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def atomic_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    with tmp.open("wb") as handle:
        handle.write(data)
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(tmp, path)
    if path.read_bytes() != data:
        raise RuntimeError(f"Incomplete write: {path}")


def atomic_json(path: Path, data: dict) -> None:
    atomic_bytes(path, (json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode())


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def prepare_maps(base: Path, dist: Path) -> list[dict]:
    media = dist / "assets/media"
    rows = []
    for source_folder in ("cartografia", "figuras"):
        for source in sorted((base / source_folder).glob("*.png")):
            with Image.open(source) as im:
                im.load()
                width = 1800 if im.width / im.height >= 1.45 else 1600
                if source.stem == "00_mapa_portada_sin_rotulos":
                    width = 1600
                width = min(width, im.width)  # Never add invented detail by upscaling.
                height = round(im.height * width / im.width)
                # This only resizes previously rendered cartography for display.
                # It does not alter, classify or recalculate the source rasters.
                resized = im.convert("RGB").resize((width, height), Image.Resampling.LANCZOS)
                buffer = io.BytesIO()
                resized.save(buffer, format="WEBP", quality=91, method=6)
                payload = buffer.getvalue()
                destination = media / f"{source.stem}.webp"
                atomic_bytes(destination, payload)
                with Image.open(destination) as check:
                    check.load()
                    assert check.size == (width, height)
                rows.append({
                    "name": source.stem,
                    "url": f"assets/media/{destination.name}",
                    "source": f"{source_folder}/{source.name}",
                    "sourceSha256": sha(source.read_bytes()),
                    "sourceSize": [im.width, im.height],
                    "displaySize": [width, height],
                    "bytes": len(payload),
                    "sha256": sha(payload),
                })
    if len(rows) != 18:
        raise ValueError(f"Expected 18 supplied maps/figures, found {len(rows)}")
    return rows


def prepare_font(dist: Path, font_source: Path | None) -> dict:
    target = dist / "assets/fonts/IBMPlexSans-Variable.ttf"
    if font_source is not None:
        atomic_bytes(target, font_source.read_bytes())
    if not target.is_file() or not (target.parent / "OFL.txt").is_file():
        raise FileNotFoundError("The bundled original variable font and OFL.txt must be present.")
    font = TTFont(target, recalcTimestamp=False)
    axes = {axis.axisTag: [axis.minValue, axis.defaultValue, axis.maxValue] for axis in font["fvar"].axes}
    assert axes["wght"] == [100.0, 400.0, 700.0]
    # WOFF is a lossless font container; the original name table and outlines
    # are preserved. This avoids modified static instances with reserved names.
    font.flavor = "woff"
    buf = io.BytesIO()
    font.save(buf)
    woff = target.with_suffix(".woff")
    atomic_bytes(woff, buf.getvalue())
    check = TTFont(woff)
    assert check["name"].getDebugName(1) == font["name"].getDebugName(1)
    atomic_bytes(target.parent / "README.txt", (
        "IBM Plex Sans, fuente variable original (peso 100–700, ancho 75–100).\n"
        "TTF original: https://github.com/google/fonts/tree/main/ofl/ibmplexsans\n"
        "Licencia: SIL Open Font License 1.1, archivo OFL.txt.\n"
        "Copyright © 2017 IBM Corp.; nombre reservado Plex.\n"
        "El archivo WOFF conserva los contornos y nombres de la fuente TTF.\n"
        "La preparación no crea instancias estáticas ni altera el diseño.\n"
        "Licencia obtenida del repositorio oficial Google Fonts el 11 de octubre de 2026.\n"
        "Uso CSS: font-family: 'IBM Plex Sans'; font-weight: 100 700;\n"
        "src: url('./IBMPlexSans-Variable.woff') format('woff');\n"
    ).encode())
    return {"family": "IBM Plex Sans", "axes": axes, "url": "assets/fonts/IBMPlexSans-Variable.woff",
            "license": "SIL Open Font License 1.1", "licenseUrl": "assets/fonts/OFL.txt",
            "originalBytes": target.stat().st_size, "webBytes": woff.stat().st_size,
            "originalSha256": sha(target.read_bytes()), "webSha256": sha(woff.read_bytes())}


def svg_path(geom, convert) -> str:
    polygons = [geom] if geom.geom_type == "Polygon" else list(geom.geoms)
    chunks = []
    for polygon in polygons:
        for ring in [polygon.exterior, *polygon.interiors]:
            coordinates = [convert(x, y) for x, y, *_ in ring.coords]
            # The final vertex duplicates the first; closing with Z is exact.
            chunks.append("M" + " L".join(f"{x:.2f},{y:.2f}" for x, y in coordinates[:-1]) + " Z")
    return " ".join(chunks)


def territory(base: Path, district_stats: dict) -> tuple[dict, dict]:
    source = base / "datos/limites/san_carlos_ign_8908.gpkg"
    assert sha(source.read_bytes()) == OFFICIAL_SHA256, "Official geometry snapshot differs from the workshop."
    with fiona.open(source, layer="distritos") as dataset:
        assert dataset.crs.to_epsg() == 8908
        records = list(dataset)
        bounds = list(dataset.bounds)
    records.sort(key=lambda row: int(row["properties"]["cod_dta"]))
    shapes = [shape(record["geometry"]) for record in records]
    assert len(shapes) == 13 and all(g.is_valid for g in shapes)
    assert shapely.coverage_is_valid(shapes), "Coverage must be valid before simplification."
    simplified = shapely.coverage_simplify(shapes, tolerance=SIMPLIFICATION_M)
    assert shapely.coverage_is_valid(simplified)

    min_x, min_y, max_x, max_y = bounds
    scale = min((WEB_WIDTH - 2 * PADDING) / (max_x - min_x),
                (WEB_HEIGHT - 2 * PADDING) / (max_y - min_y))
    x_offset = (WEB_WIDTH - (max_x - min_x) * scale) / 2
    y_offset = (WEB_HEIGHT - (max_y - min_y) * scale) / 2

    def convert(x, y):
        return (x_offset + (x - min_x) * scale,
                y_offset + (max_y - y) * scale)  # Highest northing is at the top.

    stats = {int(row["cod_dta"]): row for row in district_stats["filas"]}
    assert set(stats) == set(range(21001, 21014))
    rows = []
    for feature, original, display in zip(records, shapes, simplified):
        properties = dict(feature["properties"])
        code = int(properties["cod_dta"])
        row = stats[code]
        assert properties["nombre"] == row["distrito"]
        assert math.isclose(properties["area_km2"], row["area_vector_km2"], abs_tol=1e-8)
        centroid = original.centroid
        inside = original.representative_point()
        rows.append({
            "id": str(code), "code": code, "name": row["distrito"],
            "svgPath": svg_path(display, convert),
            "centroid": [round(v, 2) for v in convert(centroid.x, centroid.y)],
            "labelPoint": [round(v, 2) for v in convert(inside.x, inside.y)],
            "areaHa": row["area_cuadricula_ha"],
            "vectorAreaHa": row["area_vector_km2"] * 100,
            "commonCells": row["celdas_comparables"],
            "commonHa": row["area_comparable_ha"],
            "coveragePct": row["cobertura_porcentaje"],
            "commonWeightPct": row["peso_soporte_comun_cantonal_porcentaje"],
            "meanF1": row["ndvi_f1_media"], "meanF2": row["ndvi_f2_media"],
            "delta": row["delta_ndvi_media"],
            "deltaStdPopulation": row["delta_ndvi_desviacion_poblacional"],
            "mndwiCommonHa": row["mndwi_area_comparable_ha"],
            "mndwiCoveragePct": row["mndwi_cobertura_porcentaje"],
        })
    units = {
        "areaHa": "ha; superficie rasterizada que actúa como denominador de cobertura",
        "vectorAreaHa": "ha; área de la geometría oficial en EPSG:8908",
        "commonHa": "ha; celdas con NDVI válido en ambas composiciones",
        "coveragePct": "% de areaHa", "commonWeightPct": "% del soporte común cantonal NDVI",
        "meanF1": "NDVI sin unidad, sobre soporte común", "meanF2": "NDVI sin unidad, sobre soporte común",
        "delta": "NDVI F2−F1 sin unidad, sobre soporte común",
        "centroid": "coordenadas SVG del centroide geométrico original",
        "labelPoint": "coordenadas SVG de un punto interior original, adecuado para rótulos",
    }
    out = {
        "viewBox": "0 0 900 1000", "source": SOURCE_NAME, "sourceUrl": SOURCE_URL,
        "metadataUrl": METADATA_URL, "crs": "EPSG:8908", "crsName": "CR-SIRGAS / CRTM05",
        "officialVersion": "20260410001", "retrievedDate": "2026-10-11",
        "sourceSha256": OFFICIAL_SHA256, "bounds8908": bounds, "northUp": True,
        "displayNote": "Geometrías oficiales simplificadas exclusivamente para visualización. "
                       "El mapa no permite medición ni replanteo. Las superficies y estadísticas proceden "
                       "de los datos completos del taller, descargables en GeoPackage y GeoTIFF.",
        "simplification": {"method": "Shapely coverage_simplify, Visvalingam–Whyatt con cobertura preservada",
                           "toleranceMeters": SIMPLIFICATION_M,
                           "toleranceMeaning": "Parámetro aproximadamente igual a la raíz cuadrada del área de los triángulos retirados; no es una cota de error posicional.",
                           "svgCoordinateDecimals": 2, "fillRule": "evenodd"},
        "transform": {"scaleSvgUnitsPerMeter": scale, "xOffset": x_offset, "yOffset": y_offset,
                      "formulaX": "xOffset + (easting - minEasting) * scale",
                      "formulaY": "yOffset + (maxNorthing - northing) * scale"},
        "units": units, "districts": rows,
    }
    audit = {"officialSha256Matches": True, "districts": len(rows),
             "originalVertices": sum(int(shapely.get_num_coordinates(g)) for g in shapes),
             "displayVertices": sum(int(shapely.get_num_coordinates(g)) for g in simplified),
             "inputCoverageValid": True, "displayCoverageValid": True, "northUp": True,
             "simplificationMeters": SIMPLIFICATION_M}
    return out, audit


def sites(base: Path) -> dict:
    document = read_json(base / "solucion/respuestas_sitios.json")
    basenames = ["S01_Pital", "S02_La_Fortuna", "S03_Pocosol", "S04_Cutris", "S05_Quesada"]
    assert len(document["sites"]) == 5
    for site, name in zip(document["sites"], basenames):
        assert name.startswith(site["id_sitio"] + "_")
        site["id"] = site["id_sitio"]
        site["name"] = site["distrito"]
        site["image"] = f"assets/media/{name}.webp"
    assert document["sites"][1]["observaciones"]["f1"]["indices"]["ndvi"] is None
    assert document["sites"][1]["comparacion"]["delta_ndvi"] is None
    document["sourceFile"] = "solucion/respuestas_sitios.json"
    document["webNote"] = "Valores originales completos; null se conserva como ausencia de dato. Sólo se añadieron id, name e image para la navegación web."
    return document


def statistics(base: Path, districts: dict) -> tuple[dict, dict]:
    aggregation = read_json(base / "analisis/agregacion_cantonal_distrital.json")
    pairs = read_json(base / "analisis/matriz_pares_fechas_ndvi.json")
    sensitivity = read_json(base / "analisis/sensibilidad_mndwi_soporte_comun.json")
    c, a = aggregation["cobertura"], aggregation["agregaciones"]
    rows = districts["filas"]
    common_cells = sum(row["celdas_comparables"] for row in rows)
    assert common_cells == c["comparables_celdas"] == pairs["denominador_celdas"] == 4979989
    assert sum(row["celdas"] for row in pairs["filas"]) == common_cells
    assert math.isclose(sum(row["area_cuadricula_ha"] for row in rows), c["cuadricula_cantonal_ha"], abs_tol=1e-7)
    assert math.isclose(sum(row["area_comparable_ha"] for row in rows), c["comparables_ha"], abs_tol=1e-7)
    weighted = sum(row["delta_ndvi_media"] * row["celdas_comparables"] for row in rows) / common_cells
    assert math.isclose(weighted, a["media_ponderada_celdas_comparables"], abs_tol=1e-12)
    assert math.isclose(sum(row["delta_ndvi_media"] for row in rows) / 13, a["media_simple_13_distritos"], abs_tol=1e-12)
    for row in sensitivity["filas"]:
        assert sum(row[f"{key}_celdas"] for key in ["ninguna", "ambas", "solo_f2", "solo_f1"]) == row["soporte_comun_celdas"]
    out = {
        "title": "Resultados de referencia del taller San Carlos",
        "source": SOURCE_NAME + "; índices derivados de Sentinel-2 L2A según la preparación documentada del taller.",
        "areaUnit": "ha", "cellAreaHa": 0.04, "cellResolutionMeters": 20,
        "coverage": {"gridCells": c["cuadricula_cantonal_celdas"], "gridHa": c["cuadricula_cantonal_ha"],
                     "commonCells": c["comparables_celdas"], "commonHa": c["comparables_ha"],
                     "coveragePct": c["comparables_porcentaje"], "excludedCells": c["excluidas_celdas"],
                     "excludedHa": c["excluidas_ha"], "excludedPct": c["excluidas_porcentaje"],
                     "criterion": c["criterio"]},
        "datePairs": [{"f1": row["fecha_f1"], "f2": row["fecha_f2"], "days": row["intervalo_dias"],
                       "cells": row["celdas"], "areaHa": row["area_ha"],
                       "sharePct": row["porcentaje_soporte_comun_ndvi"],
                       "cantonSharePct": row["porcentaje_cuadricula_cantonal"], "delta": row["delta_ndvi_media"]}
                      for row in pairs["filas"]],
        "datePairsNote": pairs["interpretacion"],
        "aggregation": {"simpleMean": a["media_simple_13_distritos"],
                        "weightedMean": a["media_ponderada_celdas_comparables"],
                        "difference": a["diferencia_ponderada_menos_simple"],
                        "cutrisPocosolPct": aggregation["cutris_y_pocosol"]["peso_media_ponderada_porcentaje"],
                        "simpleQuestion": a["pregunta_media_simple"], "weightedQuestion": a["pregunta_media_ponderada"],
                        "interpretation": a["interpretacion"]},
        "thresholds": [{"threshold": row["umbral_estricto"], "commonCells": row["soporte_comun_celdas"],
                        "commonHa": row["soporte_comun_ha"], "neitherHa": row["ninguna_ha"],
                        "bothHa": row["ambas_ha"], "onlyF2Ha": row["solo_f2_ha"], "onlyF1Ha": row["solo_f1_ha"],
                        "f1SelectedHa": row["f1_supera_sobre_comun_ha"], "f2SelectedHa": row["f2_supera_sobre_comun_ha"]}
                       for row in sensitivity["filas"]],
        "thresholdOperator": ">", "thresholdNote": sensitivity["alcance"],
        "canton": districts["canton"],
        "sourceFiles": ["analisis/agregacion_cantonal_distrital.json", "analisis/matriz_pares_fechas_ndvi.json",
                        "analisis/sensibilidad_mndwi_soporte_comun.json", "analisis/cuadro_distrital_ndvi.json"],
    }
    audit = {"districtCount": 13, "datePairCount": 6, "thresholdCount": 3,
             "commonNdviCells": common_cells, "commonNdviHa": c["comparables_ha"],
             "districtAreaAndCommonSumsMatch": True, "datePairsClose": True,
             "simpleAndWeightedMeansMatch": True, "thresholdFourStatesClose": True,
             "numericToleranceMean": 1e-12, "numericToleranceAreaHa": 1e-7}
    return out, audit


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--materiales", type=Path, required=True,
                        help="Merged Taller_San_Carlos folder from both delivered ZIP files")
    parser.add_argument("--dist", type=Path, default=PROJECT / ("docs" if (PROJECT / "docs").is_dir() else "dist"))
    parser.add_argument("--font-source", type=Path,
                        help="Optional original, unmodified IBM Plex Sans variable TTF; OFL.txt must already be bundled")
    args = parser.parse_args()
    base, dist = args.materiales.resolve(), args.dist.resolve()
    district_stats = read_json(base / "analisis/cuadro_distrital_ndvi.json")
    maps = prepare_maps(base, dist)
    font = prepare_font(dist, args.font_source)
    territory_data, geometry_audit = territory(base, district_stats)
    sites_data = sites(base)
    statistics_data, numeric_audit = statistics(base, district_stats)
    atomic_json(dist / "content/territorio.json", territory_data)
    atomic_json(dist / "content/sitios.json", sites_data)
    atomic_json(dist / "content/estadisticas.json", statistics_data)
    manifest = {"title": "Activos derivados para la web del taller San Carlos",
                "operation": "Optimización de láminas, serialización de valores existentes y simplificación geométrica para visualización. No se recalculan rásteres.",
                "assets": maps, "font": font, "geometryVerification": geometry_audit,
                "numericVerification": numeric_audit, "totalImageBytes": sum(row["bytes"] for row in maps),
                "software": {"shapely": shapely.__version__, "fiona": fiona.__version__}}
    atomic_json(dist / "assets/media/manifest.json", manifest)
    print(json.dumps({"images": len(maps), "imageBytes": manifest["totalImageBytes"],
                      "fontBytes": font["webBytes"], "geometry": geometry_audit, "numeric": numeric_audit},
                     ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
