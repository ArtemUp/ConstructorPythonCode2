export function cleanOption(option: string, questionText: string): string {
  let s = String(option || '');

  // 1. Удаляем ВСЕ блоки кода
  s = s.replace(/```[\s\S]*?```/g, '').trim();

  // 2. Убираем текст вопроса, если он повторяется
  const qText = String(questionText || '').trim();
  if (qText && s.includes(qText)) {
    s = s.replace(qText, '').trim();
  }

  // 3. Убираем ведущие разделители (":", ",", ".", пробелы)
  s = s.replace(/^[\s:.,;]+/, '').trim();

  // 4. Если после очистки пусто — берём последнюю непустую строку из оригинала
  if (!s) {
    const original = String(option || '').replace(/```[\s\S]*?```/g, '').trim();
    const lines = original.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      s = lines[lines.length - 1];
      if (qText && s.includes(qText)) s = s.replace(qText, '').trim();
    }
  }

  // 5. Если всё ещё длинное (>120) — берём последнюю строку
  if (s.length > 120) {
    const lines = s.split('\n').map(l => l.trim()).filter(Boolean);
    s = lines[lines.length - 1] || s;
  }

  // 6. Финальная зачистка
  s = s.replace(/^[\s:.,;]+/, '').trim();

  // 7. Если пусто — оставляем урезанный оригинал
  if (!s) s = String(option || '').trim().slice(0, 200);

  // 8. Жёсткий лимит
  if (s.length > 200) s = s.slice(0, 200).trim() + '…';

  return s;
}

/** Очищает массив правильных ответов (для сравнения) */
export function cleanCorrectAnswers(
  correctAnswers: string[],
  questionText: string
): string[] {
  return (correctAnswers || []).map(c => cleanOption(c, questionText));
}