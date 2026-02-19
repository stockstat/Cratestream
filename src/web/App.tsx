import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SubscribePage } from './pages/SubscribePage';
import { AccountPage } from './pages/AccountPage';
import { WebPlayerPage } from './pages/WebPlayerPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/subscribe" element={<SubscribePage />} />
        <Route path="/listen" element={<WebPlayerPage />} />

        {/* Old player route - redirect to web player */}
        <Route path="/player" element={<Navigate to="/listen" replace />} />

        {/* Protected routes */}
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
