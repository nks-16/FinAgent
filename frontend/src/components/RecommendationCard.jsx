import React from 'react'

export default function RecommendationCard({ title, data, onApply }) {
  if (!data) return null

  return (
    <div className="glass-card">
      <h6 className="mb-3" style={{fontWeight:700}}>{title}</h6>
      <pre className="small mb-3" style={{maxHeight:'200px',overflow:'auto'}}>
        {JSON.stringify(data, null, 2)}
      </pre>
      {onApply && (
        <button className="btn btn-primary btn-sm" onClick={onApply}>
          Apply
        </button>
      )}
    </div>
  )
}
