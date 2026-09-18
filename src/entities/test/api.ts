import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { Test } from './types';

export const testKeys = {
  all: ['tests'] as const,
  detail: (id: string) => ['tests', id] as const,
};

// Получить все тесты
export const useTests = () => {
  return useQuery({
    queryKey: testKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<Test[]>('/tests');
      return data;
    },
  });
};

// Получить один тест по id
export const useTest = (id: string) => {
  return useQuery({
    queryKey: testKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Test>(`/tests/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

// Создать тест
export const useCreateTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (test: Test) => apiClient.post('/tests', test),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.all });
    },
  });
};

// Обновить тест
export const useUpdateTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...test }: Test) => apiClient.put(`/tests/${id}`, test),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: testKeys.all });
      queryClient.invalidateQueries({ queryKey: testKeys.detail(id) });
    },
  });
};

// Удалить тест
export const useDeleteTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.all });
    },
  });
};

export const useItems = () => {
  return useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data } = await apiClient.get<Item[]>('/items');
      return data;
    },
  });
};