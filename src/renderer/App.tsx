import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ModernSkin } from './skins/modern/ModernSkin';
import { useLibraryStore } from './store/libraryStore';
import { AudioPlayer } from './components/AudioPlayer';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loadLibrary } = useLibraryStore();

  useEffect(() => {
    async function init() {
      try {
        console.log('[App] Loading library from B2...');
        await loadLibrary();
        console.log('[App] Library loaded successfully!');
        setIsLoading(false);
      } catch (err: any) {
        console.error('[App] Failed to load library:', err);
        setError(err.message);
        setIsLoading(false);
      }
    }

    init();
  }, [loadLibrary]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-app-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-accent mx-auto mb-4"></div>
          <p className="text-app-text text-lg font-medium">Loading music library...</p>
          <p className="text-app-text-muted text-sm mt-2">This should only take a few seconds</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-app-background">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-semibold">Failed to Load Library</p>
          </div>
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
    <BrowserRouter>
      <AudioPlayer />
      <ModernSkin />
    </BrowserRouter>
  );
}

export default App;
