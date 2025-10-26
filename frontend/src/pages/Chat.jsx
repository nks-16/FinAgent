import React, { useState } from 'react'
import { api } from '../lib/api'
import ThemeToggle from '../components/ThemeToggle'

export default function Chat(){
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState(null)

  const ask = async (e)=>{
    e.preventDefault(); if(!prompt.trim()) return; setBusy(true)
    try {
      const out = await api.chat(prompt)
      setRes(out)
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <nav className="navbar px-4 py-3">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <span className="text-2xl font-bold text-black dark:text-white">FinAgent Chat</span>
          <div className="flex gap-2 items-center">
            <a className="btn-outline text-sm" href="/">Dashboard</a>
            <ThemeToggle />
          </div>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="card">
          <h5 className="text-xl font-bold mb-4 text-black dark:text-white">AI Financial Assistant</h5>
          <form onSubmit={ask} className="flex gap-2 mb-4">
            <input 
              className="input-field flex-1" 
              placeholder="Ask about finance, markets, strategies..." 
              value={prompt} 
              onChange={e=>setPrompt(e.target.value)} 
            />
            <button className="btn-primary" disabled={busy}>Ask</button>
          </form>
          {res && (
            <div className="mt-6 space-y-4">
              <div>
                <h6 className="font-bold mb-2 text-black dark:text-white">Answer</h6>
                <div className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap text-black dark:text-white">
                  {res.answer || ''}
                </div>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <strong className="text-black dark:text-white">Sources:</strong>
                {res.sources?.web && res.sources.web.length > 0 && (
                  <div className="mt-2">
                    <em className="text-gray-600 dark:text-gray-400">Web:</em>
                    <div className="ml-4 space-y-1">
                      {res.sources.web.map((u,i)=>(
                        <div key={i}>
                          <a 
                            href={u} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-black dark:text-white underline hover:opacity-70 transition-opacity"
                          >
                            {u}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {res.sources?.rag && res.sources.rag.length > 0 && (
                  <div className="mt-2">
                    <em className="text-gray-600 dark:text-gray-400">RAG Docs:</em> {res.sources.rag.length} retrieved
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
