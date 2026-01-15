import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slides, language } = req.body;
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server API key missing' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: { type: 'array', items: { type: 'string' } },
      },
    });

    const batchSummaries = slides
      .map((slide, i) => `Slide ${i + 1}: Topic - ${slide.topic}. Content - ${slide.content}`)
      .join('\n');

    const prompt =
      `Generate an engaging narration script in ${language.toUpperCase()} based on the following slide contents: ${batchSummaries}. ` +
      `For each slide, create one in-depth narrative paragraph (4-6 sentences) that expands beyond just restating the bullets by weaving them into a cohesive lesson.` +
      `thoroughly explain the topic with historical or contextual background, incorporate relevant examples or analogies, discuss implications or real-world applications, and end with key takeaways or reflective questions. Additionally make sure to explain any math or equations that are pertinant to the discussion. ` +
      `Ensure the tone is informative, academic yet approachable, like a professor teaching a class, and make it flow naturally for spoken narration. ` +
      `Convert all numerical values, hexadecimal notations, addresses, or technical figures to their full spoken-word form for clear pronunciation (e.g., "0x0008" as "hex zero zero zero eight", "1024" as "one thousand twenty-four"). ` +
      `Additionally convert coding variable names to full spoken-word form. additionaly when describing functions, use f of x for f(x) and other similar notation.` +
      `Do not start any narrations mentioning the page/slide number. Start each slide naturally in the manner of a college professor.` +
      `Output ONLY a JSON array of strings, with no additional text, explanations, or Markdown formatting. The array MUST have exactly ${slides.length} items, one for each slide in this batch.`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    responseText = responseText.replace(/``````/g, '').trim();
    
    let script;
    try {
      script = JSON.parse(responseText);
    } catch (e) {
      script = [];
    }

    return res.status(200).json({ script });

  } catch (error) {
    console.error('Gemini Generation Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
