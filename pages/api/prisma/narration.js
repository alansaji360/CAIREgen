import prisma from '../../../lib/prisma';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  else if (req.method === 'GET') {
    const { deckId, language, includeSlide } = req.query;
    if (!deckId) return res.status(400).json({ error: 'deckId is required' });

    try {
      const slides = await prisma.slide.findMany({
        where: { deckId: String(deckId) },
        select: { id: true },
      });

      if (!slides.length) return res.status(200).json({ narrations: [] });

      const narrations = await prisma.narration.findMany({
        where: {
          slide: { deckId: String(deckId) },
          isActive: true,
          ...(language ? { language: String(language) } : {}),
        },
        select: {
          id: true,
          slideId: true,
          language: true,
          text: true,
          isActive: true,
          version: true,
          status: true,
          ...(includeSlide === 'true' ? { slide: true } : {}),
        },
        orderBy: [{ slideId: 'asc' }, { version: 'desc' }],
      });

      return res.status(200).json({ narrations });
    } catch (error) {
      console.error('GET narrations error:', error);
      return res.status(500).json({ error: 'Failed to fetch narrations', details: error.message });
    }
  }

  if (req.method == 'POST') {
    try {
      console.log('Request received:', {
        method: req.method,
        bodyExists: !!req.body,
        bodyKeys: req.body ? Object.keys(req.body) : []
      });

      const isBatchShape = Array.isArray(req.body?.items);
      const deckId = req.body?.deckId || null;
      const overwrite = !!req.body?.overwrite;

      let items = [];
      if (isBatchShape) {
        items = req.body.items || [];
      } else {
        const { slideId, text, language = req.body?.language || 'en' } = req.body || {};
        if (!slideId || !text) {
          console.error('Missing required fields for single item', { slideId, hasText: !!text });
          return res.status(400).json({ error: 'slideId and text are required' });
        }
        items = [{ slideId, text, language }];
      }

      if (!items.length) {
        return res.status(400).json({ error: 'No narration items provided' });
      }

      for (const it of items) {
        if (!Number.isInteger(it.slideId) || it.slideId <= 0) {
          return res.status(400).json({ error: `Invalid slideId: ${it.slideId}` });
        }
        if (typeof it.text !== 'string' || it.text.trim().length === 0) {
          return res.status(400).json({ error: `Invalid text for slideId ${it.slideId}` });
        }
        if (it.text.length > 4000) {
          return res.status(413).json({ error: `Text too long for slideId ${it.slideId}` });
        }
        if (it.language && typeof it.language !== 'string') {
          return res.status(400).json({ error: `Invalid language for slideId ${it.slideId}` });
        }
        if (!it.language) it.language = 'en';
      }

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

      if (deckId) {
        const slideIds = items.map(i => i.slideId);
        const slides = await prisma.slide.findMany({
          where: { id: { in: slideIds } },
          select: { id: true, deckId: true },
        });
        const invalid = slides.filter(s => s.deckId !== deckId);
        if (invalid.length) {
          return res.status(400).json({ error: `One or more slides do not belong to deck ${deckId}` });
        }
      }

      const results = [];
      for (const it of items) {
        try {
          if (overwrite) {
            await prisma.narration.updateMany({
              where: { slideId: it.slideId, language: it.language, isActive: true },
              data: { isActive: false },
            });
          }

          let existing = await prisma.narration.findFirst({
            where: { slideId: it.slideId, language: it.language, isActive: true },
          });

          let saved;
          if (existing && !overwrite) {
            const nextVersion = it.text !== existing.text ? existing.version + 1 : existing.version;
            saved = await prisma.narration.update({
              where: { id: existing.id },
              data: {
                text: it.text,
                version: nextVersion,
                status: 'ready',
              },
            });
          } else {
            const baseVersion = existing ? existing.version + 1 : 1;
            saved = await prisma.narration.create({
              data: {
                slideId: it.slideId,
                language: it.language,
                text: it.text,
                isActive: true,
                status: 'ready',
                version: baseVersion,
                model: 'manual', // marker since generation is done outside
              },
            });
          }

          results.push({ slideId: it.slideId, narrationId: saved.id, status: 'ok' });
        } catch (e) {
          console.error('Save narration error', it.slideId, e);
          results.push({ slideId: it.slideId, status: 'error', error: e?.message || 'save failed' });
        }
      }

      return res.status(201).json({
        message: `Processed ${results.length} narration item(s)`,
        results,
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
        error: 'Failed to persist narration(s)',
        details: error.message
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  else{
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
