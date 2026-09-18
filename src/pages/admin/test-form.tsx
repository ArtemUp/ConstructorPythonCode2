import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTest, useCreateTest, useUpdateTest } from '@entities/test/api';
import { QuestionsList } from '@features/question-editor';
import { GenerateTestButton } from '@features/ai-generate/GenerateTestButton';
import { notify } from '@shared/lib/toast';
import {
  Save,
  ArrowLeft,
  FileJson,
  ListChecks,
  Sparkles,
} from 'lucide-react';

// Схема валидации (расширена под вопросы)
const testSchema = z.object({
  id: z.string().min(1, 'ID обязателен'),
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional().default(''),
  subject: z.enum(['python', 'math', 'russian']),
  questions: z.array(z.any()).default([]),
  timeLimit: z.number().optional(),
});

type TestFormData = z.infer<typeof testSchema>;

type Tab = 'manual' | 'json';

export const TestFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = id && id !== 'new';
  const { data: existingTest, isLoading: isLoadingTest } = useTest(id!, { enabled: isEditing });
  const createTest = useCreateTest();
  const updateTest = useUpdateTest();

  const [activeTab, setActiveTab] = useState<Tab>('manual');
  const [jsonInput, setJsonInput] = useState('');
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      id: '',
      title: '',
      description: '',
      subject: 'python',
      questions: [],
    },
  });

  const currentSubject = watch('subject');
  const currentQuestions = watch('questions') || [];

  // Заполнение при редактировании
  useEffect(() => {
    if (existingTest) {
      setValue('id', existingTest.id);
      setValue('title', existingTest.title);
      setValue('description', existingTest.description || '');
      setValue('subject', existingTest.subject);
      setValue('questions', existingTest.questions || []);
      setValue('timeLimit', existingTest.timeLimit);
    }
  }, [existingTest, setValue]);

  // === Работа с JSON ===
  const handleLoadJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.id) setValue('id', parsed.id);
      if (parsed.title) setValue('title', parsed.title);
      if (parsed.description) setValue('description', parsed.description);
      if (parsed.subject) setValue('subject', parsed.subject);
      if (Array.isArray(parsed.questions)) setValue('questions', parsed.questions);
      if (parsed.timeLimit) setValue('timeLimit', parsed.timeLimit);
      notify.success('JSON загружен', 'Проверьте данные и сохраните');
      setActiveTab('manual'); // переключаемся на форму для просмотра
    } catch (err) {
      notify.error('Ошибка JSON', (err as Error).message);
    }
  };

  // === AI-генерация ===
  const handleGenerated = (testData: any) => {
    if (testData.id) setValue('id', testData.id);
    if (testData.title) setValue('title', testData.title);
    if (testData.description) setValue('description', testData.description);
    if (testData.subject) setValue('subject', testData.subject);
    if (Array.isArray(testData.questions)) setValue('questions', testData.questions);
    if (testData.timeLimit) setValue('timeLimit', testData.timeLimit);
    notify.success('Тест сгенерирован', 'Проверьте данные и сохраните');
    setActiveTab('manual');
  };

  // === Отправка формы ===
  const onSubmit = async (data: TestFormData) => {
    setSaving(true);
    try {
      if (isEditing) {
        await updateTest.mutateAsync(data);
      } else {
        await createTest.mutateAsync(data);
      }
      navigate('/admin/tests');
    } catch (err) {
      console.error(err);
      notify.error('Ошибка сохранения', 'Попробуйте ещё раз');
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && isLoadingTest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-gray-500">Загрузка теста...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-8">
      <div className="container mx-auto px-3 md:px-4 max-w-4xl">
        {/* ============ ШАПКА ============ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {isEditing ? 'Редактирование теста' : 'Создание теста'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Заполните основную информацию и добавьте вопросы
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/tests')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            К списку тестов
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ============ ОСНОВНАЯ ИНФОРМАЦИЯ ============ */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
              Основная информация
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ID теста <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('id')}
                  disabled={isEditing}
                  placeholder="Например: python_basics"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
                {errors.id && (
                  <p className="text-red-500 text-xs mt-1">{errors.id.message}</p>
                )}
              </div>

              {/* Предмет */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Предмет <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('subject')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg ..."
                >
                  <option value="python">Python</option>
                  <option value="math">Математика</option>
                  <option value="russian">Русский язык</option>
                </select>
              </div>

              {/* Название */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Название <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('title')}
                  placeholder="Например: Основы Python"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Описание */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Описание
                </label>
                <textarea
                  rows={2}
                  {...register('description')}
                  placeholder="Краткое описание теста"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Лимит времени */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Лимит времени (мин)
                </label>
                <input
                  type="number"
                  min={0}
                  {...register('timeLimit', { valueAsNumber: true })}
                  placeholder="0 = без лимита"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* ============ AI-ГЕНЕРАЦИЯ ============ */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-semibold text-gray-900">
                    Создать через AI
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                    Сгенерируйте тест по теме — YandexGPT создаст вопросы автоматически
                  </p>
                </div>
              </div>
              <GenerateTestButton onGenerated={handleGenerated} />
            </div>
          </div>

          {/* ============ ВОПРОСЫ ============ */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            {/* Переключатель вкладок */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-5 w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'manual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ListChecks className="w-4 h-4" />
                Вручную
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('json')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'json'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileJson className="w-4 h-4" />
                JSON
              </button>
            </div>

            {/* === ВКЛАДКА "ВРУЧНУЮ" === */}
            {activeTab === 'manual' && (
              <QuestionsList
                questions={currentQuestions}
                subject={currentSubject}
                onChange={questions => setValue('questions', questions)}
              />
            )}

            {/* === ВКЛАДКА "JSON" === */}
            {activeTab === 'json' && (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Вставьте JSON теста целиком или только массив вопросов
                </p>
                <textarea
                  rows={14}
                  value={jsonInput}
                  onChange={e => setJsonInput(e.target.value)}
                  placeholder={'{\n  "id": "my_test",\n  "title": "Мой тест",\n  "questions": [...]\n}'}
                  className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={handleLoadJson}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Загрузить JSON
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============ КНОПКИ ============ */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pb-6">
            <button
              type="button"
              onClick={() => navigate('/admin/tests')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Сохранить тест
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};