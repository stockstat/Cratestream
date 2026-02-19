// api/browse.js — Vercel serverless function
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { prefix = '', mode = 'folders' } = req.query;

  const keyId    = process.env.B2_KEY_ID;
  const appKey   = process.env.B2_APP_KEY;
  const bucket   = process.env.B2_BUCKET_NAME;
  const bucketId = process.env.B2_BUCKET_ID;

  try {
    // Authorize
    const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${keyId}:${appKey}`).toString('base64'),
      },
    });
    if (!authRes.ok) {
      return res.status(500).json({ error: 'Auth failed' });
    }
    const auth = await authRes.json();
    const apiUrl = auth.apiUrl;
    const authToken = auth.authorizationToken;

    // List files
    const body = { bucketId, maxFileCount: 1000, delimiter: '/' };
    if (prefix) body.prefix = prefix;

    const listRes = await fetch(`${apiUrl}/b2api/v2/b2_list_file_names`, {
      method: 'POST',
      headers: { Authorization: authToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!listRes.ok) {
      return res.status(500).json({ error: 'List failed' });
    }
    const data = await listRes.json();

    const allFiles = data.files || [];
    const dirFiles = allFiles.filter(f =>
      f.contentType === 'application/x-directory' || f.fileName.endsWith('/')
    );

    // Build folder list
    const folderPrefixes = dirFiles.map(f => f.fileName);
    const folders = folderPrefixes.map(p => ({
      type: 'folder',
      name: p.replace(prefix, '').replace(/\/$/, ''),
      prefix: p.endsWith('/') ? p : p + '/',
    })).filter(f => f.name.length > 0);

    // Audio files
    const audioFiles = allFiles
      .filter(f => f.fileName.match(/\.(mp3|flac|wav|ogg|m4a|aac)$/i))
      .map(f => ({
        type: 'file',
        name: f.fileName.replace(prefix, ''),
        fileName: f.fileName,
        size: f.contentLength,
        url: `https://f001.backblazeb2.com/file/${bucket}/${f.fileName.split('/').map(encodeURIComponent).join('/')}`,
      }));

    // JPG files — for album artwork
    const jpgFiles = allFiles
      .filter(f => f.fileName.match(/\.(jpg|jpeg|png)$/i))
      .map(f => ({
        name: f.fileName.replace(prefix, ''),
        fileName: f.fileName,
        url: `https://f001.backblazeb2.com/file/${bucket}/${f.fileName.split('/').map(encodeURIComponent).join('/')}`,
      }));

    res.status(200).json({ folders, files: audioFiles, images: jpgFiles, prefix });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
