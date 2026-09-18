import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@shared/api/client';
import { clearCompletedTests } from '@entities/test/useCompletedTests';
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  Code2,
  Sigma,
  Eraser,
  ArrowLeft,
  BookIcon,
  Link2,
  Check,
} from 'lucide-react';
import { useCopyToClipboard } from '@shared/lib/useCopyToClipboard';
import { useConfirm } from '@shared/ui/ConfirmDialog';
import { notify } from '@shared/lib/toast';

interface Test {
  id: string;
  title: string;
  description: string;
  subject: string;
}

export const TestsPage = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    apiClient
      .get('/tests')
      .then(res => setTests(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Удалить тест?',
      description: 'Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await apiClient.delete(`/tests/${id}`);
      setTests(tests.filter(t => t.id !== id));
      notify.success('Тест удалён');
    } catch (err) {
      notify.error('Не удалось удалить тест');
    }
  };

  const handleClearHistory = async () => {
    const ok = await confirm({
      title: 'Очистить историю прохождений?',
      description:
        'Все результаты пройденных тестов будут удалены. Это действие нельзя отменить.',
      confirmText: 'Очистить',
      cancelText: 'Отмена',
      variant: 'danger',
    });
    if (!ok) return;

    clearCompletedTests();
    notify.success('История очищена');
    setTimeout(() => window.location.reload(), 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Загрузка тестов...</p>
        </div>
      </div>
    );
  }

  const SUBJECT_META: Record<
    string,
    {
      full: string;
      icon: React.ComponentType<{ className?: string }>;
      iconBg: string;
      iconColor: string;
      badge: string;
    }
  > = {
    math: {
      full: 'Математика',
      icon: Sigma,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      badge: 'bg-purple-50 text-purple-700',
    },
    russian: {
      full: 'Русский язык',
      icon: BookIcon,
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      badge: 'bg-rose-50 text-rose-700',
    },
    python: {
      full: 'Python',
      icon: Code2,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      badge: 'bg-blue-50 text-blue-700',
    },
  };

  const getSubject = (s: string) =>
    SUBJECT_META[s] ?? {
      full: s,
      icon: Code2,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      badge: 'bg-gray-100 text-gray-700',
    };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Шапка */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Управление тестами
              </h1>
              <p className="text-sm text-gray-500">
                Всего тестов: {tests.length}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                title="Очистить историю прохождений"
              >
                <Eraser className="w-4 h-4" />
                Очистить историю
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/tests/new')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm hover:shadow"
              >
                <Plus className="w-4 h-4" />
                Создать тест
              </button>
            </div>
          </div>

          {/* Список тестов или заглушка */}
          {tests.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-4">
                <FileText className="w-7 h-7 text-blue-600" />
              </div>
              <p className="text-gray-700 font-medium mb-1">Пока нет тестов</p>
              <p className="text-sm text-gray-500 mb-5">
                Создайте первый тест, чтобы начать
              </p>
              <button
                onClick={() => navigate('/admin/tests/new')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Создать тест
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tests.map(test => {
                const subject = getSubject(test.subject);
                const Icon = subject.icon;
                return (
                  <div
                    key={test.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`flex-shrink-0 p-2 rounded-lg ${subject.iconBg}`}
                      >
                        <Icon className={`w-5 h-5 ${subject.iconColor}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-gray-900 truncate">
                          {test.title}
                        </h2>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {test.description || 'Без описания'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${subject.badge}`}
                          >
                            <Icon className="w-3 h-3" />
                            {subject.full}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            ID: {test.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                      <CopyLinkButton testId={test.id} />
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/tests/${test.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        Редактировать
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(test.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ============ КНОПКА ВНИЗУ — теперь видна всегда ============ */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              К админ-панели
            </button>
          </div>
        </div>
      </div>

      {/* Диалог подтверждения */}
      {dialog}
    </>
  );
};

// Кнопка копирования ссылки
const CopyLinkButton: React.FC<{ testId: string }> = ({ testId }) => {
  const { copied, copy } = useCopyToClipboard();
  const url = `${window.location.origin}/test/${testId}`;

  return (
    <button
      type="button"
      onClick={() => copy(url)}
      title={url}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
        copied
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
      }`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          Скопировано
        </>
      ) : (
        <>
          <Link2 className="w-3.5 h-3.5" />
          Ссылка
        </>
      )}
    </button>
  );
};