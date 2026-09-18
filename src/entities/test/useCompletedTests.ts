interface CompletedTest {
  testId: string;
  testTitle: string;
  score: number;
  total: number;
  percent: number;
  completedAt: string; // ISO date
  elapsedSeconds?: number;
}

const STORAGE_KEY = 'completed-tests';

export function getCompletedTests(): CompletedTest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getCompletedTest(testId: string): CompletedTest | null {
  const all = getCompletedTests();
  // берём последнюю запись по этому тесту
  const filtered = all.filter(t => t.testId === testId);
  return filtered.length > 0 ? filtered[filtered.length - 1] : null;
}

export function saveCompletedTest(entry: Omit<CompletedTest, 'completedAt'>): void {
  const all = getCompletedTests();
  // удаляем прежнюю запись по этому тесту (оставляем только последнюю)
  const filtered = all.filter(t => t.testId !== entry.testId);
  const updated: CompletedTest[] = [
    ...filtered,
    { ...entry, completedAt: new Date().toISOString() },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearCompletedTests(): void {
  localStorage.removeItem(STORAGE_KEY);
}