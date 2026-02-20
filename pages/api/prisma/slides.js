import prisma from '../../../lib/prisma';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req, res) {
  // Add CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    console.log('Request received:', {
      method: req.method,
      bodyExists: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : []
    });

    const { slides, deckTitle, avatar, fileUrl} = req.body;

    // Enhanced validation with logging
    if (!slides) {
      console.error('No slides provided');
      return res.status(400).json({ error: 'Slides are required' });
    }

    if (!Array.isArray(slides)) {
      console.error('Slides is not an array:', typeof slides);
      return res.status(400).json({ error: 'Slides must be an array' });
    }

    if (slides.length === 0) {
      console.error('Empty slides array');
      return res.status(400).json({ error: 'At least one slide is required' });
    }

    if (!deckTitle || !deckTitle.trim()) {
      console.error('Invalid deck title:', deckTitle);
      return res.status(400).json({ error: 'Deck title is required' });
    }

    if (!avatar) {
      console.error('No avatar provided:', avatar);
      return res.status(400).json({ error: 'Avatar selection is required' });
    }

    console.log(`Creating deck "${deckTitle}" with ${slides.length} slides and avatar "${avatar}"`);

    // Validate slide data
    const validSlides = slides.map((slide, index) => {
      if (!slide.topic || !slide.content) {
        console.warn(`Slide ${index} missing topic or content:`, {
          hasTopic: !!slide.topic,
          hasContent: !!slide.content
        });
      }
      
      return {
        image: slide.image || '',
        alt: slide.alt || `${deckTitle.trim()} - Slide ${index + 1}`,
        topic: slide.topic || `Slide ${index + 1}`,
        content: slide.content || '',
      };
    });

    // Test database connection first
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return res.status(500).json({ 
        error: 'Database connection failed',
        details: dbError.message 
      });
    }

    // Create deck with slides using Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      const deck = await tx.deck.create({
        data: {
          title: deckTitle.trim(),
          avatar: avatar,
          fileUrl: fileUrl || "",
          presentationUrl: '', // Will be updated below
          slides: {
            create: validSlides
          }
        },
        include: {
          slides: true
        }
      });

      // Update with the actual presentation URL
      const baseUrl = process.env.NEXTAUTH_URL || 
                     process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                     'http://localhost:3000';
      
      const actualPresentationUrl = `${baseUrl}/?deck=${deck.id}`;
      
      const updatedDeck = await tx.deck.update({
        where: { id: deck.id },
        data: { presentationUrl: actualPresentationUrl },
        include: { slides: true }
      });

      return { deck: updatedDeck, presentationUrl: actualPresentationUrl };
    });

    console.log(`✅ Successfully created deck with ID: ${result.deck.id}`);

    // Send success response
    return res.status(201).json({
      message: `Successfully created deck "${deckTitle.trim()}" with ${result.deck.slides.length} slides.`,
      deckId: result.deck.id,
      presentationUrl: result.presentationUrl,
      slideCount: result.deck.slides.length
    });

  } catch (error) {
    console.error('API Error Details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Duplicate entry detected',
        details: error.message 
      });
    }

    if (error.code?.startsWith('P')) {
      return res.status(500).json({ 
        error: 'Database operation failed',
        details: `Prisma error: ${error.message}` 
      });
    }

    // Generic error response
    return res.status(500).json({ 
      error: 'Failed to save deck to database',
      details: error.message 
    });
  } finally {
    // Ensure database connection is closed
    await prisma.$disconnect();
  }
}
