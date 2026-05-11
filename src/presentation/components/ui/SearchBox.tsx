import React, { useState, useEffect } from 'react'
import clsx from 'clsx'

interface SearchBoxProps {
  placeholder: string
  onSearch: (query: string) => void
  debounceMs?: number
}

const SearchBox: React.FC<SearchBoxProps> = ({ placeholder, onSearch, debounceMs = 300 }) => {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, onSearch, debounceMs])

  return (
    <div className="search-box">
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
      />
    </div>
  )
}

export default SearchBox
