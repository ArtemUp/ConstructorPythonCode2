import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@shared/api/client';

const TOKEN_KEY = 'admin_token';

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // При монтировании — проверяем, есть ли уже токен
  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    setAuthorized(!!token);
    setChecking(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await apiClient.post<{ token: string }>(
        '/auth/login',
        { password },
      );

      sessionStorage.setItem(TOKEN_KEY, data.token);
      setAuthorized(true);
      setPassword('');
    } catch (err: any) {
      const status = err.response?.status;

      if (status === 401) {
        setError('Неверный пароль');
      } else if (status === 429) {
        setError('Слишком много попыток. Подождите 15 минут.');
      } else if (status === 500) {
        setError('Ошибка сервера. Попробуйте позже.');
      } else if (!err.response) {
        setError('Нет связи с сервером. Проверьте подключение.');
      } else {
        setError('Ошибка входа. Попробуйте позже.');
      }

      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  // Пока проверяем токен — показываем спиннер
  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Уже авторизован — показываем детей
  if (authorized) {
    return <>{children}</>;
  }

  // Форма входа
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
          {/* Иконка */}
          <div className="flex justify-center mb-5">
            <div className="p-3 bg-blue-100 rounded-full">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          {/* Заголовок */}
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-1">
            Панель администратора
          </h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            Введите пароль для доступа
          </p>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  autoFocus
                  placeholder="••••••••"
                  disabled={loading}
                  className={`w-full px-4 py-2.5 pr-10 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors disabled:bg-gray-50 ${
                    error
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {error && (
                <p className="text-sm text-red-600 mt-1.5">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm hover:shadow inline-flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          {/* Кнопка назад */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную
          </button>
        </div>
      </div>
    </div>
  );
};

/** Хук для выхода из админки (использовать в AdminPage) */
export const logoutAdmin = () => {
  sessionStorage.removeItem(TOKEN_KEY);
};