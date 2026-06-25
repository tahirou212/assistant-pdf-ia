import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, GitBranch, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../services/api'
import toast from 'react-hot-toast'


interface MindNode { id: string; label: string; children?: MindNode[] }
interface Branch extends MindNode { color: string }
interface MindMapData { central: string; branches: Branch[] }

const truncate = (s: string, n = 14) => s.length > n ? s.slice(0, n) + '…' : s

export default function MindMapPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const [mindmap,  setMindmap]  = useState<MindMapData | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [hovered,  setHovered]  = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const generate = async () => {
    if (!documentId) return
    setLoading(true)
    setMindmap(null)
    try {
      const res = await api.get(`/documents/${documentId}/mindmap`)
      setMindmap(res.data.mindmap)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  const downloadSVG = () => {
  const svg = document.getElementById('mindmap-svg')
  if (!svg) return

  const clone = svg.cloneNode(true) as SVGElement

  // Attributs obligatoires pour un SVG standalone
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', '1000')
  clone.setAttribute('height', '680')
  clone.removeAttribute('class')
  clone.setAttribute('style', 'background: #0f172a;')

  // Police de caractères intégrée
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = `text { font-family: Inter, Arial, sans-serif; }`
  clone.insertBefore(style, clone.firstChild)

  const blob = new Blob([clone.outerHTML], { type: 'image/svg+xml;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `mindmap-doc-${documentId}.svg`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  toast.success('Mind Map exportée !')
}

  const renderSVG = (data: MindMapData) => {
    const W = 1000, H = 680
    const cx = W / 2, cy = H / 2
    const R1 = 195  // branch radius
    const R2 = 90   // child radius
    const branches = data.branches.slice(0, 6)
    const N = branches.length
    const els: React.ReactElement[] = []

    branches.forEach((branch, i) => {
      const angle = (2 * Math.PI * i) / N - Math.PI / 2
      const bx = cx + R1 * Math.cos(angle)
      const by = cy + R1 * Math.sin(angle)
      const color = branch.color || '#3b82f6'
      const isSel = selected === branch.id
      const isHov = hovered  === branch.id

      // Center → branch line
      els.push(
        <line key={`l${i}`} x1={cx} y1={cy} x2={bx} y2={by}
          stroke={color} strokeWidth={isSel ? 3 : 2} strokeOpacity={isSel ? 0.9 : 0.5}
          strokeLinecap="round" />
      )

      // Branch ellipse
      els.push(
        <g key={`b${i}`} style={{ cursor: 'pointer' }}
          onClick={() => setSelected(isSel ? null : branch.id)}
          onMouseEnter={() => setHovered(branch.id)}
          onMouseLeave={() => setHovered(null)}>
          <ellipse cx={bx} cy={by} rx={72} ry={26}
            fill={color} fillOpacity={isSel || isHov ? 0.85 : 0.18}
            stroke={color} strokeWidth={isSel ? 2.5 : 1.5} />
          <text x={bx} y={by} textAnchor="middle" dominantBaseline="middle"
            fill={isSel || isHov ? '#ffffff' : color}
            fontSize="11.5" fontWeight="600" fontFamily="Inter, sans-serif">
            {truncate(branch.label, 13)}
          </text>
        </g>
      )

      // Children
      const kids = (branch.children || []).slice(0, 3)
      kids.forEach((child, j) => {
        const spread = kids.length === 1 ? 0 : (Math.PI / 3.5) * (j - (kids.length - 1) / 2)
        const ca  = angle + spread
        const chx = bx + R2 * Math.cos(ca)
        const chy = by + R2 * Math.sin(ca)

        els.push(
          <line key={`cl${i}-${j}`} x1={bx} y1={by} x2={chx} y2={chy}
            stroke={color} strokeWidth="1.5" strokeOpacity="0.35" strokeDasharray="4 3" />
        )
        els.push(
          <g key={`ch${i}-${j}`}>
            <ellipse cx={chx} cy={chy} rx={58} ry={20}
              fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1" strokeOpacity="0.4" />
            <text x={chx} y={chy} textAnchor="middle" dominantBaseline="middle"
              fill="#94a3b8" fontSize="10" fontFamily="Inter, sans-serif">
              {truncate(child.label, 11)}
            </text>
          </g>
        )
      })
    })

    return (
      <svg id="mindmap-svg" viewBox={`0 0 ${W} ${H}`} className="w-full h-full"
        style={{ background: 'transparent' }}>
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </radialGradient>
        </defs>

        {/* Render lines first, then nodes */}
        {els}

        {/* Central node */}
        <circle cx={cx} cy={cy} r={70} fill="url(#centerGlow)" stroke="#3b82f6" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={52} fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5" />
        {data.central.split(' ').slice(0, 3).map((word, wi) => (
          <text key={wi} x={cx} y={cy - 8 + wi * 14}
            textAnchor="middle" dominantBaseline="middle"
            fill="white" fontSize="12" fontWeight="700" fontFamily="Inter, sans-serif">
            {word}
          </text>
        ))}
      </svg>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/documents')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={16} /> Retour
        </button>
        <h1 className="text-2xl font-bold text-white">Mind Map Interactive</h1>
      </div>

      <div className="card p-5 flex items-center justify-between gap-4">
        <p className="text-slate-400 text-sm">
          Génère automatiquement une carte mentale des concepts du document. Cliquez sur un nœud pour le mettre en évidence.
        </p>
        <div className="flex gap-3 flex-shrink-0">
          {mindmap && (
            <button onClick={downloadSVG} className="btn-secondary flex items-center gap-2 text-sm">
              <Download size={15} /> Exporter SVG
            </button>
          )}
          <button onClick={generate} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Génération...</>
              : <><GitBranch size={16} /> Générer</>}
          </button>
        </div>
      </div>

      {mindmap && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card p-2" style={{ height: 620 }}>
          {renderSVG(mindmap)}
        </motion.div>
      )}

      {mindmap && (
        <div className="card p-4">
          <p className="text-slate-400 text-xs mb-3 font-medium">Légende des branches :</p>
          <div className="flex flex-wrap gap-3">
            {mindmap.branches.map(b => (
              <button key={b.id} onClick={() => setSelected(selected === b.id ? null : b.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  selected === b.id ? 'border-current' : 'border-transparent bg-slate-700/50'
                }`} style={{ color: b.color }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
