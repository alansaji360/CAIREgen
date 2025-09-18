// pages/api/admin/decks/bulk-delete.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Valid array of Deck IDs is required' });
    }

    try {
      // Bulk delete (Prisma supports deleteMany)
      await prisma.deck.deleteMany({ where: { id: { in: ids } } });
      return res.status(200).json({ message: `Deleted ${ids.length} decks` });
    } catch (error) {
      console.error('Error deleting decks:', error);
      return res.status(500).json({ error: 'Failed to delete decks' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
