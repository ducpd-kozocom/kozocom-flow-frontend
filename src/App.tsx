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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl">Hello! 👋</CardTitle>
          <CardDescription className="text-base">
            Welcome to Kozocom Flow
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            Edit <code className="bg-muted px-2 py-1 rounded font-mono text-sm">src/App.tsx</code> to get started
          </p>
          <Button>Get Started</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
