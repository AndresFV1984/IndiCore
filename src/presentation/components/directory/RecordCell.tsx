import React from 'react'

interface RecordCellProps {
  name: string
  meta?: string
}

const RecordCell: React.FC<RecordCellProps> = ({ name, meta }) => (
  <div className="record-cell">
    <span className="record-cell__name">{name}</span>
    {meta ? <span className="record-cell__meta">{meta}</span> : null}
  </div>
)

export default RecordCell
