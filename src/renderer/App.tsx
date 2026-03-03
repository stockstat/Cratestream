import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ModernSkin } from './skins/modern/ModernSkin';
import { useLibraryStore } from './store/libraryStore';
import { AudioPlayer } from './components/AudioPlayer';
import { LoginPage } from '../web/pages/LoginPage';
import { useAuth } from '../web/hooks/useAuth';

function AppInner() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loadLibrary } = useLibraryStore();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!user) return; // Don't load library until logged in
    async function init() {
      try {
        await loadLibrary();
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
      }
    }
    init();
  }, [user, loadLibrary]);

  // Wait for Firebase to resolve auth state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-app-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-accent" />
      </div>
    );
  }

  // Not logged in — show login
  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  // Logged in but library still loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-app-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-accent mx-auto mb-4" />
          <p className="text-app-text text-lg font-medium">Loading music library...</p>
          <p className="text-app-text-muted text-sm mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-app-background">
        <div className="text-center max-w-md px-4">
          <p className="text-red-500 text-lg font-semibold mb-2">Failed to Load Library</p>
          <p className="text-app-text-muted text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-app-accent text-white rounded-lg hover:bg-app-accent-hover transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main app
  return (
    <Routes>
      <Route path="*" element={
        <>
          <AudioPlayer />
          <ModernSkin />
        </>
      } />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;
