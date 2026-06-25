import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Bot, User, FileText, History, Plus, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { chatService } from '../services/chatService'
import type { Message, Conversation } from '../types'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function ChatPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const [messages,       setMessages]       = useState<Message[]>([])
  const [conversations,  setConversations]  = useState<Conversation[]>([])
  const [input,          setInput]          = useState('')
  const [loading,        setLoading]        = useState(false)
  const [convId,         setConvId]         = useState<number | undefined>()
  const [showHistory,    setShowHistory]    = useState(false)
  const [streamingText,  setStreamingText]  = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const wsRef     = useRef<WebSocket | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const loadConversations = useCallback(async () => {
    if (!documentId) return
    try {
      const convs = await chatService.getConversations(parseInt(documentId))
      setConversations(convs)
    } catch {}
  }, [documentId])

  useEffect(() => { loadConversations() }, [loadConversations])

  // WebSocket setup
  const connectWS = useCallback(() => {
    if (!documentId) return
    const token = localStorage.getItem('access_token')
    const wsUrl = `ws://localhost:8000/api/chat/${documentId}/stream?token=${token}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {}

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.error) {
          toast.error(data.error)
          setLoading(false)
          setStreamingText('')
          return
        }
        if (data.type === 'conversation_id') {
          setConvId(prev => prev ?? data.conversation_id)
        }
        if (data.type === 'token') {
          setStreamingText(prev => prev + data.content)
        }
        if (data.type === 'done') {
          const msg: Message = {
            id:              data.message_id || Date.now(),
            conversation_id: data.conversation_id,
            role:            'assistant',
            content:         data.content,
            page_source:     data.page_source,
            tokens_used:     0,
            created_at:      new Date().toISOString()
          }
          setMessages(prev => [...prev, msg])
          setStreamingText('')
          setLoading(false)
          loadConversations()
        }
      } catch {}
    }

    ws.onerror = () => {
      setLoading(false)
      setStreamingText('')
    }

    ws.onclose = () => { wsRef.current = null }
    wsRef.current = ws
  }, [documentId, loadConversations])

  useEffect(() => {
    connectWS()
    return () => { wsRef.current?.close() }
  }, [connectWS])

  const loadConversation = async (conv: Conversation) => {
    try {
      const res = await api.get(`/chat/conversations/${conv.id}/messages`)
      setMessages(res.data)
      setConvId(conv.id)
      setShowHistory(false)
    } catch { toast.error('Erreur lors du chargement') }
  }

  const newConversation = () => {
    setMessages([])
    setConvId(undefined)
    setStreamingText('')
    setShowHistory(false)
  }

  const send = async () => {
    if (!input.trim() || loading || !documentId) return
    const question = input.trim()
    setInput('')
    setLoading(true)

    const userMsg: Message = {
      id:              Date.now(),
      conversation_id: convId || 0,
      role:            'user',
      content:         question,
      tokens_used:     0,
      created_at:      new Date().toISOString()
    }
    setMessages(p => [...p, userMsg])

    // Reconnect if needed
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWS()
      await new Promise(r => setTimeout(r, 600))
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ question, conversation_id: convId }))
    } else {
      toast.error('Connexion WebSocket impossible')
      setLoading(false)
      setMessages(p => p.slice(0, -1))
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Sidebar historique */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="card overflow-hidden flex-shrink-0 flex flex-col">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">Historique</h3>
              <button onClick={newConversation}
                className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg transition-colors">
                <Plus size={11} /> Nouveau
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.length === 0
                ? <p className="text-slate-500 text-xs text-center py-8">Aucune conversation</p>
                : conversations.map(conv => (
                  <button key={conv.id} onClick={() => loadConversation(conv)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all text-xs group
                      ${convId === conv.id
                        ? 'bg-blue-600/20 border border-blue-500/30 text-white'
                        : 'hover:bg-slate-700 text-slate-400 hover:text-white'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{conv.title}</span>
                      <ChevronRight size={11} className="opacity-0 group-hover:opacity-100 flex-shrink-0" />
                    </div>
                    <p className="text-slate-500 mt-0.5">{new Date(conv.created_at).toLocaleDateString('fr-FR')}</p>
                  </button>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <button onClick={() => navigate('/documents')} className="btn-secondary flex items-center gap-2">
            <ArrowLeft size={16} /> Retour
          </button>
          <button onClick={() => setShowHistory(p => !p)}
            className={`btn-secondary flex items-center gap-2 ${showHistory ? 'border-blue-500 text-blue-400' : ''}`}>
            <History size={16} /> Historique ({conversations.length})
          </button>
          {convId && (
            <button onClick={newConversation} className="btn-secondary flex items-center gap-2">
              <Plus size={16} /> Nouveau chat
            </button>
          )}
          <span className="ml-auto text-slate-400 text-sm">Document #{documentId}
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Streaming actif
            </span>
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 card overflow-y-auto p-6 space-y-4 mb-4">
          {messages.length === 0 && !streamingText && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-4">
                <FileText size={28} className="text-blue-400" />
              </div>
              <p className="text-slate-300 font-medium">Posez votre première question</p>
              <p className="text-slate-500 text-sm mt-1">Streaming en temps réel activé ⚡</p>
              {conversations.length > 0 && (
                <button onClick={() => setShowHistory(true)}
                  className="mt-4 text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                  <History size={14} /> {conversations.length} conversation(s) précédente(s)
                </button>
              )}
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={16} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-slate-700 text-slate-200 rounded-bl-sm border border-slate-600'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.page_source && (
                    <p className="text-xs mt-2 opacity-60 flex items-center gap-1">
                      <FileText size={10} /> {msg.page_source}
                    </p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User size={16} className="text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming message */}
          {streamingText && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={16} className="text-white" />
              </div>
              <div className="max-w-[75%] bg-slate-700 border border-blue-500/30 rounded-2xl rounded-bl-sm px-4 py-3">
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {streamingText}
                  <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 animate-pulse align-middle" />
                </p>
              </div>
            </motion.div>
          )}

          {/* Loading dots (before first token) */}
          {loading && !streamingText && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-slate-700 border border-slate-600 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Posez votre question — réponse en streaming ⚡"
            className="input flex-1" disabled={loading} />
          <button onClick={send} disabled={loading || !input.trim()} className="btn-primary px-5">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
