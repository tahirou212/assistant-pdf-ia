import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Brain, CheckCircle, XCircle, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { chatService } from '../services/chatService'
import type { QuizQuestion } from '../types'
import toast from 'react-hot-toast'

type Phase = 'config' | 'quiz' | 'result'
const TIMER_SECONDS = 45

export default function QuizPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const [phase,      setPhase]      = useState<Phase>('config')
  const [nbQ,        setNbQ]        = useState(5)
  const [difficulty, setDifficulty] = useState('medium')
  const [questions,  setQuestions]  = useState<QuizQuestion[]>([])
  const [quizId,     setQuizId]     = useState<number>(0)
  const [answers,    setAnswers]     = useState<(number|null)[]>([])
  const [current,    setCurrent]     = useState(0)
  const [result,     setResult]      = useState<any>(null)
  const [loading,    setLoading]     = useState(false)
  const [timeLeft,   setTimeLeft]    = useState(TIMER_SECONDS)

  // Timer
  useEffect(() => {
    if (phase !== 'quiz') return
    setTimeLeft(TIMER_SECONDS)
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          handleNext()
          return TIMER_SECONDS
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [current, phase])

  const generate = async () => {
    if (!documentId) return
    setLoading(true)
    try {
      const res = await chatService.generateQuiz(parseInt(documentId), nbQ, difficulty)
      setQuestions(res.questions)
      setQuizId(res.id)
      setAnswers(new Array(res.questions.length).fill(null))
      setCurrent(0)
      setPhase('quiz')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  const select = (idx: number) => {
    const updated = [...answers]
    updated[current] = idx
    setAnswers(updated)
  }

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(p => p + 1)
    } else {
      submitQuiz()
    }
  }

  const submitQuiz = async () => {
    setLoading(true)
    try {
      const res = await chatService.submitQuiz(quizId, answers.map(a => a ?? 0))
      setResult(res)
      setPhase('result')
    } catch { toast.error('Erreur lors de la soumission') }
    finally { setLoading(false) }
  }

  const timerColor = timeLeft <= 10 ? 'text-red-400' : timeLeft <= 20 ? 'text-yellow-400' : 'text-green-400'
  const timerBg    = timeLeft <= 10 ? 'bg-red-400'   : timeLeft <= 20 ? 'bg-yellow-400'   : 'bg-green-400'
  const q = questions[current]

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/documents')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={16} /> Retour
        </button>
        <h1 className="text-2xl font-bold text-white">Générateur de Quiz</h1>
      </div>

      <AnimatePresence mode="wait">

        {/* Config */}
        {phase === 'config' && (
          <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="card p-6 space-y-6">
            <div>
              <label className="text-slate-300 font-medium block mb-3">
                Nombre de questions : <span className="text-blue-400">{nbQ}</span>
              </label>
              <input type="range" min={3} max={15} value={nbQ} onChange={e => setNbQ(+e.target.value)}
                className="w-full accent-blue-500" />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-3">Difficulté :</label>
              <div className="flex gap-3">
                {(['easy','medium','hard'] as const).map(d => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      difficulty === d ? 'border-blue-500 bg-blue-600/20 text-white' : 'border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}>
                    {d === 'easy' ? '😊 Facile' : d === 'medium' ? '🧠 Moyen' : '🔥 Difficile'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-700/50 rounded-xl p-3">
              <Clock size={16} className="text-blue-400" />
              <span>{TIMER_SECONDS} secondes par question — réponse automatique si le temps expire</span>
            </div>
            <button onClick={generate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Génération...</>
                : <><Brain size={16} /> Générer le Quiz</>}
            </button>
          </motion.div>
        )}

        {/* Quiz */}
        {phase === 'quiz' && q && (
          <motion.div key={`quiz-${current}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} className="space-y-4">

            {/* Progress + Timer */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-slate-400 text-sm">Question {current+1} / {questions.length}</p>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((current+1)/questions.length)*100}%` }} />
                </div>
              </div>
              {/* Timer */}
              <div className={`flex items-center gap-2 ${timerColor} font-bold text-lg min-w-[80px] justify-end`}>
                <Clock size={18} />
                <span>{timeLeft}s</span>
              </div>
            </div>

            {/* Timer bar */}
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div className={`${timerBg} h-1.5 rounded-full transition-all duration-1000`}
                style={{ width: `${(timeLeft / TIMER_SECONDS) * 100}%` }} />
            </div>

            <div className="card p-6 space-y-5">
              <p className="text-white font-semibold text-lg leading-relaxed">{q.question}</p>
              <div className="space-y-3">
                {q.options.map((opt, i) => (
                  <button key={i} onClick={() => select(i)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                      answers[current] === i
                        ? 'border-blue-500 bg-blue-600/20 text-white'
                        : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500 hover:text-white'
                    }`}>
                    <span className="font-semibold text-blue-400 mr-2">{String.fromCharCode(65+i)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
              <button onClick={handleNext} className="btn-primary w-full">
                {current < questions.length - 1 ? 'Question suivante →' : 'Terminer le quiz'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Result */}
        {phase === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="card p-8 text-center space-y-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
              result.score >= 60 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {result.score >= 60
                ? <CheckCircle size={40} className="text-green-400" />
                : <XCircle    size={40} className="text-red-400" />}
            </div>
            <div>
              <p className="text-5xl font-bold text-white">{result.score.toFixed(0)}%</p>
              <p className="text-slate-400 mt-2">{result.correct} / {result.total} bonnes réponses</p>
            </div>
            <p className="text-slate-300 text-lg">
              {result.score >= 80 ? '🎉 Excellent !' : result.score >= 60 ? '👍 Bon résultat !' : '📖 Révisez encore !'}
            </p>
            <button onClick={() => { setPhase('config'); setResult(null) }} className="btn-primary">
              Nouveau quiz
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
