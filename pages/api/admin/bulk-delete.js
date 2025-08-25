import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Invalid ids array' });
  }

  try {
    // Delete multiple decks (slides will be deleted automatically due to CASCADE)
    const result = await prisma.deck.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    res.status(200).json({ 
      message: `Successfully deleted ${result.count} decks`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error bulk deleting decks:', error);
    res.status(500).json({ error: 'Failed to delete decks' });
  }
}