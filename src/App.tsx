import { Auth0Provider } from '@auth0/auth0-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from './hooks/useApi';
import { useJobsHub } from './hooks/useJobsHub';
import Layout from './components/Layout';
import Analytics from './components/Analytics';
import LoginPage from './pages/auth/LoginPage';
import CallbackPage from './pages/auth/CallbackPage';
import DashboardPage from './pages/jobs/DashboardPage';
import JobDetailPage from './pages/jobs/JobDetailPage';
import CreateJobPage from './pages/jobs/CreateJobPage';
import EditJobPage from './pages/jobs/EditJobPage';
import ResumesPage from './pages/resumes/ResumesPage';
import ExperiencePage from './pages/experience/ExperiencePage';
import AiProfilesPage from './pages/aiProfiles/AiProfilesPage';
import FeedbackPage from './pages/feedback/FeedbackPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 }
  }
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F1F5F9' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: '#2563EB', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>JT</div>
          <span style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Inter, system-ui, sans-serif' }}>Loading…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  useApi();
  useJobsHub();

  return (
    <>
      <Analytics />
      <Routes>
      <Route path="/login"          element={<LoginPage />} />
      <Route path="/callback"       element={<CallbackPage />} />
      <Route path="/"               element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/jobs/new"       element={<ProtectedRoute><CreateJobPage /></ProtectedRoute>} />
      <Route path="/jobs/:id/edit"  element={<ProtectedRoute><EditJobPage /></ProtectedRoute>} />
      <Route path="/jobs/:id"       element={<ProtectedRoute><JobDetailPage /></ProtectedRoute>} />
      <Route path="/resumes"        element={<ProtectedRoute><ResumesPage /></ProtectedRoute>} />
      <Route path="/experience"     element={<ProtectedRoute><ExperiencePage /></ProtectedRoute>} />
      <Route path="/ai-profiles"    element={<ProtectedRoute><AiProfilesPage /></ProtectedRoute>} />
      <Route path="/feedback"       element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
      <Route path="*"               element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
};

function App() {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}${import.meta.env.BASE_URL}callback`,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </Auth0Provider>
  );
}

export default App;
