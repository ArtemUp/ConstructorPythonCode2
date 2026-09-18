import React, { useState } from 'react';
import { Button } from '@shared/ui/button';
import { apiClient } from '@shared/api/client';
import { notify } from '@shared/lib/toast';

interface GenerateTestButtonProps {
  onGenerated: (testData: any) => void;
}

export const GenerateTestButton: React.FC<GenerateTestButtonProps> = ({ onGenerated }) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('python');       // 👈 добавлено
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [usage, setUsage] = useState<any>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      notify.warning('Введите тему', 'Например: циклы в Python');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/ai/generate-test', {
        topic,
        subject,                                            // 👈 передаём выбранный предмет
        questionCount,
      });
      if (response.data._usage) {
        setUsage(response.data._usage);
      }
      onGenerated(response.data);
      notify.success('Тест сгенерирован', 'Проверьте данные и сохраните');
      setShowForm(false);
      setTopic('');
      setSubject('python');                                 // 👈 сброс
      setQuestionCount(5);
      
    } catch (err: any) {
      console.error(err);
      const message =
        err.response?.data?.error ||
        'Не удалось сгенерировать тест. Проверьте интернет и попробуйте снова.';
      notify.error('Ошибка генерации', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setShowForm(true)}>
        Сгенерировать тест через AI
      </Button>
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Генерация теста по теме</h2>

            {/* Тема */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Тема</label>
              <input
                type="text"
                className="border rounded w-full p-2"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={
                  subject === 'math'
                    ? 'Например, производные'
                    : subject === 'russian'
                    ? 'Например, орфография, ОГЭ'
                    : 'Например, циклы в Python'
                }
              />
            </div>

            {/* Предмет */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Предмет</label>
              <select
                className="border rounded w-full p-2"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="python">Python</option>
                <option value="math">Математика</option>
                <option value="russian">Русский язык</option>
              </select>
            </div>

            {/* Количество вопросов */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Количество вопросов (минимум 1)</label>
              <input
                type="number"
                min={1}
                className="border rounded w-full p-2"
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Отмена
              </Button>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? 'Генерация...' : 'Сгенерировать'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {usage && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
          <p className="font-medium mb-1">📊 Потрачено токенов:</p>
          <ul className="text-gray-700 space-y-0.5">
            <li>Вход: <b>{usage.inputTokens.toLocaleString()}</b></li>
            <li>Выход: <b>{usage.completionTokens.toLocaleString()}</b></li>
            <li>Всего: <b>{usage.totalTokens.toLocaleString()}</b></li>
            <li>Попыток: <b>{usage.attempts}</b></li>
          </ul>
        </div>
      )}
    </>
  );
};