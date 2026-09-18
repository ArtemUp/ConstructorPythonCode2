import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@shared/api/client';
import { notify } from '@shared/lib/toast';
import { RichText } from '@shared/ui/RichText';
import {
  ArrowLeft,
  Flag,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Flame,
} from 'lucide-react';

type Status = 'all' | 'new' | 'reviewed' | 'fixed' | 'ignored';
type Sort = 'count' | 'date';

interface FlaggedItem {
  _id: string;
  testId: string;
  testTitle: string;
  subject: string;
  questionId: string;
  questionType: string;
  questionText: string;
  options?: string[];
  correctAnswers?: string[];
  template?: string;
  placeholders?: any[];
  availableItems?: any[];
  userAnswer?: any;
  status: string;
  flagCount: number;
  firstFlaggedAt: string;
  lastFlaggedAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  reviewed: 'Просмотрен',
  fixed: 'Исправлен',
  ignored: 'Игнорируем',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-red-100 text-red-700 border-red-200',
  reviewed: 'bg-blue-100 text-blue-700 border-blue-200',
  fixed: 'bg-green-100 text-green-700 border-green-200',
  ignored: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const FlaggedPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Status>('new');
  const [sort, setSort] = useState<Sort>('count');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: stats } = useQuery({
    queryKey: ['flagged-stats'],
    queryFn: async () => (await apiClient.get('/flagged/stats')).data,
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['flagged', filter, sort],
    queryFn: async () =>
      (await apiClient.get(`/flagged?status=${filter}&sort=${sort}`))
        .data as FlaggedItem[],
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/flagged/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flagged'] });
      queryClient.invalidateQueries({ queryKey: ['flagged-stats'] });
      notify.success('Статус обновлён');
    },
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/flagged/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flagged'] });
      queryClient.invalidateQueries({ queryKey: ['flagged-stats'] });
      notify.success('Удалено');
    },
  });

  const filterTabs: { value: Status; label: string; count?: number }[] = [
    { value: 'new', label: 'Новые', count: stats?.new },
    { value: 'reviewed', label: 'Просмотренные', count: stats?.reviewed },
    { value: 'fixed', label: 'Исправленные', count: stats?.fixed },
    { value: 'ignored', label: 'Игнор', count: stats?.ignored },
    { value: 'all', label: 'Все', count: stats?.total },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-10 max-w-5xl">
        {/* Шапка */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="p-2.5 bg-amber-100 rounded-lg flex-shrink-0">
              <Flag className="w-5 h-5 text-amber-600 fill-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Отмеченные вопросы
              </h1>
              <p className="text-sm text-gray-500">
                Вопросы, которые ученики отметили как некорректные
              </p>
            </div>
          </div>

          {/* Фильтры по статусу */}
          <div className="flex flex-wrap gap-2 mb-3">
            {filterTabs.map(tab => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                  filter === tab.value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      filter === tab.value
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Сортировка */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Сортировка:</span>
            <button
              type="button"
              onClick={() => setSort('count')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                sort === 'count'
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              По количеству отметок
            </button>
            <button
              type="button"
              onClick={() => setSort('date')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                sort === 'date'
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              По дате
            </button>
          </div>
        </div>

        {/* Список */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Загрузка...</p>
          </div>
        ) : !items || items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-gray-700 font-medium mb-1">
              {filter === 'new' ? 'Нет новых отметок' : 'Ничего нет'}
            </p>
            <p className="text-sm text-gray-500">
              {filter === 'new'
                ? 'Все отмеченные вопросы уже просмотрены'
                : 'Попробуйте другой фильтр'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const isExpanded = expandedId === item._id;
              const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.new;
              const isHot = item.flagCount >= 3;

              return (
                <div
                  key={item._id}
                  className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-colors ${
                    isHot ? 'border-amber-300' : 'border-gray-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-md border ${statusColor}`}
                      >
                        {STATUS_LABELS[item.status] || item.status}
                      </div>

                      {/* 🆕 Бейдж со счётчиком отметок */}
                      {item.flagCount > 1 && (
                        <div
                          className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border ${
                            isHot
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-orange-50 text-orange-700 border-orange-200'
                          }`}
                          title={`Отмечено ${item.flagCount} раз`}
                        >
                          <Flag className="w-3 h-3 fill-current" />
                          {item.flagCount}
                          {isHot && <Flame className="w-3 h-3" />}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 flex-wrap">
                          <span>{item.testTitle || item.testId}</span>
                          <span>•</span>
                          <span>{item.subject === 'math' ? 'Математика' : 'Python'}</span>
                          <span>•</span>
                          <span>{item.questionType}</span>
                          <span>•</span>
                          <span title="Последний раз отмечен">
                            {new Date(item.lastFlaggedAt).toLocaleString('ru-RU')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-800">
                          <RichText text={item.questionText} light />
                        </div>
                      </div>
                    </div>

                    {/* Кнопки */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : item._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> Скрыть
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" /> Показать
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateStatus.mutate({ id: item._id, status: 'reviewed' })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Просмотрен
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateStatus.mutate({ id: item._id, status: 'fixed' })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Исправлен
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateStatus.mutate({ id: item._id, status: 'ignored' })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Игнор
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Удалить эту запись?')) {
                            deleteItem.mutate(item._id);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Удалить
                      </button>
                    </div>

                    {/* Детали */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 text-sm">
                        {/* Инфо о повторах */}
                        {item.flagCount > 1 && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                            <b>Отмечено {item.flagCount} раз.</b>{' '}
                            Первый раз: {new Date(item.firstFlaggedAt).toLocaleString('ru-RU')},
                            последний: {new Date(item.lastFlaggedAt).toLocaleString('ru-RU')}
                          </div>
                        )}

                        {item.questionType === 'expressionBuilder' && (
                          <>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 mb-1">
                                Шаблон
                              </div>
                              <pre className="bg-gray-50 border border-gray-200 p-2 rounded text-xs font-mono overflow-x-auto">
                                {item.template}
                              </pre>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 mb-1">
                                Плейсхолдеры
                              </div>
                              <pre className="bg-gray-50 border border-gray-200 p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(item.placeholders, null, 2)}
                              </pre>
                            </div>
                          </>
                        )}

                        {item.options && item.options.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-gray-500 mb-1">
                              Варианты
                            </div>
                            <ul className="list-disc list-inside text-xs bg-gray-50 border border-gray-200 p-2 rounded space-y-0.5">
                              {item.options.map((opt, i) => (
                                <li key={i}>{opt}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.correctAnswers && item.correctAnswers.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-gray-500 mb-1">
                              Правильные ответы (по версии AI)
                            </div>
                            <div className="text-xs text-green-700 font-mono">
                              {item.correctAnswers.join(', ')}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-1">
                            Последний ответ ученика
                          </div>
                          <pre className="bg-gray-50 border border-gray-200 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(item.userAnswer, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};