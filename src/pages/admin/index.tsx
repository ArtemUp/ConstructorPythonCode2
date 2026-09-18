import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Package,
  BarChart3,
  ArrowRight,
  Settings,
  Flag,
  LogOut,
} from 'lucide-react';
import { logoutAdmin } from '@app/providers/AdminGuard';

export const AdminPage = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Управление тестами',
      description: 'Создание, редактирование и удаление тестов',
      icon: FileText,
      color: 'blue',
      path: '/admin/tests',
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'hover:border-blue-300',
    },
    {
      title: 'Элементы корзины',
      description: 'Слова, символы и операторы для конструктора выражений',
      icon: Package,
      color: 'purple',
      path: '/admin/items',
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      border: 'hover:border-purple-300',
    },
    {
      title: 'Статистика AI',
      description: 'Потраченные токены и история генераций',
      icon: BarChart3,
      color: 'emerald',
      path: '/admin/ai-stats',
      bg: 'bg-emerald-100',
      text: 'text-emerald-600',
      border: 'hover:border-emerald-300',
    },
    {
      title: 'Отмеченные вопросы',
      description: 'Вопросы, которые ученики отметили как неверные',
      icon: Flag,
      color: 'amber',
      path: '/admin/flagged',
      bg: 'bg-amber-100',
      text: 'text-amber-600',
      border: 'hover:border-amber-300',
    },
  ];

  const handleLogout = () => {
    logoutAdmin();
    // Перезагружаем страницу, чтобы AdminGuard перерисовал форму входа
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-10 max-w-4xl">
        {/* Заголовок */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Панель администратора
                </h1>
                <p className="text-sm text-gray-500">
                  Управление тестами, элементами и статистикой
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        </div>

        {/* Секции */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.path}
                type="button"
                onClick={() => navigate(section.path)}
                className={`group text-left bg-white rounded-xl border border-gray-200 ${section.border} shadow-sm hover:shadow-md transition-all p-5 flex flex-col`}
              >
                <div className={`inline-flex p-2.5 rounded-lg ${section.bg} mb-4`}>
                  <Icon className={`w-5 h-5 ${section.text}`} />
                </div>

                <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-1">
                  {section.title}
                </h2>
                <p className="text-sm text-gray-500 mb-4 flex-1">
                  {section.description}
                </p>

                <div className="flex items-center justify-between text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  <span>Перейти</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Кнопка на главную */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            На главную
          </button>
        </div>
      </div>
    </div>
  );
};