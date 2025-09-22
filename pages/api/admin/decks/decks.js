import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decks = await prisma.deck.findMany({
      include: {
        slides: {
          select: { id: true } // Only count slides, don't fetch full data
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data to include slide count
    const decksWithCounts = decks.map(deck => ({
      ...deck,
      slideCount: deck.slides.length,
      slides: deck.slides // Keep for count
    }));

    res.status(200).json(decksWithCounts);
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
}