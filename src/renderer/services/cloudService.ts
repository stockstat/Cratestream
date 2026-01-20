import { getProviderConfig, generateState, generatePKCE } from './cloudConfig';
import type { CloudAccount } from '../types';

export interface CloudFile {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  size?: number;
  modifiedAt?: Date;
  mimeType?: string;
  downloadUrl?: string;
}

// Store PKCE verifiers temporarily during auth flow
const pkceVerifiers = new Map<string, string>();

// Build OAuth authorization URL
export async function getAuthUrl(provider: string): Promise<string | null> {
  const config = getProviderConfig(provider);
  if (!config || !config.clientId) {
    console.error(`Missing configuration for ${provider}`);
    return null;
  }

  const state = generateState();
  const { verifier, challenge } = await generatePKCE();

  // Store verifier for token exchange
  pkceVerifiers.set(state, verifier);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  // Provider-specific params
  if (provider === 'dropbox') {
    params.set('token_access_type', 'offline');
  } else if (provider === 'google-drive') {
    params.set('access_type', 'offline');
    params.set('prompt', 'consent');
  }

  return `${config.authUrl}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  provider: string,
  code: string,
  state: string
): Promise<Partial<CloudAccount> | null> {
  const config = getProviderConfig(provider);
  if (!config) return null;

  const verifier = pkceVerifiers.get(state);
  if (!verifier) {
    console.error('PKCE verifier not found for state');
    return null;
  }

  pkceVerifiers.delete(state);

  try {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        code,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token exchange failed:', error);
      return null;
    }

    const data = await response.json();

    // Get user info
    const userInfo = await getUserInfo(provider, data.access_token);

    return {
      provider: provider as CloudAccount['provider'],
      email: userInfo?.email || 'Unknown',
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  } catch (error) {
    console.error('Token exchange error:', error);
    return null;
  }
}

// Refresh access token
export async function refreshAccessToken(account: CloudAccount): Promise<CloudAccount | null> {
  const config = getProviderConfig(account.provider);
  if (!config || !account.refreshToken) return null;

  try {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        refresh_token: account.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();

    return {
      ...account,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || account.refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

// Get user info from provider
async function getUserInfo(provider: string, accessToken: string): Promise<{ email: string } | null> {
  try {
    let url: string;
    let headers: HeadersInit = { Authorization: `Bearer ${accessToken}` };

    switch (provider) {
      case 'dropbox':
        url = 'https://api.dropboxapi.com/2/users/get_current_account';
        const dropboxRes = await fetch(url, { method: 'POST', headers });
        const dropboxData = await dropboxRes.json();
        return { email: dropboxData.email };

      case 'google-drive':
        url = 'https://www.googleapis.com/oauth2/v2/userinfo';
        const googleRes = await fetch(url, { headers });
        const googleData = await googleRes.json();
        return { email: googleData.email };

      case 'onedrive':
        url = 'https://graph.microsoft.com/v1.0/me';
        const msRes = await fetch(url, { headers });
        const msData = await msRes.json();
        return { email: msData.userPrincipalName || msData.mail };

      default:
        return null;
    }
  } catch (error) {
    console.error('Get user info error:', error);
    return null;
  }
}

// List files in a folder
export async function listFiles(
  account: CloudAccount,
  path: string = ''
): Promise<CloudFile[]> {
  try {
    switch (account.provider) {
      case 'dropbox':
        return await listDropboxFiles(account.accessToken, path);
      case 'google-drive':
        return await listGoogleDriveFiles(account.accessToken, path);
      case 'onedrive':
        return await listOneDriveFiles(account.accessToken, path);
      default:
        return [];
    }
  } catch (error) {
    console.error('List files error:', error);
    return [];
  }
}

// Dropbox file listing
async function listDropboxFiles(accessToken: string, path: string): Promise<CloudFile[]> {
  const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: path || '',
      recursive: false,
      include_media_info: true,
    }),
  });

  if (!response.ok) return [];

  const data = await response.json();

  return data.entries.map((entry: any) => ({
    id: entry.id,
    name: entry.name,
    path: entry.path_lower,
    isFolder: entry['.tag'] === 'folder',
    size: entry.size,
    modifiedAt: entry.server_modified ? new Date(entry.server_modified) : undefined,
  }));
}

// Google Drive file listing
async function listGoogleDriveFiles(accessToken: string, folderId: string): Promise<CloudFile[]> {
  const parentId = folderId || 'root';
  const query = `'${parentId}' in parents and trashed = false`;

  const params = new URLSearchParams({
    q: query,
    fields: 'files(id,name,mimeType,size,modifiedTime,webContentLink)',
    pageSize: '1000',
  });

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) return [];

  const data = await response.json();

  return data.files.map((file: any) => ({
    id: file.id,
    name: file.name,
    path: file.id, // Google Drive uses IDs instead of paths
    isFolder: file.mimeType === 'application/vnd.google-apps.folder',
    size: parseInt(file.size) || undefined,
    modifiedAt: file.modifiedTime ? new Date(file.modifiedTime) : undefined,
    mimeType: file.mimeType,
    downloadUrl: file.webContentLink,
  }));
}

// OneDrive file listing
async function listOneDriveFiles(accessToken: string, path: string): Promise<CloudFile[]> {
  const endpoint = path
    ? `https://graph.microsoft.com/v1.0/me/drive/root:${path}:/children`
    : 'https://graph.microsoft.com/v1.0/me/drive/root/children';

  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return [];

  const data = await response.json();

  return data.value.map((item: any) => ({
    id: item.id,
    name: item.name,
    path: item.parentReference?.path
      ? `${item.parentReference.path.replace('/drive/root:', '')}/${item.name}`
      : `/${item.name}`,
    isFolder: !!item.folder,
    size: item.size,
    modifiedAt: item.lastModifiedDateTime ? new Date(item.lastModifiedDateTime) : undefined,
    mimeType: item.file?.mimeType,
    downloadUrl: item['@microsoft.graph.downloadUrl'],
  }));
}

// Get download URL for a file
export async function getDownloadUrl(
  account: CloudAccount,
  file: CloudFile
): Promise<string | null> {
  try {
    switch (account.provider) {
      case 'dropbox':
        return await getDropboxDownloadUrl(account.accessToken, file.path);
      case 'google-drive':
        return await getGoogleDriveDownloadUrl(account.accessToken, file.id);
      case 'onedrive':
        return file.downloadUrl || null;
      default:
        return null;
    }
  } catch (error) {
    console.error('Get download URL error:', error);
    return null;
  }
}

async function getDropboxDownloadUrl(accessToken: string, path: string): Promise<string | null> {
  const response = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.link;
}

async function getGoogleDriveDownloadUrl(accessToken: string, fileId: string): Promise<string | null> {
  // For Google Drive, we return a URL that requires the access token
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${accessToken}`;
}

// Filter audio files from a list
export function filterAudioFiles(files: CloudFile[]): CloudFile[] {
  const audioExtensions = [
    '.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac',
    '.wma', '.opus', '.aiff', '.ape', '.wv'
  ];

  return files.filter(file => {
    if (file.isFolder) return false;
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    return audioExtensions.includes(ext);
  });
}
