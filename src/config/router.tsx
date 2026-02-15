import { Suspense, lazy } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

// Pages - Import with lazy loading for better performance
import Home from '../pages/Home';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import AllEvents from '../pages/AllEvents';
import MyEvents from '../pages/MyEvents';
import CreateEvent from '../pages/CreateEvent';
import ManageEvent from '../pages/ManageEvent';
import MyProfile from '../pages/MyProfile';
import Settings from '../pages/Settings';
import Attendees from '../pages/Attendees';

// Live Event Pages
const EventLobby = lazy(() => import('../pages/EventLobby'));
const LiveSession = lazy(() => import('../pages/LiveSession'));

// Other Pages
const Feature = lazy(() => import('../pages/Feature'));
const About = lazy(() => import('../pages/About'));
const Security = lazy(() => import('../pages/Security'));
const UseCase = lazy(() => import('../pages/UseCase'));
const GetStarted = lazy(() => import('../pages/GetStarted'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
      <p className="text-gray-300">Loading...</p>
    </div>
  </div>
);

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/feature',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Feature />
      </Suspense>
    ),
  },
  {
    path: '/about',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <About />
      </Suspense>
    ),
  },
  {
    path: '/security',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Security />
      </Suspense>
    ),
  },
  {
    path: '/use-case',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <UseCase />
      </Suspense>
    ),
  },
  {
    path: '/get-started',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <GetStarted />
      </Suspense>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/all-events',
    element: <AllEvents />,
  },
  {
    path: '/my-events',
    element: (
      <ProtectedRoute>
        <MyEvents />
      </ProtectedRoute>
    ),
  },
  {
    path: '/create-event',
    element: (
      <ProtectedRoute>
        <CreateEvent />
      </ProtectedRoute>
    ),
  },
  {
    path: '/manage-event/:eventId',
    element: (
      <ProtectedRoute>
        <ManageEvent />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <MyProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/attendees/:eventId',
    element: (
      <ProtectedRoute>
        <Attendees />
      </ProtectedRoute>
    ),
  },
  {
    path: '/sessions/:sessionId/lobby',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingFallback />}>
          <EventLobby />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/sessions/:sessionId/live',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingFallback />}>
          <LiveSession />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <p className="text-gray-400 mb-6">Page not found</p>
          <a href="/" className="inline-block px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all">
            Go Home
          </a>
        </div>
      </div>
    ),
  },
]);

export const RouterComponent = () => {
  return <RouterProvider router={router} />;
};

export default RouterComponent;
