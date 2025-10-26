import React from 'react'

export default function RecommendationCard({ title, data, onApply }) {
  if (!data) return null

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
      <h6 className="font-bold mb-3 text-black dark:text-white">{title}</h6>
      <pre className="text-xs mb-3 max-h-48 overflow-auto bg-gray-50 dark:bg-black p-3 rounded text-black dark:text-white border border-gray-200 dark:border-gray-800">
        {JSON.stringify(data, null, 2)}
      </pre>
      {onApply && (
        <button className="btn-primary text-sm" onClick={onApply}>
          Apply
        </button>
      )}
    </div>
  )
}
