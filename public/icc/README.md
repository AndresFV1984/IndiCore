# Perfiles ICC para Conversión img (RGB → CMYK)

Coloque los archivos `.icc` en esta carpeta (`public/icc/`). La aplicación **prioriza** los perfiles instalados aquí sobre los empaquetados en el bundle.

## Perfil incluido en el proyecto

- **`GenericCMYK_LCMS.icc`** — perfil CMYK genérico de Little CMS, empaquetado con la app. Permite convertir sin configuración adicional. **No sustituye** perfiles de imprenta (ISO Coated, SWOP, GRACoL).

## Perfiles CMYK de imprenta (opcionales)

| Archivo en esta carpeta | Estándar | Descarga gratuita |
|---|---|---|
| `SWOP2006_Coated3v2.icc` | USA — SWOP 2006 Coated3 | Paquetes ECI / Adobe / Color.org |
| `ISOcoated_v2_eci.icc` | Europa — ISO Coated v2 | [ECI — European Color Initiative](https://www.eci.org/en/downloads) |
| `GRACoL2006_Coated1v2.icc` | GRACoL 2006 alta calidad | [IDEAlliance](https://www.idealliance.org/) / paquetes comerciales |

### Pasos recomendados (ECI / Europa)

1. Visite [https://www.eci.org/en/downloads](https://www.eci.org/en/downloads)
2. Descargue el paquete **ICC profiles** (p. ej. `ECI_Offset_2009.zip`) — **no use enlaces directos a `.icc`**: suelen redirigir a una página HTML.
3. Extraiga `ISOcoated_v2_300_eci.icc` o equivalente y renómbrelo a **`ISOcoated_v2_eci.icc`**
4. Copie el archivo a `public/icc/ISOcoated_v2_eci.icc`
5. Compruebe que el archivo es un ICC válido (firma `acsp` en el byte 36, no HTML).

### Pasos para SWOP (USA)

1. Desde ECI, Color.org o su RIP, localice **SWOP2006 Coated3 v2**
2. Copie el `.icc` como **`SWOP2006_Coated3v2.icc`** en esta carpeta

### Pasos para GRACoL 2006

1. Descargue **GRACoL2006_Coated1v2.icc** desde IDEAlliance o su RIP
2. Colóquelo como **`GRACoL2006_Coated1v2.icc`** en esta carpeta

## Perfil RGB de entrada (opcional)

| Archivo | Uso |
|---|---|
| `sRGB_IEC61966-2.1.icc` | Solo si selecciona «sRGB (archivo .icc)» en la UI |

Por defecto la app usa el perfil sRGB **integrado en LCMS2** (`cmsCreate_sRGBProfile`), sin necesidad de archivo.

## Verificación

Tras copiar los archivos, abra **Impresión → Conversión img**. Los perfiles instalados aparecerán habilitados en el selector CMYK. Si un perfil figura como «no instalado», compruebe el nombre exacto del archivo y que no sea una página web guardada como `.icc`.

## Motor de color

- Librería: **lcms-wasm** (Little CMS 2 en WebAssembly, ~64 KB)
- Carga diferida: solo al abrir la pestaña Conversión img
- Procesamiento: hilo principal (lcms-wasm no funciona en Web Worker)

## Impacto en el bundle

| Opción | Tamaño aprox. | Notas |
|---|---|---|
| **lcms-wasm** (implementado) | ~64 KB JS+WASM | Lazy load + chunk separado en build |
| **GenericCMYK_LCMS.icc** | ~545 KB | Perfil CMYK empaquetado para conversión inmediata |
| wasm-vips (alternativa) | ~8 MB | No requerido; usar solo si necesita pipeline libvips completo |
