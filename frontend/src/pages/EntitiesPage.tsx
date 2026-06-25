import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Tags, Users, Building, MapPin, Calendar, DollarSign, Key } from 'lucide-react'
import { motion } from 'framer-motion'
import { chatService } from '../services/chatService'
import toast from 'react-hot-toast'

const categories = [
  { key: 'persons',       label: 'Personnes',      icon: Users,    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { key: 'organizations', label: 'Organisations',  icon: Building, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { key: 'locations',     label: 'Lieux',           icon: MapPin,   color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { key: 'dates',         label: 'Dates',           icon: Calendar, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { key: 'amounts',       label: 'Montants',        icon: DollarSign, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { key: 'keywords',      label: 'Mots-clés',       icon: Key,      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
]

export default function EntitiesPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const [entities, setEntities] = useState<Record<string, string[]> | null>(null)
  const [loading,  setLoading]  = useState(false)

  const fetch = async () => {
    if (!documentId) return
    setLoading(true)
    try {
      const res = await chatService.getEntities(parseInt(documentId))
      setEntities(res.entities)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Erreur lors de l"extraction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/documents')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={16} /> Retour
        </button>
        <h1 className="text-2xl font-bold text-white">Extraction d'Entités</h1>
      </div>

      <div className="card p-6">
        <p className="text-slate-400 mb-4">Détecte automatiquement les personnes, lieux, dates et autres entités dans le document.</p>
        <button onClick={fetch} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyse...</>
            : <><Tags size={16} /> Extraire les entités</>}
        </button>
      </div>

      {entities && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map(({ key, label, icon: Icon, color }, i) => {
            const items = entities[key] || []
            return (
              <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Icon size={16} className={color.split(' ')[1]} />
                  <h3 className="text-white font-semibold">{label}</h3>
                  <span className="ml-auto text-xs text-slate-500 bg-dark-700 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">Aucune entité détectée</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {items.map((item, j) => (
                      <span key={j} className={`text-xs px-2.5 py-1 rounded-full border ${color}`}>{item}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
