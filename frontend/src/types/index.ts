export interface User {
  id: number
  email: string
  username: string
  role: 'user' | 'admin'
  is_active: boolean
  tokens_used: number
  created_at: string
}

export interface Document {
  id: number
  filename: string
  original_filename: string
  file_type: 'native' | 'scanned'
  nb_pages: number
  nb_chunks: number
  file_size: number
  status: 'processing' | 'ready' | 'error'
  uploaded_at: string
}

export interface Message {
  id: number
  conversation_id: number
  role: 'user' | 'assistant'
  content: string
  page_source?: string
  tokens_used: number
  created_at: string
}

export interface Conversation {
  id: number
  title: string
  document_id: number
  created_at: string
  messages: Message[]
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct_answer: number
  explanation: string
  page_source?: string
}

export interface Stats {
  total_documents: number
  total_conversations: number
  total_questions: number
  total_quizzes: number
  tokens_used: number
}
