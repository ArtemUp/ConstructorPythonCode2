export interface Item {
  id: string
  content: string
  category: 'keyword' | 'identifier' | 'operator' | 'separator' | 'symbol' | 'function'
}

// Типы для плейсхолдеров
export interface Placeholder {
  id: string
  expectedType: string
  expected: string
}

// Тип вопроса
export interface Question {
  id: string
  type: 'single' | 'multiple' | 'expressionBuilder'
  questionText: string
  template?: string           // для expressionBuilder
  placeholders?: Placeholder[] // для expressionBuilder
  availableItems?: Item[]      // для expressionBuilder
  options?: string[]          // для radio/checkbox
  correctAnswers?: string[]   // для radio/checkbox
}

// Тип теста
export interface Test {
  id: string
  title: string
  description: string
  subject: 'python' | 'math'
  questions: Question[]
  timeLimit?: number
}