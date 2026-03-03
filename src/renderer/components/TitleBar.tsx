import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../web/hooks/useAuth';

interface TitleBarProps {
  variant?: 'modern';
}

export function TitleBar({ variant = 'modern' }: TitleBarProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose    = () => window.electronAPI?.close();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="h-12 bg-app-surface-dark flex items-center justify-between px-3 drag-region border-b border-app-border">

      {/* Left — Logo */}
      <div className="flex items-center gap-2 no-drag">
        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.02em', color: '#e0e0e0' }}>
          Crate<span style={{ color: '#f97316' }}>Stream</span>
        </span>
      </div>

      {/* Center — User info */}
      <div className="flex-1 flex items-center justify-center no-drag">
        {user && (
          <div className="flex items-center gap-2 bg-app-surface px-3 py-1 rounded-full">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-app-text-muted text-xs max-w-[150px] truncate">
              {user.email}
            </span>
            <button
              onClick={() => window.electronAPI?.openExternal ? window.electronAPI.openExternal("https://cratestream.vercel.app/account") : window.open("https://cratestream.vercel.app/account", "_blank")}
              className="text-app-text-muted hover:text-orange-400 transition-colors ml-1"
              title="Account Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="text-app-text-muted hover:text-orange-400 transition-colors ml-1"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Right — Window controls */}
      <div className="flex items-center gap-1 no-drag">
        <button onClick={handleMinimize} className="w-8 h-8 flex items-center justify-center text-app-text-muted hover:text-app-text hover:bg-app-surface-light rounded transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button onClick={handleMaximize} className="w-8 h-8 flex items-center justify-center text-app-text-muted hover:text-app-text hover:bg-app-surface-light rounded transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
          </svg>
        </button>
        <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center text-app-text-muted hover:text-white hover:bg-red-500 rounded transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
