import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@shared/api/client';
import { useConfirm } from '@shared/ui/ConfirmDialog';
import { notify } from '@shared/lib/toast';
import {
  Package,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  Tag,
  Search,
} from 'lucide-react';

interface Item {
  id: string;
  content: string;
  category: string;
}

const CATEGORIES = [
  { value: 'keyword', label: 'Ключевое слово', color: 'bg-pink-100 text-pink-700' },
  { value: 'identifier', label: 'Идентификатор', color: 'bg-blue-100 text-blue-700' },
  { value: 'operator', label: 'Оператор', color: 'bg-amber-100 text-amber-700' },
  { value: 'separator', label: 'Разделитель', color: 'bg-purple-100 text-purple-700' },
  { value: 'function', label: 'Функция', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'symbol', label: 'Символ', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'variable', label: 'Переменная', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'number', label: 'Число', color: 'bg-gray-100 text-gray-700' },
];

export const ItemsPage = () => {
  const navigate = useNavigate();
  const { confirm, dialog } = useConfirm();
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState({ content: '', category: 'keyword' });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    apiClient
      .get('/items')
      .then(res => setItems(res.data))
      .catch(err => console.error(err))
      .finally(() => setInitialLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!newItem.content.trim()) {
      notify.warning('Введите содержимое элемента');
      return;
    }
    setLoading(true);
    const item = { id: Date.now().toString(), ...newItem };
    try {
      await apiClient.post('/items', item);
      setItems([...items, item]);
      setNewItem({ content: '', category: 'keyword' });
      notify.success('Элемент добавлен');
    } catch {
      notify.error('Не удалось добавить элемент');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Удалить элемент?',
      description: 'Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await apiClient.delete(`/items/${id}`);
      setItems(items.filter(i => i.id !== id));
      notify.success('Элемент удалён');
    } catch {
      notify.error('Не удалось удалить элемент');
    }
  };

  // Фильтрация
  const filteredItems = React.useMemo(() => {
    let list = items;
    if (categoryFilter !== 'all') {
      list = list.filter(i => i.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.content.toLowerCase().includes(q));
    }
    return list;
  }, [items, search, categoryFilter]);

  // Счётчики по категориям
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach(i => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  const getCategoryStyle = (cat: string) => {
    return CATEGORIES.find(c => c.value === cat)?.color || 'bg-gray-100 text-gray-700';
  };

  const getCategoryLabel = (cat: string) => {
    return CATEGORIES.find(c => c.value === cat)?.label || cat;
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Загрузка элементов...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-3 md:px-4 py-6 md:py-10 max-w-4xl">
          {/* ============ ЗАГОЛОВОК ============ */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2.5 bg-purple-100 rounded-lg flex-shrink-0">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                    Элементы корзины
                  </h1>
                  <p className="text-sm text-gray-500">
                    Элементы для drag & drop в конструкторе выражений
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500 whitespace-nowrap hidden sm:block">
                Всего: <b className="text-gray-800">{items.length}</b>
              </span>
            </div>
          </div>

          {/* ============ ФОРМА ДОБАВЛЕНИЯ ============ */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <Plus className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Добавить элемент</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Содержимое (например, def)"
                className="flex-1 px-3 py-2.5 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newItem.content}
                onChange={e => setNewItem({ ...newItem, content: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <select
                className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white sm:w-56"
                value={newItem.category}
                onChange={e => setNewItem({ ...newItem, category: e.target.value })}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAdd}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-all shadow-sm hover:shadow whitespace-nowrap"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Добавить
              </button>
            </div>
          </div>

          {/* ============ ФИЛЬТРЫ ============ */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                Все
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    categoryFilter === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {categoryCounts.all || 0}
                </span>
              </button>

              {CATEGORIES.map(cat => {
                const count = categoryCounts[cat.value] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategoryFilter(cat.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      categoryFilter === cat.value
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {cat.label}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        categoryFilter === cat.value
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по содержимому..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* ============ СПИСОК ЭЛЕМЕНТОВ ============ */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                <Tag className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500">
                {search.trim()
                  ? `Ничего не найдено по запросу «${search}»`
                  : categoryFilter !== 'all'
                  ? 'Нет элементов в этой категории'
                  : 'Пока нет ни одного элемента. Добавьте первый!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0 px-3 py-2 bg-gray-50 rounded-lg font-mono text-sm text-gray-800 border border-gray-200 min-w-[60px] text-center truncate">
                      {item.content}
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap ${getCategoryStyle(
                        item.category
                      )}`}
                    >
                      {getCategoryLabel(item.category)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ============ КНОПКА ВНИЗУ ============ */}
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