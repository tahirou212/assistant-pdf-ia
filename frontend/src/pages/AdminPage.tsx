import { useEffect, useState } from 'react'
import { Users, FileText, Zap, DollarSign, ToggleLeft, ToggleRight,
         MessageSquare, X, Bot, User, Shield, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import StatCard from '../components/UI/StatCard'
import { chatService } from '../services/chatService'
import type { User as UserType } from '../types'
import toast from 'react-hot-toast'
import api from '../services/api'

type Tab = 'stats' | 'users' | 'documents' | 'conversations'

interface ConvSummary {
  id: number; title: string; user: string; user_email: string
  document: string; nb_messages: number; created_at: string
}
interface DocAdmin {
  id: number; filename: string; user: string; user_email: string
  nb_pages: number; nb_chunks: number; file_size: number
  status: string; file_type: string; uploaded_at: string
}
interface ChatMsg {
  id: number; role: string; content: string
  page_source?: string; created_at: string
}

const formatSize = (b: number) => b < 1024*1024 ? `${(b/1024).toFixed(0)} KB` : `${(b/(1024*1024)).toFixed(1)} MB`

export default function AdminPage() {
  const [tab,          setTab]          = useState<Tab>('stats')
  const [stats,        setStats]        = useState<any>(null)
  const [users,        setUsers]        = useState<UserType[]>([])
  const [docs,         setDocs]         = useState<DocAdmin[]>([])
  const [convs,        setConvs]        = useState<ConvSummary[]>([])
  const [selectedConv, setSelectedConv] = useState<ConvSummary | null>(null)
  const [convMsgs,     setConvMsgs]     = useState<ChatMsg[]>([])
  const [loadingMsgs,  setLoadingMsgs]  = useState(false)

  useEffect(() => {
    chatService.getAdminStats().then(setStats).catch(() => {})
    chatService.getAdminUsers().then(setUsers).catch(() => {})
    api.get('/admin/documents').then(r    => setDocs(r.data)).catch(() => {})
    api.get('/admin/conversations').then(r => setConvs(r.data)).catch(() => {})
  }, [])

  const toggle = async (userId: number) => {
    try {
      const res = await chatService.toggleUser(userId)
      setUsers(p => p.map(u => u.id === userId ? { ...u, is_active: res.is_active } : u))
      toast.success('Statut mis à jour')
    } catch { toast.error('Erreur') }
  }

  const changeRole = async (userId: number, newRole: string) => {
    try {
      await api.put(`/admin/users/${userId}/role?role=${newRole}`)
      setUsers(p => p.map(u => u.id === userId ? { ...u, role: newRole as 'user' | 'admin' } : u))
      toast.success(`Rôle changé en "${newRole}"`)
    } catch { toast.error('Erreur changement de rôle') }
  }

  const deleteDoc = async (docId: number) => {
    if (!confirm('Supprimer ce document définitivement ?')) return
    try {
      await api.delete(`/admin/documents/${docId}`)
      setDocs(p => p.filter(d => d.id !== docId))
      toast.success('Document supprimé')
    } catch { toast.error('Erreur suppression') }
  }

  const viewConv = async (conv: ConvSummary) => {
    setSelectedConv(conv)
    setLoadingMsgs(true)
    try {
      const res = await api.get(`/admin/conversations/${conv.id}/messages`)
      setConvMsgs(res.data)
    } catch { toast.error('Erreur chargement') }
    finally { setLoadingMsgs(false) }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'stats',         label: 'Statistiques' },
    { id: 'users',         label: 'Utilisateurs',   count: users.length },
    { id: 'documents',     label: 'Documents',       count: docs.length },
    { id: 'conversations', label: 'Conversations',   count: convs.length },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold text-white">Administration</h1>
        <p className="text-slate-400 mt-1">Tableau de bord administrateur</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700">
        {tabs.map(({ id, label, count }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              tab === id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}>
            {label}
            {count !== undefined && (
              <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* STATS */}
      {tab === 'stats' && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Utilisateurs"    value={stats?.total_users             || 0} icon={Users}      color="bg-blue-600"   delay={0.1} />
          <StatCard title="Documents"       value={stats?.total_documents         || 0} icon={FileText}   color="bg-purple-600" delay={0.2} />
          <StatCard title="Tokens totaux"   value={stats?.total_tokens_used?.toLocaleString() || 0} icon={Zap} color="bg-cyan-600" delay={0.3} />
          <StatCard title="Coût estimé"     value={`$${stats?.estimated_cost_usd  || '0.0000'}`} icon={DollarSign} color="bg-emerald-600" delay={0.4} />
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
          <h3 className="text-white font-semibold mb-4">Gestion des utilisateurs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['ID','Utilisateur','Email','Rôle','Tokens','Statut','Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-slate-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-3 text-slate-400">#{u.id}</td>
                    <td className="py-3 px-3 text-white font-medium">{u.username}</td>
                    <td className="py-3 px-3 text-slate-400 text-xs">{u.email}</td>
                    <td className="py-3 px-3">
                      <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-xs rounded-lg px-2 py-1 text-white
                                   focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                        <option value="user">👤 user</option>
                        <option value="admin">🛡️ admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{u.tokens_used.toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {u.is_active ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button onClick={() => toggle(u.id)} title={u.is_active ? 'Désactiver' : 'Activer'}>
                        {u.is_active
                          ? <ToggleRight size={20} className="text-green-400 hover:text-green-300 transition-colors" />
                          : <ToggleLeft  size={20} className="text-slate-500 hover:text-slate-300 transition-colors" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* DOCUMENTS */}
      {tab === 'documents' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
          <h3 className="text-white font-semibold mb-4">Tous les documents ({docs.length})</h3>
          {docs.length === 0
            ? <p className="text-slate-500 text-center py-8">Aucun document</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      {['ID','Fichier','Utilisateur','Pages','Chunks','Taille','Type','Statut','Action'].map(h => (
                        <th key={h} className="text-left py-3 px-3 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map(doc => (
                      <tr key={doc.id} className="border-b border-slate-800 hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-3 text-slate-400">#{doc.id}</td>
                        <td className="py-3 px-3 text-white max-w-[160px] truncate" title={doc.filename}>{doc.filename}</td>
                        <td className="py-3 px-3">
                          <p className="text-white text-xs">{doc.user}</p>
                          <p className="text-slate-500 text-xs">{doc.user_email}</p>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{doc.nb_pages}</td>
                        <td className="py-3 px-3 text-slate-400">{doc.nb_chunks}</td>
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{formatSize(doc.file_size)}</td>
                        <td className="py-3 px-3">
                          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{doc.file_type}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            doc.status === 'ready'      ? 'bg-green-500/20 text-green-400'
                          : doc.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400'
                          :                              'bg-red-500/20 text-red-400'}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <button onClick={() => deleteDoc(doc.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </motion.div>
      )}

      {/* CONVERSATIONS */}
      {tab === 'conversations' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
          <h3 className="text-white font-semibold mb-4">Toutes les conversations ({convs.length})</h3>
          {convs.length === 0
            ? <p className="text-slate-500 text-center py-8">Aucune conversation</p>
            : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {['ID','Utilisateur','Document','Messages','Date','Action'].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-slate-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {convs.map(conv => (
                    <tr key={conv.id} className="border-b border-slate-800 hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-3 text-slate-400">#{conv.id}</td>
                      <td className="py-3 px-3">
                        <p className="text-white text-xs font-medium">{conv.user}</p>
                        <p className="text-slate-500 text-xs">{conv.user_email}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs max-w-[150px] truncate">{conv.document}</td>
                      <td className="py-3 px-3">
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs">{conv.nb_messages} msg</span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs">{new Date(conv.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="py-3 px-3">
                        <button onClick={() => viewConv(conv)}
                          className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300
                                     hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                          <MessageSquare size={12} /> Voir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </motion.div>
      )}

      {/* Modal conversation */}
      <AnimatePresence>
        {selectedConv && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedConv(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-slate-700">
                <div>
                  <h3 className="text-white font-semibold">Conversation #{selectedConv.id}</h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {selectedConv.user} · {selectedConv.document}
                  </p>
                </div>
                <button onClick={() => setSelectedConv(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {loadingMsgs
                  ? <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                  : convMsgs.length === 0
                    ? <p className="text-slate-500 text-center py-8">Aucun message</p>
                    : convMsgs.map(msg => (
                      <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot size={13} className="text-white" />
                          </div>
                        )}
                        <div className={`max-w-[80%] rounded-xl px-3 py-2.5 text-sm ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-200 border border-slate-600'
                        }`}>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          {msg.page_source && (
                            <p className="text-xs mt-1.5 opacity-60">{msg.page_source}</p>
                          )}
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-7 h-7 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <User size={13} className="text-white" />
                          </div>
                        )}
                      </div>
                    ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
