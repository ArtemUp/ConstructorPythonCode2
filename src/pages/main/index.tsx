import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  Package,
  BarChart3,
  ArrowRight,
  Code2,
  Sigma,
  Settings,
  Play,
  BookIcon,
} from 'lucide-react';

export const MainPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 md:py-16 max-w-5xl">
        {/* ============ HERO ============ */}
        <div className="text-center mb-10 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-full text-xs md:text-sm text-blue-700 shadow-sm mb-5 md:mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Платформа интерактивного тестирования
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
            Тесты, которые
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {' '}
              экономят время
            </span>
          </h1>

          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-8 md:mb-10">
            Генерируйте тесты по любой теме за секунды, проводите их онлайн и
            смотрите результаты. Drag & drop, автоматическая проверка и никаких
            листов Excel.
          </p>

          {/* Главная кнопка */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              type="button"
              onClick={() => navigate('/tests')}
              className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 md:px-8 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Play className="w-5 h-5" />
              Начать тест
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 md:px-8 py-3.5 text-base font-medium text-gray-700 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl transition-all shadow-sm"
            >
              <Settings className="w-5 h-5" />
              Админ-панель
            </button>
          </div>
        </div>

        {/* ============ КАРТОЧКИ ВОЗМОЖНОСТЕЙ ============ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10 md:mb-16">
          {/* AI-генерация */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6 group">
            <div className="inline-flex p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI-генерация тестов
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Опишите тему — нейросеть создаст тест за 15 секунд. Поддержка ЕГЭ,
              ОГЭ и школьной программы.
            </p>
          </div>

          {/* Конструктор */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6 group">
            <div className="inline-flex p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl mb-4 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Конструктор выражений
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ученик собирает ответ перетаскиванием элементов. Работает для
              Python и математики.
            </p>
          </div>

          {/* Результаты */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6 group">
            <div className="inline-flex p-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Мгновенные результаты
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Автоматическая проверка и подробная детализация по каждому
              вопросу — без ручной работы.
            </p>
          </div>
        </div>

        {/* ============ ТРИ СПЕЦИАЛИЗАЦИИ ============ */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 mb-10 md:mb-16">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Три направления
            </h2>
            <p className="text-sm md:text-base text-gray-500">
              Выберите специализацию — или используйте все
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Python */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
              <div className="flex-shrink-0 p-3 bg-white rounded-xl shadow-sm">
                <Code2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Python</h3>
                <p className="text-xs md:text-sm text-gray-600">
                  Синтаксис, функции, циклы, условия
                </p>
              </div>
            </div>

            {/* Математика */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
              <div className="flex-shrink-0 p-3 bg-white rounded-xl shadow-sm">
                <Sigma className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Математика</h3>
                <p className="text-xs md:text-sm text-gray-600">
                  Уравнения, логарифмы, интегралы, формулы
                </p>
              </div>
            </div>

            {/* Русский — теперь по центру */}
            <div className="sm:col-span-2 sm:max-w-md sm:mx-auto w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-rose-50 to-indigo-50 border border-rose-100">
              <div className="flex-shrink-0 p-3 bg-white rounded-xl shadow-sm">
                <BookIcon className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Русский язык</h3>
                <p className="text-xs md:text-sm text-gray-600">
                  Орфография, ударения, расстановка запятых
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============ ФУТЕР ============ */}
        <div className="text-center text-xs md:text-sm text-gray-500 pb-8">
          <p>© 2026 · Универсальная платформа для интерактивного тестирования</p>
        </div>
      </div>
    </div>
  );
};