import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { documentService } from '../../services/documentService'
import toast from 'react-hot-toast'

interface Props { onUploaded: () => void }

export default function UploadZone({ onUploaded }: Props) {
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    if (!file.name.endsWith('.pdf')) { toast.error('Seuls les fichiers PDF sont acceptés'); return }

    setUploading(true)
    setProgress(0)
    try {
      await documentService.upload(file, setProgress)
      toast.success('Document uploadé avec succès !')
      onUploaded()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Erreur lors de l'upload")
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [onUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1, disabled: uploading
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
        ${isDragActive ? 'border-brand-500 bg-brand-600/10' : 'border-slate-600 hover:border-brand-500/50 hover:bg-dark-700/50'}
        ${uploading ? 'cursor-not-allowed opacity-70' : ''}`}
    >
      <input {...getInputProps()} />
      <AnimatePresence mode="wait">
        {uploading ? (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Loader2 size={40} className="mx-auto text-brand-500 animate-spin" />
            <p className="text-white font-medium">Traitement en cours...</p>
            <div className="w-full bg-dark-700 rounded-full h-2 max-w-xs mx-auto">
              <div className="bg-brand-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-slate-400 text-sm">{progress}%</p>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="w-16 h-16 bg-brand-600/20 rounded-2xl flex items-center justify-center mx-auto">
              {isDragActive ? <FileText size={32} className="text-brand-400" /> : <Upload size={32} className="text-brand-400" />}
            </div>
            <div>
              <p className="text-white font-semibold text-lg">
                {isDragActive ? 'Déposez votre PDF ici' : 'Glissez votre PDF ici'}
              </p>
              <p className="text-slate-400 text-sm mt-1">ou cliquez pour sélectionner un fichier (max 20MB)</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
