import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SubscribePage } from './pages/SubscribePage';
import { PlayerPage } from './pages/PlayerPage';
import { AccountPage } from './pages/AccountPage';
import { ProtectedRoute } from './components/ProtectedRoute';
// TEMPORARILY REMOVED SubscriptionGate to fix navigation

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/subscribe" element={<SubscribePage />} />

        {/* Protected routes - require login ONLY (subscription check disabled for testing) */}
        <Route
          path="/player"
          element={
            <ProtectedRoute>
              <PlayerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
