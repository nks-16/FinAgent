import React, { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import ThemeToggle from '../components/ThemeToggle'
import { X } from 'lucide-react'

export default function Chat(){
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [conversations, setConversations] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [showSidebar, setShowSidebar] = useState(true)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null })
  const messagesEndRef = useRef(null)

  // Toast auto-dismiss effect
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: '' })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [toast.show])

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ show: true, message, onConfirm })
  }

  const handleConfirm = () => {
    if (confirmModal.onConfirm) {
      confirmModal.onConfirm()
    }
    setConfirmModal({ show: false, message: '', onConfirm: null })
  }

  const handleCancelConfirm = () => {
    setConfirmModal({ show: false, message: '', onConfirm: null })
  }

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
      showToast('⚠️ Unable to load your conversations. Please refresh the page.', 'error')
    }
  }

  const loadConversationMessages = async (sessionId) => {
    try {
      const data = await api.getConversationMessages(sessionId)
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
      setMessages([])
      showToast('⚠️ Unable to load conversation messages.', 'error')
    }
  }

  const createNewConversation = async () => {
    try {
      const newConv = await api.createNewConversation('New Conversation')
      setConversations([newConv, ...conversations])
      setCurrentSession(newConv.session_id)
      setMessages([])
      showToast('✅ New conversation started!', 'success')
    } catch (error) {
      console.error('Failed to create conversation:', error)
      showToast('⚠️ Unable to create a new conversation. Please try again.', 'error')
    }
  }

  const deleteConversation = async (sessionId) => {
    showConfirm(
      '⚠️ Are you sure you want to delete this conversation? This action cannot be undone.',
      async () => {
        try {
          await api.deleteConversation(sessionId)
          setConversations(conversations.filter(c => c.session_id !== sessionId))
          if (currentSession === sessionId) {
            setCurrentSession(null)
            setMessages([])
          }
          showToast('✅ Conversation deleted successfully.', 'success')
        } catch (error) {
          console.error('Failed to delete conversation:', error)
          showToast('⚠️ Unable to delete this conversation. Please try again.', 'error')
        }
      }
    )
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
      showToast('⚠️ Failed to send message. Please try again.', 'error')
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
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <nav className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition text-sm"
            >
              {showSidebar ? '◀ Hide' : '▶ Show'} Sidebar
            </button>
            <span className="text-2xl font-bold text-white">FinAgent Chat</span>
            <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">Personalized AI</span>
          </div>
          <div className="flex gap-2 items-center">
            <a className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition text-sm" href="/">
              Dashboard
            </a>
          </div>
        </div>
      </nav>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Conversation List */}
        {showSidebar && (
          <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <button
                onClick={createNewConversation}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
              >
                <span className="text-xl">+</span> New Chat
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <div
                  key={conv.session_id}
                  className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
                    currentSession === conv.session_id ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => setCurrentSession(conv.session_id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {conv.message_count} messages • {formatDate(conv.updated_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conv.session_id)
                      }}
                      className="text-gray-400 hover:text-red-400 text-xs ml-2"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              
              {conversations.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No conversations yet. Start a new chat!
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    AI Financial Assistant
                  </h2>
                  <p className="text-gray-400">
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
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 border border-gray-700 text-gray-100'
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
          <div className="border-t border-gray-700 bg-gray-800 p-4">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={ask} className="flex gap-2">
                <input
                  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Type your financial question..."
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  disabled={busy}
                />
                <button
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={busy || !prompt.trim()}
                >
                  {busy ? '...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`rounded-lg shadow-2xl p-4 pr-10 max-w-md ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 
            toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
          }`}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast({ show: false, message: '', type: '' })}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full animate-slide-up">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Confirm Action
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {confirmModal.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelConfirm}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
