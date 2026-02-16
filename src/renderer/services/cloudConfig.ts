// Cloud provider OAuth configuration

export interface ProviderConfig {
  clientId: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
}

// Get Dropbox configuration
export function getProviderConfig(provider: string): ProviderConfig | null {
  switch (provider) {
    case 'dropbox':
      return {
        clientId: import.meta.env.VITE_DROPBOX_CLIENT_ID || '',
        redirectUri: import.meta.env.VITE_DROPBOX_REDIRECT_URI || 'http://localhost:5173/dropbox',
        authUrl: 'https://www.dropbox.com/oauth2/authorize',
        tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
        scopes: ['files.metadata.read', 'files.content.read'],
      };

    case 'google-drive':
      return {
        clientId: import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID || '',
        redirectUri: import.meta.env.VITE_GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:5173/google',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: [
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/userinfo.email',
        ],
      };

    case 'onedrive':
      return {
        clientId: import.meta.env.VITE_ONEDRIVE_CLIENT_ID || '',
        redirectUri: import.meta.env.VITE_ONEDRIVE_REDIRECT_URI || 'http://localhost:5173/onedrive',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scopes: ['Files.Read', 'User.Read', 'offline_access'],
      };

    default:
      return null;
  }
}

// Generate random state for OAuth
export function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Generate PKCE challenge
export async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const verifier = generateRandomString(128);
  const challenge = await sha256(verifier);
  return { verifier, challenge };
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
}

async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(hash);
}

function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}