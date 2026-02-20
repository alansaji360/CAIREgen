import { del } from '@vercel/blob'; 

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      const deck = await prisma.deck.findUnique({
        where: { id: String(id) },
        select: { fileUrl: true }
      });
      
      console.log(deck.fileUrl)
      if (deck?.fileUrl) {
        await del(deck.fileUrl); 
      }

      return res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}