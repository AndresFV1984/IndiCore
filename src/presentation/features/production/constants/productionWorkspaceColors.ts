/** Máx. 3 tonos suaves para secciones del workspace de orden nueva */
export const PRODUCTION_WS_TONES = [
  {
    id: 0,
    bg: '#edf2f7',
    border: '#c5d4e3',
    accent: '#6b8499',
    tagBg: '#e2eaf2',
    tagText: '#4a6278',
  },
  {
    id: 1,
    bg: '#edf5f1',
    border: '#c5ddd2',
    accent: '#5f8572',
    tagBg: '#e3f0ea',
    tagText: '#3d6b58',
  },
  {
    id: 2,
    bg: '#f2f0f6',
    border: '#d4cfe0',
    accent: '#7a7289',
    tagBg: '#ebe8f2',
    tagText: '#5c5568',
  },
] as const

export type ProductionWorkspaceTone = 0 | 1 | 2

export function workspaceToneAt(index: number): ProductionWorkspaceTone {
  return (index % 3) as ProductionWorkspaceTone
}
