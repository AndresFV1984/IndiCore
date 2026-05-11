import React, { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'

interface TypeaheadSelectProps<T> {
  options: T[]
  onSearch: (query: string) => void
  onSelect: (item: T) => void
  renderOption: (item: T) => React.ReactNode
  placeholder: string
}

function TypeaheadSelect<T>({ options, onSearch, onSelect, renderOption, placeholder }: TypeaheadSelectProps<T>) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    onSearch(query)
  }, [query, onSearch])

  const handleSelect = (item: T) => {
    onSelect(item)
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div className="typeahead">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="typeahead-input"
      />
      {isOpen && options.length > 0 && (
        <div className="typeahead-dropdown">
          {options.map((option, index) => (
            <div
              key={index}
              className="typeahead-option"
              onClick={() => handleSelect(option)}
            >
              {renderOption(option)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TypeaheadSelect
