import React, { useState, useRef } from 'react';
import { Figtree } from 'next/font/google';

// Configure Figtree font
const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
});

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
  
  const fileInputRef = useRef(null);

  // Predefined avatars
  const availableAvatars = [
    { id: 'avatar1', name: 'Professional', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM0Yjc0OGYiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNCA1MmMwLTEwIDgtMTggMTgtMThzMTggOCAxOCAxOCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+' },
    { id: 'avatar2', name: 'Friendly', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNmNGE2NjEiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNCA1MmMwLTEwIDgtMTggMTgtMThzMTggOCAxOCAxOCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+' },
    { id: 'avatar3', name: 'Creative', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM5YjU5YjYiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNCA1MmMwLTEwIDgtMTggMTgtMThzMTggOCAxOCAxOCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+' },
    { id: 'avatar4', name: 'Tech', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiMyZGE0NGUiLz4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNCA1MmMwLTEwIDgtMTggMTgtMThzMTggOCAxOCAxOCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+' }
  ];

  const appendLog = (msg) => setStatus(`[${new Date().toLocaleTimeString()}] ${msg}`);

  // Handle PDF upload and parsing
  const handlePDFUpload = (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      appendLog('❌ Please upload a valid PDF file');
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
      appendLog('📂 Parsing PDF file...');
      
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

        const arrayBuffer = await uploadedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        if (pdf.numPages === 0) {
          appendLog('❌ PDF has no pages');
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
        
        appendLog(`✅ PDF parsed successfully. ${slides.length} slides extracted.`);
        setExtractedSlides(slides);

      } catch (error) {
        appendLog(`❌ Error: ${error.message}`);
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
      appendLog('❌ Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      updateManualSlide(index, 'image', e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Create slide deck (UPDATED FOR NEW API)
  const createSlideDeck = async () => {
    setIsLoading(true);
    appendLog('Creating slide deck...');

    try {
      // Validate inputs
      if (!deckTitle.trim()) {
        throw new Error('Please enter a deck title');
      }

      if (!selectedAvatar) {
        throw new Error('Please select an avatar');
      }

      let slidesToUpload = [];

      if (activeTab === 'pdf' && extractedSlides.length > 0) {
        slidesToUpload = extractedSlides.map((slide, index) => ({
          image: slide.image,
          alt: `${deckTitle} - Slide ${index + 1}`,
          topic: slide.topic,
          content: slide.content
        }));
      } else if (activeTab === 'manual') {
        const validSlides = manualSlides.filter(slide => 
          slide.topic.trim() && slide.content.trim()
        );

        if (validSlides.length === 0) {
          throw new Error('Please add at least one slide with topic and content');
        }

        slidesToUpload = validSlides.map((slide, index) => ({
          image: slide.image || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
          alt: `${deckTitle} - Slide ${index + 1}`,
          topic: slide.topic.trim(),
          content: slide.content.trim()
        }));
      } else {
        throw new Error('No slides to upload');
      }

      appendLog(`Sending deck data to server...`);
      
      const response = await fetch('/api/slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: slidesToUpload,
          deckTitle: deckTitle.trim(),
          avatar: selectedAvatar
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
      appendLog(`✅ ${result.message}`);
      
      // GENERATE PRESENTATION URL
      if (result.deckId) {
        const presentationUrl = `${window.location.origin}/student/?deck=${result.deckId}`;
        setPresentationUrl(presentationUrl);
        appendLog(`🔗 Presentation URL: ${presentationUrl}`);
      }
      
      // Reset form on success
      setDeckTitle('');
      setSelectedAvatar('');
      setExtractedSlides([]);
      setManualSlides([{ topic: '', content: '', image: '' }]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Slide deck creation error:', error);
      appendLog(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={figtree.variable} style={{ padding: '2rem', maxWidth: '900px', margin: 'auto', fontFamily: 'var(--font-figtree)', background: 'linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%)', borderRadius: '15px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', fontSize: '3rem', fontWeight: '300', position: 'relative', marginBottom: '1.3rem' }}>📊 Slide Deck Creator</h1>
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
      </div>
      {/* Deck Settings */}
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1.5rem', 
        borderRadius: '8px',
        backgroundColor: '#f6f7fa',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>⚙️ Deck Settings</h2>
        
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
            📄 PDF Upload
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
            ✏️ Manual Entry
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
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>📄 Upload PDF</h2>
          
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
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>✏️ Manual Slide Entry</h2>

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
          {isLoading ? 'Creating...' : '🚀 Create Slide Deck'}
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
          <button
            onClick={() => {
              navigator.clipboard.writeText(presentationUrl);
              appendLog('📋 URL copied to clipboard');
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            📋 Copy URL
          </button>
          <a
            href={presentationUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            🚀 Open Presentation
          </a>
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
