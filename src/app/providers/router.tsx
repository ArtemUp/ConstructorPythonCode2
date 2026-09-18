import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainPage } from '@pages/main';
import { TestListPage } from '@pages/test-list';
import { TestPassingPage } from '@pages/test-passing';
import { TestResultsPage } from '@pages/test-results';
import { AdminPage } from '@pages/admin';
import { TestsPage } from '@pages/admin/tests';
import { TestFormPage } from '@pages/admin/test-form';
import { ItemsPage } from '@pages/admin/items';
import { AiStatsPage } from '@pages/admin/ai-stats';
import { AdminGuard } from './AdminGuard';
import { FlaggedPage } from '@pages/admin/flagged';

const router = createBrowserRouter([
  { path: '/', element: <MainPage /> },
  { path: '/tests', element: <TestListPage /> },
  { path: '/test/:id', element: <TestPassingPage /> },
  { path: '/test/:id/results', element: <TestResultsPage /> },
  {
    path: '/admin/flagged',
    element: (
      <AdminGuard>
        <FlaggedPage />
      </AdminGuard>
    ),
  },
  {
    path: '/admin',
    element: (
      <AdminGuard>
        <AdminPage />
      </AdminGuard>
    ),
  },
  {
    path: '/admin/tests',
    element: (
      <AdminGuard>
        <TestsPage />
      </AdminGuard>
    ),
  },
  {
    path: '/admin/tests/new',
    element: (
      <AdminGuard>
        <TestFormPage />
      </AdminGuard>
    ),
  },
  {
    path: '/admin/tests/:id',
    element: (
      <AdminGuard>
        <TestFormPage />
      </AdminGuard>
    ),
  },
  {
    path: '/admin/items',
    element: (
      <AdminGuard>
        <ItemsPage />
      </AdminGuard>
    ),
  },
  {
    path: '/admin/ai-stats',
    element: (
      <AdminGuard>
        <AiStatsPage />
      </AdminGuard>
    ),
  },
  
]);

export const Router = () => <RouterProvider router={router} />;