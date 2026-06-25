import api from './api'
import type { Message, Conversation } from '../types'

export const chatService = {
  async ask(documentId: number, question: string, conversationId?: number): Promise<Message> {
    const res = await api.post(`/chat/${documentId}/ask`, { question, conversation_id: conversationId })
    return res.data
  },

  async createConversation(documentId: number): Promise<Conversation> {
    const res = await api.post(`/chat/${documentId}/conversations`)
    return res.data
  },

  async getConversations(documentId: number): Promise<Conversation[]> {
    const res = await api.get(`/chat/${documentId}/conversations`)
    return res.data
  },

  async getSummary(documentId: number, level: string): Promise<{ summary: string }> {
    const res = await api.post(`/summary/${documentId}`, { level })
    return res.data
  },

  async generateQuiz(documentId: number, nb_questions: number, difficulty: string) {
    const res = await api.post(`/quiz/${documentId}/generate`, { nb_questions, difficulty })
    return res.data
  },

  async submitQuiz(quizId: number, answers: number[]) {
    const res = await api.post('/quiz/submit', { quiz_id: quizId, answers })
    return res.data
  },

  async getEntities(documentId: number) {
    const res = await api.get(`/entities/${documentId}`)
    return res.data
  },

  async getStats() {
    const res = await api.get('/analytics/me')
    return res.data
  },

  async getAdminStats() {
    const res = await api.get('/admin/stats')
    return res.data
  },

  async getAdminUsers() {
    const res = await api.get('/admin/users')
    return res.data
  },

  async toggleUser(userId: number) {
    const res = await api.put(`/admin/users/${userId}/toggle`)
    return res.data
  }
}
