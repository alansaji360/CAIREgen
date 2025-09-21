// pages/api/decks/[id].js (renamed to [id].js)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  // Enhanced validation: Check for undefined or invalid ID
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return res.status(400).json({ error: 'Valid Deck ID is required' });
  }

  try {
    // Fetch the deck with its related slides
    const deck = await prisma.deck.findUnique({
      where: { id }, // Now safe since id is validated
      include: { slides: true },
    });

    if (!deck) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    return res.status(200).json(deck);

  } catch (error) {
    console.error('Error loading deck:', error);
    return res.status(500).json({ error: 'Failed to load presentation' });
  } finally {
    await prisma.$disconnect();
  }
}