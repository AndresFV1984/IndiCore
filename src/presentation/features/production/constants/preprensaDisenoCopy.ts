/** Textos de la sección Preprensa › Diseño */
export const PREPRENSA_DISENO_COPY = {
  acabados: {
    lineaTroquel: 'L\u00EDnea troquel',
    reservaUv: 'Reserva UV',
    estampado: 'Estampado',
    repuje: 'Repuje',
  },
  sectionTags: {
    trabajo: 'Historial',
    identidad: 'Nombre',
    costo: 'Costo',
    archivo: 'PDF',
    especificaciones: 'T\u00E9cnico',
    acabados: 'Acabados',
    montaje: 'Montaje',
  },
  existente: {
    ariaLabel: 'Configuraci\u00F3n del dise\u00F1o existente',
    modeLabel: 'Dise\u00F1o existente',
    trabajoTitle: 'Trabajo ya realizado',
    trabajoSubtitle:
      'Seleccione una orden anterior de este cliente para reutilizar su informaci\u00F3n',
    specsSubtitle:
      'Colores, planchas y registros t\u00E9cnicos (igual que en dise\u00F1o nuevo). Opcionalmente importe un trabajo anterior arriba.',
  },
  nuevo: {
    ariaHistorial: 'Informaci\u00F3n del trabajo ya realizado',
    ariaNuevo: 'Configuraci\u00F3n del dise\u00F1o nuevo',
    tituloHistorial: 'Datos del trabajo anterior',
    tituloNuevo: 'Datos del dise\u00F1o nuevo',
    leadHistorial:
      'Revise la informaci\u00F3n importada y ajuste solo lo que cambie en esta orden.',
    leadNuevo:
      'Complete las secciones en orden. Cada bloque agrupa un aspecto del arte y la producci\u00F3n.',
    bannerTitulo: 'Informaci\u00F3n del trabajo ya realizado',
    refDiseno: 'Dise\u00F1o',
    sinNombreDiseno: 'Sin nombre de dise\u00F1o',
    bannerDesc:
      'Los campos siguientes se completaron con los datos registrados en esa orden anterior. Revise y ajuste solo lo que cambie en esta producci\u00F3n.',
    nombreTituloHistorial: 'Nombre del dise\u00F1o',
    nombreTitulo: 'Nombre',
    nombreLabel: 'Nombre del dise\u00F1o',
    nombreSubHistorial: 'Registrado en el trabajo anterior',
    nombreSub: 'Nombre del trabajo gr\u00E1fico',
    nombrePlaceholder: 'Ej. Empaque caja premium 2026',
    servicioTitulo: 'Servicio de dise\u00F1o',
    servicioSubHistorial: 'Costo registrado en el trabajo anterior',
    servicioSub: 'Valor del servicio de dise\u00F1o',
    pdfSub: (maxMb: number) => `M\u00E1ximo ${maxMb} MB`,
    pdfPlaceholder: 'Haga clic para seleccionar archivo',
    pdfExaminar: 'Examinar',
    pdfQuitar: 'Quitar',
    pdfPreview: (fileName: string) => `Vista previa: ${fileName}`,
    specsTitulo: 'Especificaciones t\u00E9cnicas',
    specsSubHistorial: 'Datos t\u00E9cnicos del trabajo anterior',
    acabadosTitulo: 'Acabados de dise\u00F1o',
    acabadosSub: 'Seleccione los que apliquen',
    acabadosAria: 'Acabados',
    montajeTitulo: 'Precio de montaje',
    montajeSub: 'Seleccione la tarifa que aplica a esta orden',
  },
  coloresPlanchas: {
    tamanosBuenosFormula: 'Cantidad ÷ Cavidades (redondeo al entero más cercano)',
    faltaCavidad: 'Falta cavidades',
    faltaCantidad: 'Falta cantidad',
  },
  pdf: {
    soloPdf: 'Solo se permiten archivos PDF.',
    maxSize: (maxMb: number) => `El archivo no debe superar ${maxMb} MB.`,
    previewLoading: 'Generando vista previa…',
    previewError:
      'No se pudo mostrar la vista previa en este dispositivo. Puede abrir el archivo con el enlace.',
    previewOpen: (fileName: string) => `Abrir ${fileName}`,
    previewPagesHint: (total: number) =>
      `Vista previa: página 1 de ${total}. Use «Abrir» para ver el documento completo.`,
  },
} as const
