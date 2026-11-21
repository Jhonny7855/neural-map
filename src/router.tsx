import { createBrowserRouter, Navigate } from 'react-router-dom';import { AppShell } from '@/components/AppShell';
import { AppRoot } from '@/pages/AppRoot';
import { Landing } from '@/pages/Landing';
import { Dashboard } from '@/pages/Dashboard';
import { Universes } from '@/pages/Universes';
import { NeuralSpace } from '@/pages/NeuralSpace';
import { NodeExplorer } from '@/pages/NodeExplorer';
import { ImportCenter } from '@/pages/ImportCenter';
import { LearningPaths } from '@/pages/LearningPaths';
import { MindLab } from '@/pages/MindLab';
import { ExamArena } from '@/pages/ExamArena';
import { Connections } from '@/pages/Connections';
import { RevisionCenter } from '@/pages/RevisionCenter';
import { Analytics } from '@/pages/Analytics';
import { Assistant } from '@/pages/Assistant';
import { SettingsPage } from '@/pages/Settings';
import { Profile } from '@/pages/Profile';
import { SearchPage } from '@/pages/SearchPage';

export const router = createBrowserRouter(
  [
    { path: '/', element: <Landing /> },
    {
      path: '/app',
      element: (
        <AppRoot>
          <AppShell>
            <Dashboard />
          </AppShell>
        </AppRoot>
      ),
    },
    { path: '/app/neural-space', element: <AppRoot><AppShell><NeuralSpace /></AppShell></AppRoot> },
    { path: '/app/universes', element: <AppRoot><AppShell><Universes /></AppShell></AppRoot> },
    { path: '/app/node/:nodeId', element: <AppRoot><AppShell><NodeExplorer /></AppShell></AppRoot> },
    { path: '/app/import', element: <AppRoot><AppShell><ImportCenter /></AppShell></AppRoot> },
    { path: '/app/paths', element: <AppRoot><AppShell><LearningPaths /></AppShell></AppRoot> },
    { path: '/app/lab', element: <AppRoot><AppShell><MindLab /></AppShell></AppRoot> },
    { path: '/app/exam', element: <AppRoot><AppShell><ExamArena /></AppShell></AppRoot> },
    { path: '/app/connections', element: <AppRoot><AppShell><Connections /></AppShell></AppRoot> },
    { path: '/app/revision', element: <AppRoot><AppShell><RevisionCenter /></AppShell></AppRoot> },
    { path: '/app/analytics', element: <AppRoot><AppShell><Analytics /></AppShell></AppRoot> },
    { path: '/app/assistant', element: <AppRoot><AppShell><Assistant /></AppShell></AppRoot> },
    { path: '/app/settings', element: <AppRoot><AppShell><SettingsPage /></AppShell></AppRoot> },
    { path: '/app/profile', element: <AppRoot><AppShell><Profile /></AppShell></AppRoot> },
    { path: '/app/search', element: <AppRoot><AppShell><SearchPage /></AppShell></AppRoot> },
    { path: '*', element: <Navigate to="/" replace /> },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
);
