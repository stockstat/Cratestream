import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ModernSkin } from '../../renderer/skins/modern/ModernSkin';

export function PlayerPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSeek = (time: number) => {
    // Seek is handled by ModernSkin internally via playerStore
    console.log('Seek to:', time);
  };

  // Mobile view - simplified message for now
  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Mobile Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">
            <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
              CrateStream
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/account')}
              className="text-sm text-gray-300 hover:text-white px-2 py-1"
            >
              Account
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-300 hover:text-white px-2 py-1"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Coming Soon */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">📱</div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Mobile Player Coming Soon
            </h2>
            <p className="text-gray-300 mb-6">
              The mobile player is being built. For now, please use a desktop browser to access your music.
            </p>
            <p className="text-sm text-gray-400">
              The mobile player will feature:
              <br />• Touch-optimized controls
              <br />• Swipe gestures
              <br />• Full-screen player
              <br />• CloudBeats-style interface
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Desktop view - full ModernSkin player
  return <ModernSkin onSeek={handleSeek} />;
}
