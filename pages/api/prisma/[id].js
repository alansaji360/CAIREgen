import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob'; // If using legacy upload; optional

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return res.status(400).json({ error: 'Valid Deck ID is required' });
  }

  try {
    let deck = await prisma.deck.findUnique({
      where: { id },
      include: { slides: true }, // Fetch without orderBy to get all, then sort
    });

    if (!deck) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    // New: Sort slides by numeric value in alt (e.g., "Slide 3" -> 3)
    if (deck.slides && Array.isArray(deck.slides)) {
      deck.slides.sort((a, b) => {
        const getSlideNumber = (alt) => {
          if (!alt) return 0;
          const match = alt.match(/Slide (\d+)/i); // Extract number after "Slide "
          return match ? parseInt(match[1], 10) : 0;
        };
        return getSlideNumber(a.alt) - getSlideNumber(b.alt);
      });

      // Log for debugging (remove in prod)
      console.log('Sorted slides by alt:', deck.slides.map((s, i) => ({ index: i + 1, alt: s.alt, topic: s.topic })));
    }

    // Optional: Process legacy images to Blob (from earlier integration)
    // deck = await processSlidesForBlob(deck); // Uncomment if needed

    return res.status(200).json(deck);

  } catch (error) {
    console.error('Error loading deck:', error);
    return res.status(500).json({ error: 'Failed to load presentation' });
  } finally {
    await prisma.$disconnect();
  }
}

// Optional helper (from earlier)
async function processSlidesForBlob(deck) {
  // ... (as before, for base64 to URL migration)
}
