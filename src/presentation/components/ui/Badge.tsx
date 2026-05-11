import React from 'react'
import clsx from 'clsx'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'

interface BadgeProps {
  variant: BadgeVariant
  label: string
}

const Badge: React.FC<BadgeProps> = ({ variant, label }) => {
  return <span className={clsx('badge', `badge-${variant}`)}>{label}</span>
}

export default Badge
