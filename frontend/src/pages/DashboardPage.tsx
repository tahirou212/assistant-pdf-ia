import { useEffect, useState } from 'react'
import { FileText, MessageSquare, Brain, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import StatCard from '../components/UI/StatCard'
import { chatService } from '../services/chatService'
import { useAuthStore } from '../store/authStore'
import type  { Stats } from '../types'

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    chatService.getStats().then(setStats).catch(() => {})
  }, [])

  const barData = [
    { name: 'Documents', value: stats?.total_documents    || 0 },
    { name: 'Chats',     value: stats?.total_conversations || 0 },
    { name: 'Questions', value: stats?.total_questions    || 0 },
    { name: 'Quiz',      value: stats?.total_quizzes      || 0 },
  ]

  const pieData = barData.filter(d => d.value > 0)

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Bienvenue, <span className="text-brand-400">{user?.username}</span> 👋</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Documents"  value={stats?.total_documents    || 0} icon={FileText}      color="bg-brand-600"    delay={0.1} />
        <StatCard title="Chats"      value={stats?.total_conversations || 0} icon={MessageSquare} color="bg-purple-600"   delay={0.2} />
        <StatCard title="Questions"  value={stats?.total_questions    || 0} icon={Zap}           color="bg-cyan-600"     delay={0.3} />
        <StatCard title="Quiz"       value={stats?.total_quizzes      || 0} icon={Brain}         color="bg-emerald-600"  delay={0.4} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="card p-6 xl:col-span-2">
          <h3 className="text-white font-semibold mb-6">Activité globale</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="card p-6">
          <h3 className="text-white font-semibold mb-6">Répartition</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
              Aucune donnée pour l'instant
            </div>
          )}
        </motion.div>
      </div>

      {/* Tokens */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Tokens OpenAI consommés</h3>
            <p className="text-slate-400 text-sm mt-1">Coût estimé : ~${((stats?.tokens_used || 0) * 0.000002).toFixed(4)} USD</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-brand-400">{stats?.tokens_used?.toLocaleString() || 0}</p>
            <p className="text-slate-500 text-xs">tokens utilisés</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
