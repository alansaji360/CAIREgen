import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { texts, targetLanguage } = req.body;
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server API key missing' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: { type: 'array', items: { type: 'string' } },
      },
    });

    const prompt = `Translate the following array of presentation narration strings into ${targetLanguage}. ` +
      `Return ONLY a valid JSON array of strings. Maintain the tone and length. ` +
      `\n\n${JSON.stringify(texts)}`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const translated = JSON.parse(responseText);
    return res.status(200).json({ translated });

  } catch (error) {
    console.error('Gemini Translation Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
