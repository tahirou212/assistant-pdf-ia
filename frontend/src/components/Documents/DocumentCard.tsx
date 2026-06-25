import { useNavigate } from 'react-router-dom'
import { FileText, MessageSquare, BookOpen, Brain, Tags, Trash2, Loader2, CheckCircle, XCircle, GitBranch } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Document } from '../../types'
import { documentService } from '../../services/documentService'
import toast from 'react-hot-toast'

interface Props { doc: Document; onDeleted: () => void; index: number }

const formatSize = (b: number) => b < 1024*1024 ? `${(b/1024).toFixed(0)} KB` : `${(b/(1024*1024)).toFixed(1)} MB`

export default function DocumentCard({ doc, onDeleted, index }: Props) {
  const navigate = useNavigate()

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Supprimer "${doc.original_filename}" ?`)) return
    try {
      await documentService.delete(doc.id)
      toast.success('Document supprimé')
      onDeleted()
    } catch { toast.error('Erreur lors de la suppression') }
  }

  const StatusBadge = () => {
    if (doc.status === 'processing') return (
      <span className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full">
        <Loader2 size={11} className="animate-spin" /> Traitement...
      </span>
    )
    if (doc.status === 'ready') return (
      <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">
        <CheckCircle size={11} /> Prêt
      </span>
    )
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full">
        <XCircle size={11} /> Erreur
      </span>
    )
  }

  const isReady = doc.status === 'ready'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card p-5 hover:border-slate-600 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{doc.original_filename}</p>
            <p className="text-slate-500 text-xs mt-0.5">{formatSize(doc.file_size)} · {doc.nb_pages} pages · {doc.nb_chunks} chunks</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <StatusBadge />
          <button onClick={handleDelete} className="text-slate-600 hover:text-red-400 transition-colors p-1">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {isReady && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: MessageSquare, label: 'Chat',      action: () => navigate(`/chat/${doc.id}`)     },
            { icon: BookOpen,      label: 'Résumé',    action: () => navigate(`/summary/${doc.id}`)  },
            { icon: Brain,         label: 'Quiz',      action: () => navigate(`/quiz/${doc.id}`)     },
            { icon: Tags,          label: 'Entités',   action: () => navigate(`/entities/${doc.id}`) },
            { icon: GitBranch,     label: 'Mind Map',  action: () => navigate(`/mindmap/${doc.id}`)  },
          ].map(({ icon: Icon, label, action }) => (
            <button key={label} onClick={action}
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600
                         hover:border-blue-500/50 text-slate-300 hover:text-white rounded-xl px-2.5 py-2
                         text-xs font-medium transition-all duration-200">
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
