// pages/api/decks/[id].js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Deck ID is required' });
  }

  try {
    // Query the DECK table, not the SLIDE table
    const deck = await prisma.deck.findUnique({
      where: { 
        id: id 
      },
      include: {
        slides: {
          orderBy: { 
            position: 'asc' 
          }
        }
      }
    });

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    res.status(200).json(deck);

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
