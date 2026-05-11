import React from 'react'
import clsx from 'clsx'

interface ChipFilterProps {
  options: { label: string; value: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
}

const ChipFilter: React.FC<ChipFilterProps> = ({ options, selected, onChange }) => {
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(s => s !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="chip-filter">
      {options.map(option => (
        <button
          key={option.value}
          className={clsx('chip', { 'chip-selected': selected.includes(option.value) })}
          onClick={() => handleToggle(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default ChipFilter
