import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { deckId, text, slideId } = req.body; // slideId optional
    try {
      const question = await prisma.question.create({
        data: { deckId, text, slideId },
      });
      res.status(201).json(question);
    } catch (error) {
      res.status(500).json({ error: 'Failed to store question' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
