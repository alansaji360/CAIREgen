import { del } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ids } = req.body; // Expecting an array of deck IDs

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'Invalid IDs provided' });
  }

  try {
    const decks = await prisma.deck.findMany({
      where: { id: { in: ids } },
      include: { slides: true }
    });

    const urlsToDelete = [];

    decks.forEach(deck => {
      if (deck.fileUrl) urlsToDelete.push(deck.fileUrl);
    });

    if (urlsToDelete.length > 0) {
      console.log(`Bulk deleting ${urlsToDelete.length} files from Vercel Blob...`);
      await del(urlsToDelete);
    }

    return res.status(200).json({ 
      success: true, 
      count: decks.length,
      filesDeleted: urlsToDelete.length 
    });

  } catch (error) {
    console.error('Bulk Delete Error:', error);
    return res.status(500).json({ error: error.message });
  }
}