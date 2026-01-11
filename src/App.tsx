import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import "./index.css";

<<<<<<< Updated upstream
=======
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CandidatesPage } from './modules/candidates';
import { ReviewsPage } from './modules/reviews';
import { ChatPage } from './modules/chat';
import './index.css';

// ─────────────────────────────────────────────────────────────
// ROUTE CONFIGURATION
// ─────────────────────────────────────────────────────────────
const ROUTES = [
  { path: '/', element: <Navigate to="/candidates" replace /> },
  { path: '/candidates', element: <CandidatesPage />, title: 'Talent Scanner', description: 'Parse CVs, extract skills, and rank candidates' },
  { path: '/reviews', element: <ReviewsPage />, title: 'Code Review Analytics', description: 'Track developer performance and error trends' },
  { path: '/chat', element: <ChatPage />, title: 'Smart Integrator', description: 'AI-powered assistant for cross-module insights' },
];

// ─────────────────────────────────────────────────────────────
// MAIN APP COMPONENT
// ─────────────────────────────────────────────────────────────
>>>>>>> Stashed changes
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
