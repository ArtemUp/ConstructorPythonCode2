import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Answer {
  [questionId: string]: any;
}

interface TestStore {
  answers: Answer;
  testId: string | null;        // какой тест сейчас проходится
  setAnswer: (questionId: string, answer: any) => void;
  setTestId: (id: string) => void;
  clearAnswers: () => void;
}

export const useTestStore = create<TestStore>()(
  persist(
    (set) => ({
      answers: {},
      testId: null,
      setAnswer: (questionId, answer) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: answer },
        })),
      setTestId: (id) => set({ testId: id }),
      clearAnswers: () => set({ answers: {}, testId: null }),
    }),
    {
      name: 'test-answers-storage', // ключ в localStorage
    }
  )
);