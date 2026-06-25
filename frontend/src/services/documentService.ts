import api from './api'
import type  { Document } from '../types'

export const documentService = {
  async upload(file: File, onProgress?: (p: number) => void): Promise<Document> {
    const form = new FormData()
    form.append('file', file)
    const res = await api.post('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / (e.total || 1)))
    })
    return res.data
  },

  async list(): Promise<{ documents: Document[]; total: number }> {
    const res = await api.get('/documents/')
    return res.data
  },

  async get(id: number): Promise<Document> {
    const res = await api.get(`/documents/${id}`)
    return res.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/documents/${id}`)
  }
}
