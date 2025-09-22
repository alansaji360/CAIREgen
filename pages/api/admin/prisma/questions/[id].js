import prisma from '../../../../../lib/prisma';


export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    if (!id) {
      return res.status(400).json({ error: 'deckId is required' });
    }

    try {
      console.log(`Fetching deck and questions for deckId: ${id}`);

      // Query Deck with nested questions (uses schema's questions array)
      const deck = await prisma.deck.findUnique({
        where: { id: id },
        include: {
          questions: {
            include: { slide: true }, // Nested include for slide details
            orderBy: { createdAt: 'desc' } // Newest first
          }
        }
      });

      if (!deck) {
        console.log(`Deck not found for id: ${id}`);
        return res.status(404).json({ error: 'Deck not found' });
      }

      console.log(`Found ${deck.questions.length} questions for deck ${id}`);
      return res.status(200).json(deck.questions); // Return just the questions array
    } catch (error) {
      console.error('Prisma error details:', error);
      return res.status(500).json({ error: 'Failed to fetch questions', details: error.message });
    }
  } else if (req.method === 'DELETE') {
    if (!id) {
      return res.status(400).json({ error: 'questionId is required for deletion' });
    }

    try {
      await prisma.question.delete({
        where: { id: id },
      });

      return res.status(200).json({ message: 'Question deleted successfully' });
    } catch (error) {
      console.error('Prisma error details:', error);
      return res.status(500).json({ error: 'Failed to delete question', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
