import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { MonitorsManage } from './pages/MonitorsManage';
import { MonitorDetail } from './pages/MonitorDetail';
import { MonitorFormPage } from './pages/MonitorFormPage';
import { AlertsLog } from './pages/AlertsLog';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      gcTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function AppLayout() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-gray-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/monitors" element={<MonitorsManage />} />
            <Route path="/monitors/new" element={<MonitorFormPage />} />
            <Route path="/monitors/:id" element={<MonitorDetail />} />
            <Route path="/monitors/:id/edit" element={<MonitorFormPage />} />
            <Route path="/alerts" element={<AlertsLog />} />
            <Route path="*" element={<div className="p-8 text-gray-500">Page not found</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
