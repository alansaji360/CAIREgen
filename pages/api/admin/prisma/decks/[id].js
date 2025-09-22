import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Valid Deck ID is required' });
    }

    try {
      // Delete the deck (cascades to slides via onDelete: Cascade in schema)
      await prisma.deck.delete({ where: { id } });
      return res.status(200).json({ message: 'Deck deleted successfully' });
    } catch (error) {
      console.error('Error deleting deck:', error);
      return res.status(500).json({ error: 'Failed to delete deck' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
