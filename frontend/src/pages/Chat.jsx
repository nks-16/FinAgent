import React, { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import ThemeToggle from '../components/ThemeToggle'

export default function Chat(){
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [conversations, setConversations] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef(null)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Load conversation history when session changes
  useEffect(() => {
    if (currentSession) {
      loadConversationMessages(currentSession)
    }
  }, [currentSession])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    try {
      const convs = await api.getConversations()
      setConversations(convs)
      // Auto-select the most recent conversation
      if (convs.length > 0 && !currentSession) {
        setCurrentSession(convs[0].session_id)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const loadConversationMessages = async (sessionId) => {
    try {
      const data = await api.getConversationMessages(sessionId)
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
      setMessages([])
    }
  }

  const createNewConversation = async () => {
    try {
      const newConv = await api.createNewConversation('New Conversation')
      setConversations([newConv, ...conversations])
      setCurrentSession(newConv.session_id)
      setMessages([])
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const deleteConversation = async (sessionId) => {
    if (!window.confirm('Delete this conversation?')) return
    try {
      await api.deleteConversation(sessionId)
      setConversations(conversations.filter(c => c.session_id !== sessionId))
      if (currentSession === sessionId) {
        setCurrentSession(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const ask = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    
    // Add user message to UI immediately
    const userMsg = { role: 'user', content: prompt, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    
    const question = prompt
    setPrompt('')
    setBusy(true)
    
    try {
      const response = await api.chatWithSession(question, currentSession)
      
      // Add assistant message
      const assistantMsg = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, assistantMsg])
      
      // Update current session ID if it changed (new session created)
      if (response.session_id !== currentSession) {
        setCurrentSession(response.session_id)
        loadConversations() // Refresh conversation list
      }
    } catch (error) {
      console.error('Chat error:', error)
      // Remove the optimistic user message on error
      setMessages(prev => prev.slice(0, -1))
      alert('Failed to send message: ' + error.message)
    } finally {
      setBusy(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
      <nav className="navbar px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="btn-outline text-sm"
            >
              {showSidebar ? '◀' : '▶'}
            </button>
            <span className="text-2xl font-bold text-black dark:text-white">FinAgent Chat</span>
          </div>
          <div className="flex gap-2 items-center">
            <a className="btn-outline text-sm" href="/">Dashboard</a>
            <ThemeToggle />
          </div>
        </div>
      </nav>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Conversation List */}
        {showSidebar && (
          <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={createNewConversation}
                className="btn-primary w-full"
              >
                + New Chat
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <div
                  key={conv.session_id}
                  className={`p-3 border-b border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    currentSession === conv.session_id ? 'bg-gray-100 dark:bg-gray-800' : ''
                  }`}
                  onClick={() => setCurrentSession(conv.session_id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black dark:text-white truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {conv.message_count} messages • {formatDate(conv.updated_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conv.session_id)
                      }}
                      className="text-gray-400 hover:text-red-500 text-xs ml-2"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              
              {conversations.length === 0 && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No conversations yet. Start a new chat!
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
                    AI Financial Assistant
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Ask me anything about finance, markets, or investment strategies
                  </p>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-black dark:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold">
                        {msg.role === 'user' ? 'You' : 'FinAgent'}
                      </span>
                      {msg.timestamp && (
                        <span className="text-xs opacity-60">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap text-sm">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={ask} className="flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="Type your financial question..."
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  disabled={busy}
                />
                <button
                  className="btn-primary px-6"
                  disabled={busy || !prompt.trim()}
                >
                  {busy ? '...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
