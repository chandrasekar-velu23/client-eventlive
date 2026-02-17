import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Header from "./components/layout/Header";
import DashboardLayout from "./components/layout/DashboardLayout";
import { useAuth } from "./hooks/useAuth";

// Pages  
// Pages  
import Home from "./pages/Home";
import Login from "./pages/Login";
import GetStarted from "./pages/GetStarted";
import Dashboard from "./pages/Dashboard";
import Features from "./pages/Feature";
import UseCases from "./pages/UseCase";
import CreateEvent from "./pages/CreateEvent";
import Events from "./pages/MyEvents";
import Drafts from "./pages/Drafts";
import Requests from "./pages/Requests";
import Attendees from "./pages/Attendees";
import Settings from "./pages/Settings";
import AllEvent from "./pages/AllEvents";
import ManageEvent from "./pages/ManageEvent";
import Onboarding from "./pages/Onboarding";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import LiveSession from "./pages/LiveSession";

export default function App() {
  const { user } = useAuth();
  const location = useLocation();
  const isDashboardPath = location.pathname.startsWith("/dashboard");

  return (
    <>
      <>
        <Toaster position="bottom-right" richColors closeButton />
        {/* Show header only if NOT in dashboard and NOT logged in */}
        {!isDashboardPath && !user && <Header />}

        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/use-cases" element={<UseCases />} />
          <Route path="/allevents" element={<AllEvent />} />
          <Route path="/join/:code" element={<LiveSession />} />
          {/* Auth Logic */}
          <Route
            path="/login"
            element={user ? <Navigate to={user.onboardingCompleted ? "/dashboard" : "/onboarding"} replace /> : <Login />}
          />
          <Route
            path="/get-started"
            element={user ? <Navigate to={user.onboardingCompleted ? "/dashboard" : "/onboarding"} replace /> : <GetStarted />}
          />
          <Route
            path="/onboarding"
            element={
              user ? (
                user.onboardingCompleted ? <Navigate to="/dashboard" replace /> : <Onboarding />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* --- Protected Dashboard --- */}
          <Route
            path="/dashboard/*"
            element={
              user ? (
                <DashboardLayout>
                  <Routes>
                    <Route index element={<Dashboard />} />
                    <Route path="create-event" element={<CreateEvent />} />
                    <Route path="events" element={<Events />} />
                    <Route path="drafts" element={<Drafts />} />
                    <Route path="requests" element={<Requests />} />
                    <Route path="attendees" element={<Attendees />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="all-events" element={<AllEvent />} />
                    <Route path="enrolled" element={<Events />} />
                    <Route path="events/:eventId" element={<ManageEvent />} />
                    <Route path="events/:eventId/attendees" element={<Attendees />} />
                  </Routes>
                </DashboardLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Catch-all: Redirects to home if path doesn't exist */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    </>
  );
}