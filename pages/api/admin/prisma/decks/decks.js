import prisma from '../../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decks = await prisma.deck.findMany({
      include: {
        slides: true, 
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Sort the slides for each deck numerically after fetching.
    decks.forEach((deck) => {
      if (deck.slides && Array.isArray(deck.slides)) {
        deck.slides.sort((a, b) => {
          const getSlideNumber = (alt) => {
            if (!alt) return 0;
            const match = alt.match(/Slide (\d+)/i);
            return match ? parseInt(match[1], 10) : 0;
          };
          return getSlideNumber(a.alt) - getSlideNumber(b.alt);
        });
      }
    });

    res.status(200).json(decks);

  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
}
