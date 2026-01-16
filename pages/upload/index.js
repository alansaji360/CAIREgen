import React, { useState, useRef } from 'react';
import { Figtree } from 'next/font/google';
import { useRouter } from 'next/router';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configure Figtree font
const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
});


async function fetchSlidesForDeck(deckId) {
  // Minimal deck slides fetch; adjust path to your existing read endpoint if different
  const res = await fetch(`/api/prisma/${deckId}`);
  if (!res.ok) throw new Error(`Failed to fetch slides for deck ${deckId}`);
  const data = await res.json();
  // Expecting { slides: [...] } or deck object with slides; normalize:
  return data.slides || data?.deck?.slides || [];
}

async function persistNarrations(items, deckId, overwrite = true) {
  const res = await fetch('/api/prisma/narration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deckId,
      overwrite,
      items, // [{ slideId, text, language }]
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Persist failed (${res.status}): ${t}`);
  }
  return res.json();
}

async function generateNarrationsClient(slides, selectedLanguage, appendLog) {
  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    appendLog('Gemini API key missing. Add it to .env');
    throw new Error('Missing Gemini API key');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: { type: 'array', items: { type: 'string' } },
    },
  });

  const batchSize = 10;
  const batches = [];
  for (let i = 0; i < slides.length; i += batchSize) {
    batches.push(slides.slice(i, i + batchSize));
  }

  let fullScript = [];
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchSummaries = batch
      .map((slide, i) => `Slide ${batchIndex * batchSize + i + 1}: Topic - ${slide.topic}. Content - ${slide.content}`)
      .join('\n');

    const prompt =
      `Generate an engaging narration script in ${selectedLanguage.toUpperCase()} based on the following slide contents: ${batchSummaries}. ` +
      `For each slide, create one in-depth narrative paragraph (4-6 sentences) that expands beyond just restating the bullets by weaving them into a cohesive lesson.` +
      `thoroughly explain the topic with historical or contextual background, incorporate relevant examples or analogies, discuss implications or real-world applications, and end with key takeaways or reflective questions. Additionally make sure to explain any math or equations that are pertinant to the discussion. ` +
      `Ensure the tone is informative, academic yet approachable, like a professor teaching a class, and make it flow naturally for spoken narration. ` +
      `Convert all numerical values, hexadecimal notations, addresses, or technical figures to their full spoken-word form for clear pronunciation (e.g., "0x0008" as "hex zero zero zero eight", "1024" as "one thousand twenty-four"). ` +
      `Additionally convert coding variable names to full spoken-word form. additionaly when describing functions, use f of x for f(x) and other similar notation.` +
      `Do not start any narrations mentioning the page/slide number. Start each slide naturally in the manner of a college professor.` +
      `Output ONLY a JSON array of strings, with no additional text, explanations, or Markdown formatting. The array MUST have exactly ${batch.length} items, one for each slide in this batch.`;

    const attemptGeneration = async (attempt = 1) => {
      try {
        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        responseText = responseText.replace(/``````/g, '').trim();
        let script = JSON.parse(responseText);

        if (script.length < batch.length) {
          appendLog(`⚠️ Batch ${batchIndex + 1} script too short (${script.length}/${batch.length}) - Padding`);
          const missing = batch.length - script.length;
          script = [...script, ...Array(missing).fill('Narration generation incomplete - Regenerating...')];
        } else if (script.length > batch.length) {
          appendLog(`⚠️ Batch ${batchIndex + 1} script too long (${script.length}/${batch.length}) - Truncating`);
          script = script.slice(0, batch.length);
        }

        return script;
      } catch (error) {
        appendLog(`Gemini error on batch ${batchIndex + 1} attempt ${attempt}: ${error.message}`);
        if (attempt < 2) {
          appendLog(`Retrying batch ${batchIndex + 1}...`);
          return attemptGeneration(attempt + 1);
        }
        return Array(batch.length).fill('Error generating narration - Please try regenerating');
      }
    };

    const batchScript = await attemptGeneration();
    fullScript = [...fullScript, ...batchScript];
  }

  return fullScript;
}

async function translateNarrationsClient(sourceScript, targetLanguage, appendLog) {
  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    appendLog('Gemini API key missing for translation.');
    return sourceScript;
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: { type: 'array', items: { type: 'string' } },
    },
  });

  const batchSize = 10;
  const batches = [];
  for (let i = 0; i < sourceScript.length; i += batchSize) {
    batches.push(sourceScript.slice(i, i + batchSize));
  }

  let fullTranslated = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const prompt = `Translate the following array of presentation narration strings into ${targetLanguage}. ` +
      `Return ONLY a valid JSON array of strings. Maintain the tone and length. ` +
      `\n\n${JSON.stringify(batch)}`;

    try {
      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const json = JSON.parse(responseText);
      fullTranslated = [...fullTranslated, ...json];
    } catch (error) {
      appendLog(`Translation error batch ${i + 1}: ${error.message}`);
      fullTranslated = [...fullTranslated, ...batch]; // Fallback to original
    }
  }
  return fullTranslated;
}

export default function SlideManager() {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deckTitle, setDeckTitle] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedSlides, setExtractedSlides] = useState([]);
  const [manualSlides, setManualSlides] = useState([
    { topic: '', content: '', image: '' }
  ]);
  const [activeTab, setActiveTab] = useState('pdf');
  const [presentationUrl, setPresentationUrl] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');

  const fileInputRef = useRef(null);

  const router = useRouter();
  
  // Predefined avatars
  const availableAvatars = [
    { id: 'avatar1', name: '1', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM0Yjc0OGYiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNCA1MmMwLTEwIDgtMTggMTgtMThzMTggOCAxOCAxOCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+' },
    { id: 'avatar2', name: '2', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNmNGE2NjEiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNCA1MmMwLTEwIDgtMTggMTgtMThzMTggOCAxOCAxOCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+' },
    { id: 'avatar3', name: '3', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM5YjU5YjYiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNCA1MmMwLTEwIDgtMTggMTgtMThzMTggOCAxOCAxOCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+' },
    { id: 'avatar4', name: '4', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiMyZGE0NGUiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNCA1MmMwLTEwIDgtMTggMTgtMThzMTggOCAxOCAxOCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+' }
  ];

  const appendLog = (msg) => setStatus(`[${new Date().toLocaleTimeString()}] ${msg}`);

  // Handle PDF upload and parsing
  const handlePDFUpload = (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      appendLog('Please upload a valid PDF file');
      return;
    }
    setUploadedFile(file);
    setExtractedSlides([]); // Clear previous slides
  };

  // Process PDF file using pdfjs-dist
  React.useEffect(() => {
    if (!uploadedFile) return;

    const processFile = async () => {
      setIsLoading(true);
      appendLog('Parsing PDF file...');

      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

        const arrayBuffer = await uploadedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        if (pdf.numPages === 0) {
          appendLog('PDF has no pages');
          return;
        }

        const slides = [];
        const targetWidth = 1494;

        for (let i = 1; i <= pdf.numPages; i++) {
          appendLog(`- Processing page ${i} of ${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          const scale = Math.min(targetWidth / viewport.width, 1.6);
          const scaledViewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = scaledViewport.width;
          canvas.height = scaledViewport.height;
          const ctx = canvas.getContext('2d');

          await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
          const dataUrl = canvas.toDataURL('image/png');

          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();

          slides.push({
            image: dataUrl,
            alt: `PDF page ${i}`,
            topic: `Page ${i}`,
            content: pageText
          });
        }

        appendLog(`PDF parsed successfully. ${slides.length} slides extracted.`);
        setExtractedSlides(slides);

      } catch (error) {
        appendLog(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
        setUploadedFile(null);
      }
    };

    processFile();
  }, [uploadedFile]);

  // Manual slide management functions
  const addManualSlide = () => {
    setManualSlides([...manualSlides, { topic: '', content: '', image: '' }]);
  };

  const removeManualSlide = (index) => {
    if (manualSlides.length > 1) {
      setManualSlides(manualSlides.filter((_, i) => i !== index));
    }
  };

  const updateManualSlide = (index, field, value) => {
    const updatedSlides = manualSlides.map((slide, i) =>
      i === index ? { ...slide, [field]: value } : slide
    );
    setManualSlides(updatedSlides);
  };

  const handleImageUpload = (index, event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      appendLog('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      updateManualSlide(index, 'image', e.target.result);
    };
    reader.readAsDataURL(file);
  };

  async function uploadToBlob(file) {
    const qs = new URLSearchParams({ filename: file.name });
    const res = await fetch(`/api/vercel/blob-upload?${qs.toString()}`, {
      method: 'POST',
      body: file, // raw stream
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Blob upload failed: ${res.status} ${text}`);
    }
    return res.json(); // { url, pathname, size, contentType }
  }

  // Create slide deck (UPDATED FOR NEW API)
  const createSlideDeck = async () => {
    setIsLoading(true);
    appendLog('Creating slide deck...');

    try {
      // Validate inputs
      if (!deckTitle.trim()) throw new Error('Please enter a deck title');
      if (!selectedAvatar) throw new Error('Please select an avatar');

      // 1) If user selected a PDF but you haven't uploaded it to Blob yet, upload it now.
      //    The parsing is already done in your effect, so uploadedFile is null by now.
      //    If you want to upload the original file to Blob at selection time instead, move this into handlePDFUpload.
      if (!uploadedFileUrl && fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        appendLog(`Uploading original PDF "${file.name}" to Blob...`);
        const blobInfo = await uploadToBlob(file);
        setUploadedFileUrl(blobInfo.url);
        appendLog(`Blob stored: ${blobInfo.url}`);
      }

      // 2) Build slide metadata to send — keep as small as reasonable.
      let slidesToUpload = [];

      if (activeTab === 'pdf' && extractedSlides.length > 0) {
        slidesToUpload = extractedSlides.map((slide, index) => ({
          image: slide.image, // consider trimming images or deferring image generation server-side if size is large
          alt: `${deckTitle} - Slide ${index + 1}`,
          topic: slide.topic,
          content: slide.content
        }));
      } else if (activeTab === 'manual') {
        const validSlides = manualSlides.filter(slide => slide.topic.trim() && slide.content.trim());
        if (validSlides.length === 0) throw new Error('Please add at least one slide with topic and content');

        slidesToUpload = validSlides.map((slide, index) => ({
          image: slide.image || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
          alt: `${deckTitle} - Slide ${index + 1}`,
          topic: slide.topic.trim(),
          content: slide.content.trim()
        }));
      } else {
        throw new Error('No slides to upload');
      }

      appendLog('Sending deck data to server...');

      // 3) Call your existing slides API with small JSON:
      //    IMPORTANT: Include fileUrl (original PDF Blob URL) so you don’t need to POST the PDF body.
      const response = await fetch('/api/prisma/slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: slidesToUpload,
          deckTitle: deckTitle.trim(),
          avatar: selectedAvatar,
          fileUrl: uploadedFileUrl || null // include the blob URL if available
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorPayload = "Could not retrieve error details.";
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorPayload = errorData.error || JSON.stringify(errorData);
        } else {
          errorPayload = await response.text();
        }
        throw new Error(`Server responded with status ${response.status}. Details: ${errorPayload}`);
      }

      const result = await response.json();
      appendLog(`${result.message}`);

      // Generate presentation URL
      

      const language = 'en';

      appendLog('Fetching created slides...');
      const createdSlides = await fetchSlidesForDeck(result.deckId); // same helper as before
      appendLog(`Generating narration for ${createdSlides.length} slides...`);

      const narrationsArray = await generateNarrationsClient(createdSlides, language, appendLog);
      
      let items = createdSlides.map((s, idx) => ({
        slideId: s.id,
        text: narrationsArray[idx] || 'Narration unavailable.',
        language,
      }));

      // Translate to other languages
      const targetLanguages = ['es', 'fr', 'zh', 'ar'];
      for (const targetLang of targetLanguages) {
        appendLog(`Translating narrations to ${targetLang}...`);
        const translatedArray = await translateNarrationsClient(narrationsArray, targetLang, appendLog);
        
        const translatedItems = createdSlides.map((s, idx) => ({
          slideId: s.id,
          text: translatedArray[idx] || 'Translation unavailable',
          language: targetLang
        }));
        
        items = [...items, ...translatedItems];
      }

      appendLog('Saving narrations to database...');
      appendLog(`Saving ${items.length} narrations to database...`);
      const saveRes = await persistNarrations(items, result.deckId, true); // overwrite = true to set as active
      const okCount = (saveRes?.results || []).filter(r => r.status === 'ok').length;
      appendLog(`Narrations saved (${okCount}/${items.length})`);

      if (result.deckId) {
        const url = `${window.location.origin}/student/?deck=${result.deckId}`;
        setPresentationUrl(url);
        appendLog(`🔗 Presentation URL: ${url}`);
      }
      
      // Reset form on success
      setDeckTitle('');
      setSelectedAvatar('');
      setExtractedSlides([]);
      setManualSlides([{ topic: '', content: '', image: '' }]);
      setUploadedFileUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error) {
      console.error('Slide deck creation error:', error);
      appendLog(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout');
    router.push('/login');
  };

  return (
    <div className={figtree.variable} style={{ padding: '2rem', maxWidth: '900px', margin: 'auto', fontFamily: 'var(--font-figtree)', background: 'linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%)', borderRadius: '15px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', fontSize: '3rem', fontWeight: '300', position: 'relative', marginBottom: '1.3rem' }}>Deck Upload</h1>
      <div style={{ width: '60px', height: '3px', backgroundColor: '#0070f3', margin: '0 auto 1rem auto' }}></div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <a href="/admin" style={{
          padding: '8px 16px',
          backgroundColor: '#e27d2aff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
        }}>
          Admin
        </a>
        <a href="/" style={{
          padding: '8px 16px',
          backgroundColor: '#0070f3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
        }}>
          Home
        </a>
        <button onClick={handleLogout} style={{
          padding: '8px 16px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 'inherit'
        }}>
          Logout
        </button>
      </div>
      {/* Deck Settings */}
      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        borderRadius: '8px',
        backgroundColor: '#f6f7fa',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Deck Parameters</h2>

        {/* Deck Title */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Deck Title:
          </label>
          <input
            type="text"
            value={deckTitle}
            onChange={(e) => setDeckTitle(e.target.value)}
            placeholder="Enter slide deck title..."
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Avatar Selection */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Choose Avatar:
          </label>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {availableAvatars.map((avatar) => (
              <div
                key={avatar.id}
                onClick={() => setSelectedAvatar(avatar.id)}
                style={{
                  padding: '0.5rem',
                  border: selectedAvatar === avatar.id ? '3px solid #007bff' : '2px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  backgroundColor: selectedAvatar === avatar.id ? '#e3f2fd' : 'white'
                }}
              >
                <img
                  src={avatar.image}
                  alt={avatar.name}
                  style={{ width: '48px', height: '48px', marginBottom: '0.5rem' }}
                />
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{avatar.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0' }}>
          <button
            onClick={() => setActiveTab('pdf')}
            style={{
              padding: '12px 24px',
              border: '1px solid #ddd',
              borderBottom: activeTab === 'pdf' ? '3px solid #28a745' : '1px solid #ddd',
              backgroundColor: activeTab === 'pdf' ? '#f8fff9' : 'white',
              cursor: 'pointer',
              borderTopLeftRadius: '0',
              borderTopRightRadius: '6px'
            }}
          >
            PDF Upload
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            style={{
              padding: '12px 24px',
              border: '1px solid #ddd',
              borderBottom: activeTab === 'manual' ? '3px solid #28a745' : '1px solid #ddd',
              backgroundColor: activeTab === 'manual' ? '#f8fff9' : 'white',
              cursor: 'pointer',
              borderTopLeftRadius: '6px',
              borderTopRightRadius: '0'
            }}
          >
            Manual Entry
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'pdf' && (
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          borderRadius: '8px',
          backgroundColor: '#f6f7fa',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Upload PDF</h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handlePDFUpload}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              backgroundColor: 'white',
              boxSizing: 'border-box'
            }}
          />

          {extractedSlides.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontWeight: 'bold', color: '#28a745' }}>
                ✅ {extractedSlides.length} slides extracted from PDF
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {extractedSlides.slice(0, 6).map((slide, index) => (
                  <div key={index} style={{
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    backgroundColor: 'white'
                  }}>
                    <img
                      src={slide.image}
                      alt={slide.alt}
                      style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                    />
                    <div style={{ padding: '0.5rem' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{slide.topic}</div>
                      <div style={{ fontSize: '10px', color: '#666', marginTop: '0.25rem' }}>
                        {slide.content.substring(0, 50)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {extractedSlides.length > 6 && (
                <p style={{ textAlign: 'center', color: '#666', marginTop: '0.5rem' }}>
                  ...and {extractedSlides.length - 6} more slides
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'manual' && (
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          borderRadius: '8px',
          backgroundColor: '#f6f7fa',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Manual Slide Entry</h2>

          {manualSlides.map((slide, index) => (
            <div key={index} style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              backgroundColor: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Slide {index + 1}</h3>
                {manualSlides.length > 1 && (
                  <button
                    onClick={() => removeManualSlide(index)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Topic:
                </label>
                <input
                  type="text"
                  value={slide.topic}
                  onChange={(e) => updateManualSlide(index, 'topic', e.target.value)}
                  placeholder="Enter slide topic..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Content:
                </label>
                <textarea
                  value={slide.content}
                  onChange={(e) => updateManualSlide(index, 'content', e.target.value)}
                  placeholder="Enter slide content..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Image (optional):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(index, e)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
                {slide.image && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img
                      src={slide.image}
                      alt="Preview"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '150px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={addManualSlide}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginRight: '1rem'
            }}
          >
            + Add Slide
          </button>
        </div>
      )}

      {/* Create Button */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <button
          onClick={createSlideDeck}
          disabled={isLoading || !selectedAvatar || !deckTitle}
          style={{
            padding: '15px 30px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            cursor: (isLoading || !selectedAvatar || !deckTitle) ? 'not-allowed' : 'pointer',
            opacity: (isLoading || !selectedAvatar || !deckTitle) ? 0.6 : 1
          }}
        >
          {isLoading ? 'Creating...' : 'Create Slide Deck'}
        </button>
      </div>

      {/* SUCCESS MESSAGE WITH PRESENTATION URL */}
      {presentationUrl && (
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          borderRadius: '8px',
          backgroundColor: '#d4edda',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h2>🎉 Deck Created Successfully!</h2>
          <p style={{ marginBottom: '1rem' }}>Your presentation is ready. Use this link:</p>
          <div style={{
            padding: '1rem',
            backgroundColor: 'white',
            borderRadius: '5px',
            border: '1px solid #ddd',
            marginBottom: '1rem'
          }}>
            <a
              href={presentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#0070f3',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              {presentationUrl}
            </a>
          </div>
          <a
            href={presentationUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 12px',
              backgroundColor: '#17a2b8',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            View
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(presentationUrl);
              appendLog('📋 URL copied to clipboard');
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              position: 'relative'
            }}
          >
            📋 Copy Link
          </button>

        </div>
      )}

      {/* Status Display */}
      <div style={{
        padding: '1rem',
        border: '1px solid #ccc',
        borderRadius: '5px',
        backgroundColor: '#e9edf1ff',
        fontFamily: 'monospace',
        fontSize: '14px',
        maxHeight: '300px',
        overflowY: 'auto',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h3>Status:</h3>
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {status || 'Ready to create slides...'}
        </div>
      </div>
    </div>
  );
}
