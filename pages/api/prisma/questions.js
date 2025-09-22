import prisma from '../../../lib/prisma'; 

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', 
    },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    const { deckId, text, slideId } = req.body;

    if (!deckId || !text) {
      console.error('Missing required fields:', { hasDeckId: !!deckId, hasText: !!text });
      return res.status(400).json({ error: 'deckId and text are required' });
    }

    console.log(`Creating question for deck "${deckId}" with text "${text.substring(0, 50)}..." and slideId ${slideId || 'none'}`);

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

    let validSlideId = undefined;
    if (slideId && Number.isInteger(slideId) && slideId > 0) {
      const slideExists = await prisma.slide.findUnique({
        where: { id: slideId }
      });
      if (slideExists) {
        validSlideId = slideId;
        console.log(`Valid slide found for slideId: ${slideId}`);
      } else {
        console.warn(`Invalid slideId ${slideId} - No matching Slide found, skipping to avoid foreign key error`);
      }
    } else if (slideId !== undefined) {
      console.warn(`Invalid slideId format (${slideId}) skipped`);
    }

    const questionData = {
      deckId,
      text,
    };
    if (validSlideId) {
      questionData.slideId = validSlideId;
    }

    const question = await prisma.question.create({
      data: questionData,
    });

    console.log(`Successfully created question with ID: ${question.id}`);

    return res.status(201).json({
      message: `Successfully created question for deck "${deckId}"`,
      questionId: question.id,
      createdAt: question.createdAt
    });

  } catch (error) {
    console.error('API Error Details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code 
    });

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

    return res.status(500).json({
      error: 'Failed to save question to database',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
