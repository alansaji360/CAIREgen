import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: deckId } = req.query;

  try {
    // Delete deck (slides will be deleted automatically due to CASCADE)
    const deletedDeck = await prisma.deck.delete({
      where: { id: deckId },
      include: {
        slides: true
      }
    });

    res.status(200).json({ 
      message: `Successfully deleted deck "${deletedDeck.title}" and ${deletedDeck.slides.length} slides`,
      deletedDeck 
    });
  } catch (error) {
    console.error('Error deleting deck:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete deck' });
  }
}