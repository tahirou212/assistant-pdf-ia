import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { chatService } from '../services/chatService'
import toast from 'react-hot-toast'

const levels = [
  { id: 'flash',    label: '⚡ Flash',    desc: '5 lignes essentielles' },
  { id: 'standard', label: '📄 Standard', desc: 'Résumé d"une page' },
  { id: 'detailed', label: '📚 Détaillé', desc: 'Analyse complète' },
]

export default function SummaryPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const [level,   setLevel]   = useState('standard')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied,  setCopied]  = useState(false)

  const generate = async () => {
    if (!documentId) return
    setLoading(true)
    setSummary('')
    try {
      const res = await chatService.getSummary(parseInt(documentId), level)
      setSummary(res.summary)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copié !')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/documents')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={16} /> Retour
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Résumé Intelligent</h1>
          <p className="text-slate-400 text-sm">Document #{documentId}</p>
        </div>
      </div>

      <div className="card p-6 space-y-6">
        <div>
          <p className="text-slate-300 font-medium mb-3">Choisissez le niveau de résumé :</p>
          <div className="grid grid-cols-3 gap-3">
            {levels.map(l => (
              <button key={l.id} onClick={() => setLevel(l.id)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                  level === l.id
                    ? 'border-brand-500 bg-brand-600/20 text-white'
                    : 'border-slate-600 bg-dark-700 text-slate-300 hover:border-slate-500'
                }`}>
                <p className="font-semibold">{l.label}</p>
                <p className="text-xs text-slate-400 mt-1">{l.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button onClick={generate} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Génération...</>
            : <><BookOpen size={16} /> Générer le résumé</>}
        </button>
      </div>

      {summary && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Résumé généré</h3>
            <button onClick={copy} className="btn-secondary flex items-center gap-2 text-sm">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{summary}</p>
        </motion.div>
      )}
    </div>
  )
}
