export interface Placeholder {
  id: string
  expectedType: string
  expected: string
}

export interface Item {
  id: string
  content: string
  category: string
}

export interface Question {
  id: string
  type: 'single' | 'multiple' | 'expressionBuilder'
  questionText: string
  template?: string
  placeholders?: Placeholder[]
  availableItems?: Item[]
  options?: string[]
  correctAnswers?: string[]
}

export interface Test {
  id: string;
  title: string;
  description: string;
  subject: 'python' | 'math' | 'russian';
  questions: Question[];
  timeLimit?: number;
}