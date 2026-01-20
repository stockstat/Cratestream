import { useState, useEffect, useCallback } from 'react';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import {
  getAuthUrl,
  exchangeCodeForTokens,
  listFiles,
  getDownloadUrl,
  filterAudioFiles,
  type CloudFile,
} from '../services/cloudService';
import type { CloudAccount, Track } from '../types';

interface CloudBrowserProps {
  variant?: 'modern' | 'winamp';
}

// Generate a simple ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function CloudBrowser({ variant = 'modern' }: CloudBrowserProps) {
  const { cloudAccounts, addCloudAccount, removeCloudAccount, addTracks } = useLibraryStore();
  const { setQueue, queue } = usePlayerStore();

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<CloudAccount | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pathHistory, setPathHistory] = useState<string[]>([]);

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const path = url.pathname;

      if (code && state) {
        let provider: string | null = null;
        if (path.includes('dropbox')) provider = 'dropbox';
        else if (path.includes('google')) provider = 'google-drive';
        else if (path.includes('onedrive')) provider = 'onedrive';

        if (provider) {
          setIsConnecting(true);
          const accountData = await exchangeCodeForTokens(provider, code, state);

          if (accountData) {
            const newAccount: CloudAccount = {
              id: generateId(),
              provider: accountData.provider!,
              email: accountData.email!,
              accessToken: accountData.accessToken!,
              refreshToken: accountData.refreshToken!,
              expiresAt: accountData.expiresAt!,
              rootFolders: [],
            };
            addCloudAccount(newAccount);
          }

          // Clear URL params
          window.history.replaceState({}, '', '/');
          setIsConnecting(false);
        }
      }
    };

    handleCallback();
  }, [addCloudAccount]);

  // Connect to a cloud provider
  const handleConnect = useCallback(async (provider: string) => {
    setConnectingProvider(provider);
    const authUrl = await getAuthUrl(provider);

    if (authUrl) {
      // Open in same window for OAuth flow
      window.location.href = authUrl;
    } else {
      alert(`Please configure ${provider} credentials in your environment variables.`);
      setConnectingProvider(null);
    }
  }, []);

  // Disconnect a cloud account
  const handleDisconnect = useCallback((accountId: string) => {
    removeCloudAccount(accountId);
    if (selectedAccount?.id === accountId) {
      setSelectedAccount(null);
      setFiles([]);
      setCurrentPath('');
      setPathHistory([]);
    }
  }, [removeCloudAccount, selectedAccount]);

  // Browse files in selected account
  const browseFiles = useCallback(async (account: CloudAccount, path: string = '') => {
    setIsLoading(true);
    setSelectedAccount(account);
    setCurrentPath(path);

    const fileList = await listFiles(account, path);
    setFiles(fileList);
    setIsLoading(false);
  }, []);

  // Navigate to folder
  const navigateToFolder = useCallback((folder: CloudFile) => {
    if (selectedAccount) {
      setPathHistory(prev => [...prev, currentPath]);
      browseFiles(selectedAccount, folder.path);
    }
  }, [selectedAccount, currentPath, browseFiles]);

  // Go back
  const goBack = useCallback(() => {
    if (pathHistory.length > 0 && selectedAccount) {
      const prevPath = pathHistory[pathHistory.length - 1];
      setPathHistory(prev => prev.slice(0, -1));
      browseFiles(selectedAccount, prevPath);
    }
  }, [pathHistory, selectedAccount, browseFiles]);

  // Add audio files to library
  const handleAddFiles = useCallback(async (selectedFiles: CloudFile[]) => {
    if (!selectedAccount) return;

    const audioFiles = filterAudioFiles(selectedFiles);
    if (audioFiles.length === 0) return;

    const newTracks: Track[] = [];

    for (const file of audioFiles) {
      const downloadUrl = await getDownloadUrl(selectedAccount, file);
      if (downloadUrl) {
        newTracks.push({
          id: generateId(),
          title: file.name.replace(/\.[^.]+$/, ''),
          artist: 'Unknown Artist',
          album: 'Unknown Album',
          duration: 0,
          filePath: file.path,
          fileUrl: downloadUrl,
          format: file.name.split('.').pop()?.toUpperCase() || 'AUDIO',
        });
      }
    }

    if (newTracks.length > 0) {
      addTracks(newTracks);
      if (queue.length === 0) {
        setQueue(newTracks, 0);
      }
    }
  }, [selectedAccount, addTracks, setQueue, queue.length]);

  // Add all audio files in current folder
  const handleAddAll = useCallback(() => {
    const audioFiles = filterAudioFiles(files);
    handleAddFiles(audioFiles);
  }, [files, handleAddFiles]);

  const providerIcons: Record<string, string> = {
    dropbox: '📦',
    'google-drive': '🔷',
    onedrive: '☁️',
  };

  const providerNames: Record<string, string> = {
    dropbox: 'Dropbox',
    'google-drive': 'Google Drive',
    onedrive: 'OneDrive',
  };

  if (variant === 'winamp') {
    return (
      <div className="p-2 bg-[#1a1a2e] border border-[#3a3a5c] text-[9px]">
        <div className="text-[#00ff00] mb-2 font-bold">CLOUD STORAGE</div>

        {/* Connected accounts */}
        {cloudAccounts.map(account => (
          <div key={account.id} className="flex items-center justify-between py-1 border-b border-[#2a2a4e]">
            <button
              onClick={() => browseFiles(account)}
              className="flex items-center gap-1 text-[#00ff00] hover:text-white"
            >
              <span>{providerIcons[account.provider]}</span>
              <span className="truncate max-w-[100px]">{account.email}</span>
            </button>
            <button
              onClick={() => handleDisconnect(account.id)}
              className="text-[#ff4444] hover:text-white px-1"
            >
              X
            </button>
          </div>
        ))}

        {/* Connect buttons */}
        <div className="mt-2 space-y-1">
          {['dropbox', 'google-drive', 'onedrive'].map(provider => {
            const isConnected = cloudAccounts.some(a => a.provider === provider);
            if (isConnected) return null;

            return (
              <button
                key={provider}
                onClick={() => handleConnect(provider)}
                disabled={!!connectingProvider}
                className="w-full flex items-center gap-1 px-2 py-1 bg-[#2a2a4e] hover:bg-[#3a3a5c] text-[#00aa00] hover:text-[#00ff00] disabled:opacity-50"
              >
                <span>{providerIcons[provider]}</span>
                <span>+ {providerNames[provider]}</span>
              </button>
            );
          })}
        </div>

        {/* File browser */}
        {selectedAccount && (
          <div className="mt-2 border-t border-[#3a3a5c] pt-2">
            <div className="flex items-center justify-between mb-1">
              <button
                onClick={goBack}
                disabled={pathHistory.length === 0}
                className="text-[#00ff00] hover:text-white disabled:opacity-30"
              >
                ← Back
              </button>
              <button
                onClick={handleAddAll}
                className="text-[#00ff00] hover:text-white"
              >
                + Add All
              </button>
            </div>

            <div className="max-h-[150px] overflow-y-auto">
              {isLoading ? (
                <div className="text-[#00aa00] text-center py-2">Loading...</div>
              ) : (
                files.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between py-0.5 hover:bg-[#2a2a4e] cursor-pointer"
                    onClick={() => file.isFolder ? navigateToFolder(file) : handleAddFiles([file])}
                  >
                    <span className="truncate text-[#00ff00]">
                      {file.isFolder ? '📁' : '🎵'} {file.name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Modern variant
  return (
    <div className="p-4 bg-app-surface rounded-lg">
      <h3 className="text-sm font-semibold text-app-text mb-3">Cloud Storage</h3>

      {/* Connected accounts */}
      <div className="space-y-2 mb-4">
        {cloudAccounts.map(account => (
          <div
            key={account.id}
            className="flex items-center justify-between p-2 bg-app-surface-light rounded-lg"
          >
            <button
              onClick={() => browseFiles(account)}
              className="flex items-center gap-2 text-app-text hover:text-app-accent"
            >
              <span className="text-lg">{providerIcons[account.provider]}</span>
              <div className="text-left">
                <div className="text-sm font-medium">{providerNames[account.provider]}</div>
                <div className="text-xs text-app-text-muted">{account.email}</div>
              </div>
            </button>
            <button
              onClick={() => handleDisconnect(account.id)}
              className="p-1 text-app-text-muted hover:text-red-500 transition-colors"
              title="Disconnect"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Connect buttons */}
      <div className="space-y-2">
        {['dropbox', 'google-drive', 'onedrive'].map(provider => {
          const isConnected = cloudAccounts.some(a => a.provider === provider);
          if (isConnected) return null;

          return (
            <button
              key={provider}
              onClick={() => handleConnect(provider)}
              disabled={isConnecting}
              className="w-full flex items-center gap-3 p-3 bg-app-surface-light hover:bg-app-bg rounded-lg text-app-text-muted hover:text-app-text transition-colors disabled:opacity-50"
            >
              <span className="text-xl">{providerIcons[provider]}</span>
              <span className="text-sm">Connect {providerNames[provider]}</span>
              {connectingProvider === provider && (
                <svg className="w-4 h-4 ml-auto animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* File browser modal/panel */}
      {selectedAccount && (
        <div className="mt-4 border-t border-app-surface-light pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={goBack}
                disabled={pathHistory.length === 0}
                className="p-1 text-app-text-muted hover:text-app-text disabled:opacity-30 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm text-app-text-muted truncate max-w-[150px]">
                {currentPath || 'Root'}
              </span>
            </div>
            <button
              onClick={handleAddAll}
              className="text-xs px-3 py-1 bg-app-accent hover:bg-app-accent-hover text-white rounded transition-colors"
            >
              Add All Audio
            </button>
          </div>

          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="w-6 h-6 animate-spin text-app-accent" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-app-text-muted text-sm">
                No files found
              </div>
            ) : (
              files.map(file => (
                <button
                  key={file.id}
                  onClick={() => file.isFolder ? navigateToFolder(file) : handleAddFiles([file])}
                  className="w-full flex items-center gap-2 p-2 hover:bg-app-surface-light rounded transition-colors text-left"
                >
                  {file.isFolder ? (
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-app-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  )}
                  <span className="text-sm text-app-text truncate">{file.name}</span>
                  {!file.isFolder && file.size && (
                    <span className="text-xs text-app-text-muted ml-auto">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
