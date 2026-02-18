// api/browse.js — Vercel serverless function
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { prefix = '' } = req.query;

  const keyId    = process.env.B2_KEY_ID;
  const appKey   = process.env.B2_APP_KEY;
  const bucket   = process.env.B2_BUCKET_NAME;
  const bucketId = process.env.B2_BUCKET_ID;

  try {
    // Step 1 — Authorize with v2 (more compatible)
    const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${keyId}:${appKey}`).toString('base64'),
      },
    });

    if (!authRes.ok) {
      const err = await authRes.text();
      return res.status(500).json({ error: 'Auth failed', detail: err });
    }

    const auth = await authRes.json();
    const apiUrl = auth.apiUrl;
    const authToken = auth.authorizationToken;

    // Step 2 — List with delimiter to get virtual folders
    const body = {
      bucketId: bucketId,
      maxFileCount: 1000,
    };

    // Only add prefix if non-empty
    if (prefix) body.prefix = prefix;
    
    // Add delimiter to get folder-like grouping
    body.delimiter = '/';

    const listRes = await fetch(`${apiUrl}/b2api/v2/b2_list_file_names`, {
      method: 'POST',
      headers: {
        Authorization: authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!listRes.ok) {
      const err = await listRes.text();
      return res.status(500).json({ error: 'List failed', detail: err });
    }

    const data = await listRes.json();

    // B2 returns folders as files with contentType "application/x-directory"
    // AND as commonPrefixes when delimiter is set
    const commonPrefixes = data.commonPrefixes || [];
    const allFiles = data.files || [];

    // Separate real folders from real files
    const dirFiles = allFiles.filter(f =>
      f.contentType === 'application/x-directory' || f.fileName.endsWith('/')
    );
    const audioFiles = allFiles.filter(f =>
      f.fileName.match(/\.(mp3|flac|wav|ogg|m4a|aac)$/i)
    );

    // Build folder list from commonPrefixes first, then fall back to dir files
    let folderPrefixes = commonPrefixes.length > 0
      ? commonPrefixes
      : dirFiles.map(f => f.fileName);

    const folders = folderPrefixes.map(p => ({
      type: 'folder',
      name: p.replace(prefix, '').replace(/\/$/, ''),
      prefix: p.endsWith('/') ? p : p + '/',
    })).filter(f => f.name.length > 0);

    const files = audioFiles.map(f => ({
      type: 'file',
      name: f.fileName.replace(prefix, ''),
      fileName: f.fileName,
      size: f.contentLength,
      url: `https://f001.backblazeb2.com/file/${bucket}/${f.fileName.split('/').map(encodeURIComponent).join('/')}`,
    }));

    res.status(200).json({
      folders,
      files,
      prefix,
      debug: {
        commonPrefixCount: commonPrefixes.length,
        dirFileCount: dirFiles.length,
        audioFileCount: audioFiles.length,
        totalReturned: allFiles.length,
        rawCommonPrefixes: commonPrefixes.slice(0, 5),
        rawFirstFiles: allFiles.slice(0, 3).map(f => ({ name: f.fileName, type: f.contentType })),
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
