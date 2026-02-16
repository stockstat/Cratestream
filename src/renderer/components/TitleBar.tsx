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
  const handleClose = () => window.electronAPI?.close();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="h-10 bg-app-surface-dark flex items-center justify-between px-4 drag-region border-b border-app-border">
      <div className="flex items-center gap-3 no-drag">
        <div className="w-7 h-7 bg-gradient-to-br from-app-accent to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
          </svg>
        </div>
        <span className="text-app-text font-semibold text-sm">CrateStream</span>
      </div>

      {/* Center - User info and logout */}
      <div className="flex-1 flex items-center justify-center gap-3 no-drag">
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

      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center text-app-text-muted hover:text-app-text hover:bg-app-surface-light rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center text-app-text-muted hover:text-app-text hover:bg-app-surface-light rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center text-app-text-muted hover:text-white hover:bg-red-500 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
