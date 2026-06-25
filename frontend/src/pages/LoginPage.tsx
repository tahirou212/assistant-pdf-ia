import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, Mail, Lock, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // 1. Login → récupère les tokens
      const tokens = await authService.login(email, password)

      // 2. Sauvegarde les tokens AVANT d'appeler getMe()
      localStorage.setItem('access_token',  tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)

      // 3. Maintenant getMe() peut s'authentifier
      const user = await authService.getMe()

      // 4. Met à jour le store
      login(tokens, user)
      toast.success(`Bienvenue ${user.username} !`)
      navigate('/dashboard')
    } catch (err: any) {
      localStorage.clear()
      toast.error(err.response?.data?.detail || 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Assistant PDF IA</h1>
          <p className="text-slate-400 mt-2">Connectez-vous à votre compte</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com" required className="input pl-11" />
              </div>
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required className="input pl-11" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       : <><span>Se connecter</span><ArrowRight size={16} /></>}
            </button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-6">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">S'inscrire</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
