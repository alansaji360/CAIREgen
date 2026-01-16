import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body;

  try {
    const user = await prisma.credentials.findUnique({
      where: { username },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Set a secure HTTP-only cookie
      const cookie = serialize('admin_session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
      });

      res.setHeader('Set-Cookie', cookie);
      return res.status(200).json({ success: true });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
