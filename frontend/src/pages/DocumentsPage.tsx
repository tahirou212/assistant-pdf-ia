import { useEffect, useState, useCallback } from 'react'
import { FileText, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import UploadZone    from '../components/Documents/UploadZone'
import DocumentCard  from '../components/Documents/DocumentCard'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { documentService } from '../services/documentService'
import type { Document } from '../types'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await documentService.list()
      setDocuments(res.documents)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  // Auto-refresh processing docs
  useEffect(() => {
    const hasProcessing = documents.some(d => d.status === 'processing')
    if (!hasProcessing) return
    const id = setInterval(fetchDocs, 4000)
    return () => clearInterval(id)
  }, [documents, fetchDocs])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Mes Documents</h1>
          <p className="text-slate-400 mt-1">{documents.length} document(s) chargé(s)</p>
        </div>
        <button onClick={fetchDocs} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={15} /> Actualiser
        </button>
      </div>

      <UploadZone onUploaded={fetchDocs} />

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size={40} /></div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20">
          <FileText size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">Aucun document pour l'instant</p>
          <p className="text-slate-500 text-sm mt-1">Uploadez votre premier PDF ci-dessus</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {documents.map((doc, i) => (
            <DocumentCard key={doc.id} doc={doc} onDeleted={fetchDocs} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
