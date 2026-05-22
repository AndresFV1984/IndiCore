import React from 'react'

type IconName = 'print' | 'edit' | 'view' | 'delete' | 'inactivate' | 'export'

interface Props {
  name: IconName
  size?: number
  className?: string
  /** Estado actual del registro; usado por el icono de activar/inactivar */
  active?: boolean
}

const strokeProps = {
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const ActionIcon: React.FC<Props> = ({ name, size = 16, className, active = true }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  }

  switch (name) {
    case 'print':
      return (
        <svg {...common} className={className} aria-hidden="true" focusable="false">
          <path
            d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
            {...strokeProps}
          />
          <path d="M6 14h12v8H6z" {...strokeProps} />
        </svg>
      )
    case 'export':
      return (
        <svg {...common} className={className} aria-hidden="true" focusable="false">
          <path d="M12 3v12" {...strokeProps} />
          <path d="M8 11l4 4 4-4" {...strokeProps} />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" {...strokeProps} />
        </svg>
      )
    case 'edit':
      return (
        <svg {...common} className={className} aria-hidden="true" focusable="false">
          <path
            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
            {...strokeProps}
          />
          <path
            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
            {...strokeProps}
          />
        </svg>
      )
    case 'view':
      return (
        <svg {...common} className={className} aria-hidden="true" focusable="false">
          <path
            d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"
            {...strokeProps}
          />
          <circle cx="12" cy="12" r="3" {...strokeProps} />
        </svg>
      )
    case 'delete':
      return (
        <svg {...common} className={className} aria-hidden="true" focusable="false">
          <path d="M4 7h16" {...strokeProps} />
          <path
            d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"
            {...strokeProps}
          />
          <path
            d="M6.5 7l1.2 12.2a1.5 1.5 0 0 0 1.5 1.3h6.6a1.5 1.5 0 0 0 1.5-1.3L18.5 7"
            {...strokeProps}
          />
          <path d="M10 11v5.5M14 11v5.5" {...strokeProps} />
        </svg>
      )
    case 'inactivate': {
      const knobX = active ? 17 : 7
      return (
        <svg {...common} className={className} aria-hidden="true" focusable="false">
          <rect x="0.5" y="7.5" width="23" height="9" rx="4.5" {...strokeProps} />
          <circle cx={knobX} cy={12} r={6.5} {...strokeProps} />
          {active ? (
            <path d="M13.5 12.5 L15.5 14.5 L20.5 9.5" {...strokeProps} />
          ) : (
            <>
              <path d="M4.5 9.5 L9.5 14.5" {...strokeProps} />
              <path d="M9.5 9.5 L4.5 14.5" {...strokeProps} />
            </>
          )}
        </svg>
      )
    }
    default:
      return null
  }
}

export default ActionIcon
