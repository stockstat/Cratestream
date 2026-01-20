// Cloud Provider OAuth Configuration
// Users need to create their own apps and add credentials

export interface CloudProviderConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

// Dropbox Configuration
// Create app at: https://www.dropbox.com/developers/apps
export const DROPBOX_CONFIG: CloudProviderConfig = {
  clientId: process.env.VITE_DROPBOX_CLIENT_ID || '',
  redirectUri: 'http://localhost:5173/auth/dropbox/callback',
  scopes: ['files.content.read', 'files.metadata.read', 'account_info.read'],
  authUrl: 'https://www.dropbox.com/oauth2/authorize',
  tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
};

// Google Drive Configuration
// Create app at: https://console.cloud.google.com
export const GOOGLE_DRIVE_CONFIG: CloudProviderConfig = {
  clientId: process.env.VITE_GOOGLE_CLIENT_ID || '',
  redirectUri: 'http://localhost:5173/auth/google/callback',
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
  ],
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
};

// OneDrive Configuration
// Create app at: https://portal.azure.com
export const ONEDRIVE_CONFIG: CloudProviderConfig = {
  clientId: process.env.VITE_ONEDRIVE_CLIENT_ID || '',
  redirectUri: 'http://localhost:5173/auth/onedrive/callback',
  scopes: ['Files.Read', 'Files.Read.All', 'User.Read', 'offline_access'],
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
};

export function getProviderConfig(provider: string): CloudProviderConfig | null {
  switch (provider) {
    case 'dropbox':
      return DROPBOX_CONFIG;
    case 'google-drive':
      return GOOGLE_DRIVE_CONFIG;
    case 'onedrive':
      return ONEDRIVE_CONFIG;
    default:
      return null;
  }
}

// Generate random state for CSRF protection
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate PKCE code verifier and challenge
export async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

  // Create SHA-256 hash for challenge
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  const challenge = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return { verifier, challenge };
}
