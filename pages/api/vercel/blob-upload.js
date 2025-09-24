// pages/api/blob-upload.js
import { put } from '@vercel/blob';

export const config = {
  api: { bodyParser: false }, // we need the raw stream
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const { filename } = req.query;
    const safeName = typeof filename === 'string' && filename.trim() ? filename.trim() : 'upload.bin';

    // forward the raw request stream to Vercel Blob
    const blob = await put(safeName, req, {
      access: 'public',
      addRandomSuffix: true,
    });

    return res.status(200).json({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      contentType: blob.contentType || null
    });
  } catch (err) {
    console.error('Blob upload error:', err);
    return res.status(500).json({ error: 'Blob upload failed', details: err.message });
  }
}
