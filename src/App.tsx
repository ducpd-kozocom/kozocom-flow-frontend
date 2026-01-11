// ============================================================
// App.tsx
// Description: Main application with React Router
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './modules/dashboard';
import { CandidatesPage } from './modules/candidates';
import { ReviewsPage, RepoDetailPage, ReviewDetailPage } from './modules/reviews';
import { ChatPage } from './modules/chat';
import './index.css';

// ─────────────────────────────────────────────────────────────
// ROUTE CONFIGURATION
// ─────────────────────────────────────────────────────────────
const ROUTES = [
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/dashboard', element: <DashboardPage />, title: 'Dashboard', description: 'Overview of your workforce and code quality metrics' },
  { path: '/candidates', element: <CandidatesPage />, title: 'Talent Scanner', description: 'Parse CVs, extract skills, and rank candidates' },
  { path: '/reviews', element: <ReviewsPage />, title: 'Code Reviews', description: 'Track repositories and review analytics' },
  { path: '/reviews/repo/:id', element: <RepoDetailPage />, title: 'Repository Details', description: 'View repository reviews and configuration' },
  { path: '/reviews/:id', element: <ReviewDetailPage />, title: 'Review Details', description: 'View breaking changes and affected files' },
  { path: '/chat', element: <ChatPage />, title: 'Smart Integrator', description: 'AI-powered assistant for cross-module insights' },
];

// ─────────────────────────────────────────────────────────────
// MAIN APP COMPONENT
// ─────────────────────────────────────────────────────────────
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              route.title ? (
                <Layout pageTitle={route.title} pageDescription={route.description}>
                  {route.element}
                </Layout>
              ) : (
                route.element
              )
            }
          />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
