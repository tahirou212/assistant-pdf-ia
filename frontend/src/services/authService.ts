import api from './api'
import type  { User } from '../types'

export const authService = {
  async register(email: string, username: string, password: string): Promise<User> {
    const res = await api.post('/auth/register', { email, username, password })
    return res.data
  },

  async login(email: string, password: string): Promise<{ access_token: string; refresh_token: string }> {
    const res = await api.post('/auth/login', { email, password })
    return res.data
  },

  async getMe(): Promise<User> {
    const res = await api.get('/auth/me')
    return res.data
  }
}
