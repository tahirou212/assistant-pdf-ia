import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handle = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    authService.register(form.email, form.username, form.password)
      .then(() => { toast.success('Compte créé ! Connectez-vous.'); navigate('/login') })
      .catch(err => toast.error(err.response?.data?.detail || 'Erreur lors de la création'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Créer un compte</h1>
          <p className="text-slate-400 mt-2">Rejoignez l'Assistant PDF IA</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handle} className="space-y-5">
            {[
              { label: "Nom d'utilisateur", icon: User,  key: 'username', type: 'text',     placeholder: 'JohnDoe' },
              { label: 'Email',              icon: Mail,  key: 'email',    type: 'email',    placeholder: 'votre@email.com' },
              { label: 'Mot de passe',       icon: Lock,  key: 'password', type: 'password', placeholder: '••••••••' },
            ].map(({ label, icon: Icon, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-slate-300 text-sm font-medium mb-2 block">{label}</label>
                <div className="relative">
                  <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type={type} value={form[key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder} required className="input pl-11" />
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       : <><span>Créer mon compte</span><ArrowRight size={16} /></>}
            </button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Se connecter</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
