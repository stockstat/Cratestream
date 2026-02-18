// api/browse.js — Vercel serverless function
// Browses Backblaze B2 bucket: years, albums, or tracks

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { prefix = '' } = req.query;

  const keyId  = process.env.B2_KEY_ID;
  const appKey = process.env.B2_APP_KEY;
  const bucket = process.env.B2_BUCKET_NAME;
  const endpoint = process.env.B2_ENDPOINT;

  try {
    // Step 1 — Authorize with Backblaze
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

    // Step 2 — List files with delimiter to get "folders"
    const listRes = await fetch(`${apiUrl}/b2api/v2/b2_list_file_names`, {
      method: 'POST',
      headers: {
        Authorization: authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bucketId: process.env.B2_BUCKET_ID,
        prefix: prefix,
        delimiter: '/',
        maxFileCount: 1000,
      }),
    });

    if (!listRes.ok) {
      const err = await listRes.text();
      return res.status(500).json({ error: 'List failed', detail: err });
    }

    const data = await listRes.json();

    // Folders come back as commonPrefixes, files as files
    const folders = (data.commonPrefixes || []).map(p => ({
      type: 'folder',
      name: p.replace(prefix, '').replace('/', ''),
      prefix: p,
    }));

    const files = (data.files || [])
      .filter(f => f.fileName.match(/\.(mp3|flac|wav|ogg|m4a|aac)$/i))
      .map(f => ({
        type: 'file',
        name: f.fileName.replace(prefix, ''),
        fileName: f.fileName,
        size: f.contentLength,
        url: `https://f001.backblazeb2.com/file/${bucket}/${encodeURIComponent(f.fileName).replace(/%2F/g, '/')}`,
      }));

    res.status(200).json({ folders, files, prefix });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
