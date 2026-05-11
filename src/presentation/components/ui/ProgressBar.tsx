import React from 'react'
import clsx from 'clsx'

interface ProgressBarProps {
  value: number
  max: number
  colorScheme: 'success' | 'warning' | 'danger'
  showLabel?: boolean
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, colorScheme, showLabel }) => {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className="progress-bar-container">
      <div className="progress-bar">
        <div
          className={clsx('progress-bar-fill', `progress-${colorScheme}`)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="progress-bar-label">
          {value} / {max}
        </span>
      )}
    </div>
  )
}

export default ProgressBar
