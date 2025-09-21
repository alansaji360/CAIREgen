'use client'; // Force client-side rendering

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Draggable from 'react-draggable';

// Constants
const AVATAR_ID = 'Pedro_CasualLook_public';
const VOICE_IDS = {
  english: '8661cd40d6c44c709e2d0031c0186ada',
  spanish: '7dde95cac3cf4d888f8e27db7b44ee75',
};

const AVATAR_CONFIGS = {
  'avatar1': { id: 'Pedro_CasualLook_public', name: 'Professional' },
  'avatar2': { id: 'Anna_public_20240108', name: 'Friendly' },
  'avatar3': { id: 'josh_lite3_20230714', name: 'Creative' },
  'avatar4': { id: 'Pedro_CasualLook_public', name: 'Tech' }
};

const SAMPLE_SLIDE_DATA = [
  { image: 'https://example.com/slide1.jpg', topic: 'Sample', content: 'Sample Slide', alt: 'Slide 1' }
];

// Styles
const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '2000px',
    margin: 'auto',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    gap: '20px',
  },
  controlsContainer: {
    width: '100%',
    maxWidth: '2000px',
    margin: '2rem auto 0 auto',
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
  },
  fullWidthControls: {
    width: '100%',
    maxWidth: '1974px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  slideshowBox: {
    width: '1494px',
    height: '840px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #ccc',
    backgroundColor: '#f9f9f9',
    flexShrink: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  slideshowBoxFullscreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: '#f9f9f9',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
    boxShadow: 'none',
    border: 'none',
    overflow: 'hidden',
  },
  slideContainer: {
    width: '100%',
    height: '100%', // Ensure full height
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    boxSizing: 'border-box',
  },
  slideImageSection: {
    flex: '1 1 auto', // Changed from fixed 80% to flexible (grows to fill space)
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  slideImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain', // Ensures image fits without distortion
    borderRadius: '0',
  },
  slideNarration: {
    flex: '0 0 auto', // Fixed height for caption, but auto to fit content
    minHeight: '10%', // Minimum to ensure visibility, adjust as needed
    fontSize: '1rem',
    fontStyle: 'italic',
    color: '#888',
    backgroundColor: '#f0f0f0',
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    maxWidth: '100%', // Changed to 100% for fullscreen
    textAlign: 'center',
    overflowY: 'auto',
  },
  controls: {
    marginTop: '1.25rem',
  },
  button: {
    backgroundColor: '#0070f3',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 22px',
    marginRight: '12px',
    marginTop: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem',
    transition: 'background 0.3s',
  },
  input: {
    width: '370px',
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '5px',
    border: '1px solid #ccc',
    marginRight: '10px',
    outline: 'none',
  },
  log: {
    marginTop: '1.5rem',
    backgroundColor: '#e9e9e9ff',
    borderRadius: '8px',
    padding: '1rem',
    height: '160px',
    overflowY: 'auto',
    textAlign: 'left',
    fontFamily: 'monospace',
    fontSize: '0.96rem',
    color: '#333',
    width: '100%',
    boxSizing: 'border-box',
  },
  uploadInput: {
    marginTop: '1rem',
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '5px',
    border: '1px solid #ccc',
    outline: 'none',
  },
  avatarOverlayWrapperSmall: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    width: '150px',
    zIndex: 10,
    cursor: 'pointer',
  },
  avatarOverlayWrapperLarge: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    width: '200px',
    zIndex: 10,
    cursor: 'pointer',
  },
  avatarRatioBox: {
    position: 'relative',
    width: '100%',
    paddingTop: '175%',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    border: '2px solid #fff',
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  avatarVideoFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    backgroundColor: '#000',
  },
  deckInfo: {
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
  },
  errorScreen: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
  },
  readyIndicator: {
    marginTop: '1rem',
    fontSize: '1.2rem',
    color: '#28a745', // Green for ready
    fontWeight: 'bold',
  },
  generatingIndicator: {
    marginTop: '1rem',
    fontSize: '1.2rem',
    color: '#ffc107', // Yellow for generating
    fontWeight: 'bold',
  },
};

// Separate Loading Component
const LoadingScreen = () => (
  <div style={styles.loadingScreen}>
    <div style={{ fontSize: '48px', marginBottom: '1rem' }}>⏳</div>
    <div>Loading presentation...</div>
  </div>
);

// Separate Error Component
const ErrorScreen = ({ error }) => (
  <div style={styles.errorScreen}>
    <h2>❌ {error}</h2>
    <p>The presentation link may be invalid or expired.</p>
    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
      <a
        href="/upload"
        style={{
          color: '#0070f3',
          textDecoration: 'none',
          padding: '10px 20px',
          border: '2px solid #0070f3',
          borderRadius: '5px'
        }}
      >
        ← Create New Presentation
      </a>
      <a
        href="/"
        style={{
          color: '#28a745',
          textDecoration: 'none',
          padding: '10px 20px',
          border: '2px solid #28a745',
          borderRadius: '5px'
        }}
      >
        🏠 Home
      </a>
    </div>
  </div>
);

const Controls = ({
  onRestart,
  onClearLog,
  onRegenerate,
  onTogglePause,
  isPaused,
  onStartPresentation,
  isPresenting,
  onNextSlide,
  onPrevSlide,
  currentSlide,
  totalSlides,
  selectedLanguage,
  setSelectedLanguage,
  onAskQuestion,
  questionText,
  setQuestionText,
  onToggleFullscreen,
  isFullscreen,
  onSkipIntro, // New prop for skipping intro
  introPlaying // New prop to show/hide skip button
}) => (
  <div style={styles.controls}>
    <button style={styles.button} onClick={onRestart}>Restart Avatar</button>
    <button style={{ ...styles.button, backgroundColor: isPresenting ? '#dc3545' : '#28a745' }} onClick={onStartPresentation}>
      {isPresenting ? '🛑' : '🎤'}
    </button>
    <button style={{ ...styles.button, backgroundColor: isPaused ? '#28a745' : '#ffc107' }} onClick={onTogglePause} disabled={!isPresenting}>
      {isPaused ? '▶️ Resume' : '⏸️ Pause'}
    </button>
    <button style={styles.button} onClick={onPrevSlide} disabled={!isPresenting || currentSlide === 0}>⬅️ Previous</button>
    <button style={styles.button} onClick={onNextSlide} disabled={!isPresenting || currentSlide >= totalSlides - 1}>Next ➡️</button>
    <span style={{ margin: '0 10px', fontSize: '1rem' }}>Slide {currentSlide + 1} of {totalSlides}</span>
    <button style={styles.button} onClick={onClearLog}>Clear Log</button>
    <button style={styles.button} onClick={onRegenerate}>Regenerate Script</button>
    <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} style={{ ...styles.input, width: 'auto', marginRight: '10px' }}>
      <option value="en">English</option>
      <option value="es">Spanish</option>
    </select>
    <input type="text" value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Ask a question..." style={{ ...styles.input, width: '250px' }} disabled={!isPresenting} />
    <button style={styles.button} onClick={onAskQuestion} disabled={!isPresenting || !questionText.trim()}>Ask Question</button>
    <button style={styles.button} onClick={onToggleFullscreen}>
      {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Slide'}
    </button>
    {introPlaying && (
      <button style={styles.button} onClick={onSkipIntro}>Skip Intro</button>
    )}
  </div>
);

const LogViewer = ({ logs }) => (
  <div style={styles.log}>
    {logs.map((line, i) => <div key={i}>{line}</div>)}
  </div>
);

const AvatarOverlay = ({ videoRef, isExpanded, onToggleExpand }) => {
  const wrapperStyle = isExpanded ? styles.avatarOverlayWrapperLarge : styles.avatarOverlayWrapperSmall;
  return (
    <Draggable bounds="parent">
      <div style={wrapperStyle} onDoubleClick={onToggleExpand} title="Double-click to expand/collapse">
        <div style={styles.avatarRatioBox}>
          <video ref={videoRef} autoPlay playsInline style={styles.avatarVideoFill} />
        </div>
      </div>
    </Draggable>
  );
};

const SlideshowNarrator = ({ slideData, narrationScript, currentSlide, slideshowRef, slideRef, videoRef, isAvatarExpanded, onToggleAvatarExpanded, isFullscreen }) => (
  <div ref={slideshowRef} style={isFullscreen ? styles.slideshowBoxFullscreen : styles.slideshowBox}>
    <div style={{ width: '100%', height: '100%', position: 'relative' }}> {/* New wrapper for full sizing */}
      <Slide
        ref={slideRef}
        duration={0}
        transitionDuration={500}
        infinite={false}
        indicators={true}
        arrows={false}
        pauseOnHover={false}
        cssClass="slideshow-container"
        autoplay={false}
        canSwipe={false}
        defaultIndex={currentSlide}
        key={currentSlide + narrationScript.length}
        style={{ height: '100%', width: '100%' }} // Force full size
      >
        {slideData.map((slide, index) => (
          <div key={`slide-${index}`} style={styles.slideContainer}>
            {slide.image ? (
              <div style={styles.slideImageSection}>
                <img
                  src={slide.image}
                  alt={slide.alt}
                  style={styles.slideImage}
                  onError={(e) => {
                    console.log(`Failed to load slide image: ${slide.image}`);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div style={styles.slideImageSection}>
                <h2 style={styles.slideTitle}>{slide.topic}</h2>
                {slide.content && <p style={styles.slideContent}>{slide.content}</p>}
              </div>
            )}
            <div style={styles.slideNarration}>
              <strong>Narration:</strong> {narrationScript[index] || 'Generating narration...'}
            </div>
          </div>
        ))}
      </Slide>
      <AvatarOverlay videoRef={videoRef} isExpanded={isAvatarExpanded} onToggleExpand={onToggleAvatarExpanded} />
    </div>
  </div>
);

const SlideMenu = ({ slideData, slideSummaries, currentSlide, goToSlide }) => (
  <div style={{ width: '300px', height: '840px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #ccc', backgroundColor: '#f0f0f0', overflowY: 'auto', padding: '1rem', flexShrink: 0, marginLeft: '20px' }}>
    <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Slide Menu</h3>
    {slideData.map((slide, index) => (
      <div key={`menu-${index}`} onClick={() => goToSlide(index)} style={{ padding: '1rem', marginBottom: '0.5rem', backgroundColor: currentSlide === index ? '#0070f3' : '#fff', color: currentSlide === index ? '#fff' : '#333', borderRadius: '5px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'background 0.3s' }}>
        <strong>Slide {index + 1}: {slide.topic}</strong>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{slideSummaries[index] || 'Generating summary...'}</p>
      </div>
    ))}
  </div>
);

const DeckInfo = ({ deckData }) => (
  <div style={styles.deckInfo}>
    <h3 style={{ margin: '0 0 0.5rem 0', color: '#0070f3' }}>📊 {deckData.title}</h3>
    <p style={{ margin: '0', color: '#666' }}>
      Avatar: {AVATAR_CONFIGS[deckData.avatar]?.name || 'Default'} |
      Created: {new Date(deckData.createdAt).toLocaleDateString()} |
      Slides: {deckData.slides?.length || 0}
    </p>
  </div>
);

// Main Home Component
export default function Home() {
  const router = useRouter();

  // ===== ALL HOOKS DECLARED FIRST =====
  const videoRef = useRef(null);
  const avatarRef = useRef(null);
  const slideRef = useRef(null);
  const slideshowRef = useRef(null);
  const fullscreenRef = useRef(null); // Ref for fullscreen target (slideshowBox)
  const [avatarReady, setAvatarReady] = useState(false);
  const [logs, setLogs] = useState([]);
  const [narrationScript, setNarrationScript] = useState([]);
  const [slideData, setSlideData] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [questionText, setQuestionText] = useState('');
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);
  const [slideSummaries, setSlideSummaries] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);
  const [deckData, setDeckData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentAvatarId, setCurrentAvatarId] = useState(AVATAR_ID);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); // New flag to prevent multiple generations
  const generatingRef = useRef(false); // Ref to track generating state without causing dependency changes
  const [hasGenerated, setHasGenerated] = useState(false);
  const [introPlaying, setIntroPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false); // NEW: Tracks if script is fully generated

  const appendLog = useCallback((msg) => {
    setLogs((l) => {
      const timestamped = `[${new Date().toLocaleTimeString()}] ${msg}`;
      if (l.length > 0 && l[l.length - 1] === timestamped) return l; // Skip exact duplicate (though timestamps differ, approximate)
      return [...l, timestamped];
    });
  }, []);

  // Fullscreen toggle for slide container
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      fullscreenRef.current?.requestFullscreen().catch((err) => {
        appendLog(`Fullscreen error: ${err.message}`);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        appendLog(`Exit fullscreen error: ${err.message}`);
      });
    }
  }, [appendLog]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (document.fullscreenElement) {
        // Force re-render or resize on enter
        window.dispatchEvent(new Event('resize'));
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch('/api/get-access-token', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      // appendLog(`Token received successfully`);
      return data.token;
    } catch (error) {
      // appendLog(`❌ Token fetch failed: ${error.message}`);
      throw error;
    }
  }, [appendLog]);

  const generateScriptWithGemini = useCallback(async () => {
    if (generatingRef.current) {
      // appendLog('Generation already in progress - skipping');
      return;
    }
    setIsGenerating(true); // NEW: Set generating flag for UI
    generatingRef.current = true;
    appendLog('Starting script generation...');

    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      appendLog('❌ Gemini API key missing. Add it to .env');
      generatingRef.current = false;
      setIsGenerating(false);
      return;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'array', items: { type: 'string' } } }
    });

    // Chunk slide data into batches of 10 (unchanged)
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < slideData.length; i += batchSize) {
      batches.push(slideData.slice(i, i + batchSize));
    }

    // appendLog(`Generating script in ${batches.length} batches of up to ${batchSize} slides each`);

    let fullScript = [];
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchSummaries = batch.map((slide, i) => `Slide ${batchIndex * batchSize + i + 1}: Topic - ${slide.topic}. Content - ${slide.content}`).join('\n');
      const prompt = `Generate an engaging narration script in ${selectedLanguage.toUpperCase()} based on the following slide contents: ${batchSummaries}. For each slide, create one in-depth narrative paragraph (4-6 sentences) that expands beyond just restating the bullets by weaving them into a cohesive story: thoroughly explain the topic with historical or contextual background, incorporate relevant examples or analogies, discuss implications or real-world applications, and end with key takeaways or reflective questions. Ensure the tone is informative, academic yet approachable, like a professor teaching a class, and make it flow naturally for spoken narration. Convert all numerical values, hexadecimal notations, addresses, or technical figures to their full spoken-word form for clear pronunciation (e.g., "0x0008" as "hex zero zero zero eight", "1024" as "one thousand twenty-four"). Output ONLY a JSON array of strings, with no additional text, explanations, or Markdown formatting. The array MUST have exactly ${batch.length} items, one for each slide in this batch.`;

      const attemptGeneration = async (attempt = 1) => {
        try {
          const result = await model.generateContent(prompt);
          let responseText = result.response.text();
          responseText = responseText.replace(/``````/g, '').trim();
          let script = JSON.parse(responseText);

          // Validate and fix length for this batch (unchanged)
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
          appendLog(`❌ Gemini error on batch ${batchIndex + 1} attempt ${attempt}: ${error.message}`);
          if (attempt < 2) {
            appendLog(`Retrying batch ${batchIndex + 1}...`);
            return attemptGeneration(attempt + 1);
          }
          return Array(batch.length).fill('Error generating narration - Please try regenerating');
        }
      };

      const batchScript = await attemptGeneration();
      fullScript = [...fullScript, ...batchScript];
      // appendLog(`✅ Completed batch ${batchIndex + 1}/${batches.length}`);
    }

    setNarrationScript(fullScript);
    setSlideSummaries(fullScript.map(script => script.slice(0, 100) + '...')); // Simplified summary generation if needed
    appendLog(`✅ Full narration script generated (${fullScript.length} items)`);
    generatingRef.current = false;
    setIsGenerating(false); // NEW: Clear generating flag
    setHasGenerated(true); // Mark as generated to prevent auto-retriggers
  }, [slideData, selectedLanguage, appendLog]);

  // Monitor for length mismatch (defensive, though batching should prevent it)
  useEffect(() => {
    if (slideData.length > 0 && narrationScript.length !== slideData.length && !hasGenerated) {
      // appendLog(`⚠️ Narration script length mismatch (${narrationScript.length}/${slideData.length}) - Regenerating`);
      generateScriptWithGemini();
    }
  }, [slideData.length, narrationScript.length, generateScriptWithGemini, appendLog, isGenerating]);

  // NEW: Effect to set isReady when script matches slideData length
  useEffect(() => {
    if (narrationScript.length === slideData.length && hasGenerated && !isGenerating) {
      setIsReady(true);
      appendLog('✅ Presentation ready to start');
    } else {
      setIsReady(false);
    }
  }, [narrationScript.length, slideData.length, hasGenerated, isGenerating, appendLog]);

  const speak = useCallback((scriptText) => {
    if (!avatarRef.current || !avatarReady || !scriptText) return;
    avatarRef.current.speak({ text: scriptText, task_type: "repeat" });
    // appendLog(`🗣️ Narrating: ${scriptText.slice(0, 50)}...`);
  }, [avatarReady, appendLog]);

  const goToSlide = useCallback((slideIndex) => {
    if (slideIndex < 0 || slideIndex >= slideData.length) return;
    if (avatarRef.current && avatarReady) {
      avatarRef.current.interrupt();
      // appendLog('🛑 Interrupted ongoing narration for slide change.');
    }
    setCurrentSlide(slideIndex);
    if (isPresenting && narrationScript[slideIndex] && avatarReady && !isPaused) {
      speak(narrationScript[slideIndex]);
    }
    // appendLog(`📊 Moved to slide ${slideIndex + 1}`);
  }, [slideData.length, isPresenting, narrationScript, avatarReady, isPaused, speak, appendLog]);

  const goToNextSlide = useCallback(() => {
    const nextIndex = currentSlide + 1;
    if (nextIndex < slideData.length) {
      goToSlide(nextIndex);
    } else {
      appendLog('📍 Reached end of presentation');
      setIsPresenting(false);
    }
  }, [currentSlide, slideData.length, goToSlide, appendLog]);

  const goToPrevSlide = useCallback(() => {
    const prevIndex = currentSlide - 1;
    if (prevIndex >= 0) {
      goToSlide(prevIndex);
    }
  }, [currentSlide, goToSlide]);

  const pauseNarration = useCallback(() => {
    if (!avatarRef.current || !avatarReady) {
      appendLog('❌ Avatar not ready for pause command');
      return;
    }
    try {
      avatarRef.current.interrupt();
      setIsPaused(true);
      appendLog('⏸️ Narration paused');
    } catch (error) {
      appendLog(`❌ Failed to pause narration: ${error.message}`);
    }
  }, [avatarReady, appendLog]);

  const resumeNarration = useCallback(() => {
    if (!avatarRef.current || !avatarReady) {
      appendLog('❌ Avatar not ready for resume command');
      return;
    }
    if (narrationScript[currentSlide]) {
      speak(narrationScript[currentSlide]);
      setIsPaused(false);
      appendLog('▶️ Narration resumed');
    }
  }, [avatarReady, currentSlide, narrationScript, speak, appendLog]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      resumeNarration();
    } else {
      pauseNarration();
    }
  }, [isPaused, pauseNarration, resumeNarration]);

  const clearLogs = useCallback(() => setLogs([]), []);

  const toggleAvatarExpanded = useCallback(() => setIsAvatarExpanded((prev) => !prev), []);

  const stopStream = useCallback(() => {
    if (!avatarRef.current) return;
    avatarRef.current.stopAvatar();
    avatarRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setAvatarReady(false);
    setIsPresenting(false);
    setIsPaused(false);
    appendLog('🛑 Avatar stopped.');
  }, [appendLog]);

  // NEW: Auto-stop stream on unmount to prevent lingering sessions
  useEffect(() => {
    return () => stopStream(); // Cleanup on component unmount
  }, [stopStream]);

  const startStream = useCallback(async () => {
    if (avatarRef.current) {
      // appendLog("Session Already Exists");
      return;
    }
    if (!isReady) { // NEW: Block stream start until script is ready
      appendLog("❌ Script not fully generated. Please wait before starting.");
      return;
    }

    setAvatarReady(false);
    // appendLog('Requesting session token...');
    try {
      const token = await fetchToken();
      const { default: StreamingAvatar, AvatarQuality, StreamingEvents } = await import('@heygen/streaming-avatar');
      const avatar = new StreamingAvatar({ token, debug: true });
      avatarRef.current = avatar;

      avatar.on(StreamingEvents.ICE_CONNECTION_STATE_CHANGE, (state) => appendLog(`ICE connection state changed: ${state}`));
      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        const stream = event.detail;
        // appendLog('Media stream received. Attaching to video element...');
        if (stream) {
          // appendLog(`Stream details - Video tracks: ${stream.getVideoTracks().length}, Audio tracks: ${stream.getAudioTracks().length}`);
        } else {
          appendLog('❌ Stream is null or undefined!');
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => appendLog(`Video play error: ${err.message}`));
          return;
        }
        // appendLog('Avatar stream attached');
        setAvatarReady(true);
      });
      avatar.on(StreamingEvents.STREAM_DISCONNECTED, (e) => appendLog(`❌ Stream disconnected: ${e ? e.reason : 'Timeout'}`));
      // avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      //   appendLog("Avatar Disconnected, restarting");
      //   // Optionally inform user and auto-restart
      //   restartStream();
      // });
      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        // appendLog('🔇 Avatar finished speaking');
        if (isPresenting && currentSlide < slideData.length - 1) {
          setTimeout(() => goToNextSlide(), 1500);
        }
      });

      // appendLog('Starting avatar session...');
      await avatar.createStartAvatar({
        avatarName: currentAvatarId,
        voice: { voiceId: VOICE_IDS[selectedLanguage] || VOICE_IDS.english },
        quality: AvatarQuality.Medium,
        activityIdleTimeout: 300, // NEW: Reduced to 300s (5 min) to minimize idle charges
      });
      appendLog('✅ Avatar connected');
      setAvatarReady(true);
    } catch (error) {
      appendLog(`❌ Failed to start avatar: ${error.message || 'Unknown error'}`);
      console.error('Avatar creation error:', error);
      setAvatarReady(false);
    }
  }, [fetchToken, currentAvatarId, selectedLanguage, appendLog, isReady, isPresenting, currentSlide, slideData.length, goToNextSlide]);

  const startPresentation = useCallback(() => {
    if (!isReady) { // NEW: Block if not ready
      appendLog('❌ Script not fully generated. Please wait.');
      return;
    }
    if (!avatarReady) {
      appendLog('❌ Avatar not ready. Starting stream...');
      startStream(); // Streamline: Auto-start stream if needed
      return;
    }
    if (!narrationScript.length) {
      appendLog('❌ No narration script available. Please generate or upload a presentation.');
      return;
    }
    setIsPresenting(true);
    setIsPaused(false);
    setCurrentSlide(0);
    goToSlide(0);
    appendLog('🎤 Presentation started');
  }, [isReady, avatarReady, narrationScript.length, goToSlide, appendLog, startStream]); // Added startStream dependency

  const askQuestion = useCallback(async () => {
    if (!avatarReady || !isPresenting || !questionText.trim()) {
      appendLog('❌ Cannot ask question: Avatar not ready or not presenting.');
      return;
    }
    if (avatarRef.current) {
      avatarRef.current.interrupt();
      setIsPaused(true);
      appendLog('⏸️ Lecture interrupted for question.');
    }
    appendLog(`❓ Question asked: ${questionText}`);

    console.log('Deck ID (router.query.deck):', router.query.deck);
    console.log('Question Text:', questionText);
    console.log('Current Slide:', currentSlide);

    // Store the question in the database
    const storeQuestion = async () => {
      try {
        const response = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deckId: router.query.deck, text: questionText, slideId: currentSlide }),
        });

        const responseBody = await response.json(); // Always parse body for details
        if (!response.ok) {
          console.error('Failed to store question:', response.status, responseBody);
          appendLog(`❌ Failed to store question: ${response.status} ${responseBody.error || 'Unknown error'}`);
          return;
        }

        console.log('Question stored successfully:', responseBody);
        appendLog('✅ Question stored in database');
      } catch (error) {
        console.error('Network error storing question:', error);
        appendLog(`❌ Network error storing question: ${error.message}`);
      }
    };
    await storeQuestion();

    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      appendLog('❌ Gemini API key missing. Add it to .env');
      speak('Sorry, I cannot answer questions at this time due to a missing API key.');
      setQuestionText('');
      resumeNarration();
      return;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite', generationConfig: { responseMimeType: 'text/plain' } });
    const currentSlideContent = `Slide ${currentSlide + 1}: Topic - ${slideData[currentSlide]?.topic}. Content - ${slideData[currentSlide]?.content}`;
    const prompt = `You are an instructor giving a college lecture. A student has asked the following question during a presentation: "${questionText}". The current slide being discussed is: ${currentSlideContent}. Provide a clear, concise, and informative answer (2-4 sentences) in ${selectedLanguage.toUpperCase()}, suitable for an avatar to narrate. End with a smooth transition statement to return to the lecture content, such as "Now, let's get back to our discussion on [topic]."`;

    try {
      const result = await model.generateContent(prompt);
      const answer = result.response.text().trim();
      appendLog('✅ Answer received from Gemini.');
      setIsAnsweringQuestion(true);
      speak(answer);
      setQuestionText('');
      setIsAnsweringQuestion(false);
    } catch (error) {
      appendLog(`❌ Gemini error while answering: ${error.message}`);
      speak('Sorry, I encountered an error while trying to answer your question. Let\'s continue with the lecture.');
      resumeNarration();
    }
  }, [avatarReady, isPresenting, questionText, currentSlide, slideData, selectedLanguage, speak, resumeNarration, appendLog, router.query.deck]);

  // ... (rest of the code remains the same as in the previous full code)

  useEffect(() => {
    const loadDeckData = async () => {
      const { deck: deckId } = router.query;

      if (deckId) {
        if (typeof deckId !== 'string' || deckId.trim() === '') {
          setError('Invalid presentation link');
          appendLog('❌ Invalid deck ID format');
          setLoading(false);
          return;
        }

        try {
          // appendLog(`Loading presentation: ${deckId}`);
          setLoading(true);

          const response = await fetch(`/api/decks/${deckId}`);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

            if (response.status === 404) {
              setError('Presentation not found');
              appendLog(`❌ Presentation not found: ${deckId}`);
            } else if (response.status === 400) {
              setError('Invalid presentation link');
              appendLog(`❌ Invalid deck ID: ${deckId}`);
            } else {
              setError('Failed to load presentation');
              appendLog(`❌ Failed to load presentation: ${response.status}`);
            }
            setLoading(false);
            return;
          }

          const deck = await response.json();

          if (!deck || !deck.slides || !Array.isArray(deck.slides)) {
            setError('Invalid presentation data');
            appendLog('❌ Received invalid deck data from server');
            setLoading(false);
            return;
          }

          setDeckData(deck);

          const transformedSlides = deck.slides.map((slide, index) => ({
            image: slide.image,
            alt: slide.alt || `Slide ${index + 1}`,
            topic: slide.topic,
            content: slide.content
          }));

          setSlideData(transformedSlides);

          const avatarConfig = AVATAR_CONFIGS[deck.avatar];
          if (avatarConfig) {
            setCurrentAvatarId(avatarConfig.id);
            // appendLog(`Using avatar: ${avatarConfig.name}`);
          }

          // appendLog(`✅ Loaded presentation: "${deck.title}" (${deck.slides.length} slides)`);

        } catch (error) {
          appendLog(`❌ Network error: ${error.message}`);
          setError('Network error - please try again');
        }
      } else {
        // Fallback logic if needed
        setSlideData(SAMPLE_SLIDE_DATA);
        appendLog('Using sample slide data');
      }
      setLoading(false);
    };

    if (router.isReady) {
      loadDeckData();
    }
  }, [router.isReady, router.query, appendLog]);

  // Kept: Script generation effect (runs after slideData loads, but no auto-stream)
  useEffect(() => {
    if (slideData.length > 0 && !hasGenerated) {
      generateScriptWithGemini();
    }
  }, [slideData, selectedLanguage, generateScriptWithGemini]);

  useEffect(() => {
    if (!uploadedFile) return;

    const processFile = async () => {
      appendLog('📂 Parsing PDF file (client-side only)...');
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

        const arrayBuffer = await uploadedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const total = pdf.numPages;
        const slides = [];
        const targetWidth = 1494;

        for (let i = 1; i <= total; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          const scale = Math.min(targetWidth / viewport.width, 1.6);
          const scaledViewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = scaledViewport.width;
          canvas.height = scaledViewport.height;

          await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
          const dataUrl = canvas.toDataURL('image/png');

          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();

          slides.push({
            image: dataUrl,
            alt: `PDF page ${i}`,
            topic: `Page ${i}`,
            content: pageText,
          });
        }

        setSlideData(slides);
        setCurrentSlide(0);
        appendLog(`✅ Extracted and rendered ${slides.length} full slide images from PDF`);
        await generateScriptWithGemini();
      } catch (error) {
        appendLog(`❌ PDF parsing error: ${error.message}`);
        console.error(error);
      } finally {
        setUploadedFile(null);
      }
    };

    processFile();
  }, [uploadedFile, generateScriptWithGemini, appendLog]);

  const restartStream = useCallback(() => {
    stopStream();
    setTimeout(startStream, 500); // Small delay to ensure clean restart
    appendLog('🔄 Stream restarted');
  }, [stopStream, startStream, appendLog]);

  const onRegenerate = () => {
    setHasGenerated(false); // Allow regeneration
    generateScriptWithGemini();
  };

  // ===== SINGLE RETURN WITH CONDITIONAL RENDERING =====
  return (
    <div>
      {loading && <LoadingScreen />}
      {error && <ErrorScreen error={error} />}
      {!loading && !error && (
        <>
          <h1 style={{
            letterSpacing: 3,
            marginBottom: "1.3rem",
            textAlign: 'center',
            color: '#2c3e50',
            fontSize: '3rem',
            fontWeight: '300',
            fontFamily: '"Helvetica Neue", Arial, sans-serif',
            position: 'relative'
          }}>CAIRE<span style={{ color: '#0070f3', fontWeight: 'bold' }}>gen</span>
            <div style={{
              width: '60px',
              height: '3px',
              backgroundColor: '#0070f3',
              margin: '0.5rem auto 0 auto'
            }}></div>
          </h1>

          {deckData && <DeckInfo deckData={deckData} />}

          <div style={styles.container}>
            <div ref={fullscreenRef} style={isFullscreen ? styles.slideshowBoxFullscreen : styles.slideshowBox}>
              <SlideshowNarrator slideData={slideData} narrationScript={narrationScript} currentSlide={currentSlide} slideshowRef={slideshowRef} slideRef={slideRef} videoRef={videoRef} isAvatarExpanded={isAvatarExpanded} onToggleAvatarExpanded={toggleAvatarExpanded} isFullscreen={isFullscreen} />
            </div>
            <SlideMenu slideData={slideData} slideSummaries={slideSummaries} currentSlide={currentSlide} goToSlide={goToSlide} />
          </div>
          <div style={styles.controlsContainer}>
            <div style={styles.fullWidthControls}>
              <Controls
                onRestart={restartStream}
                onClearLog={clearLogs}
                onRegenerate={onRegenerate}
                onTogglePause={togglePause}
                isPaused={isPaused}
                onStartPresentation={startPresentation}
                isPresenting={isPresenting}
                onNextSlide={goToNextSlide}
                onPrevSlide={goToPrevSlide}
                currentSlide={currentSlide}
                totalSlides={slideData.length}
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
                onAskQuestion={askQuestion}
                questionText={questionText}
                setQuestionText={setQuestionText}
                onToggleFullscreen={toggleFullscreen}
                isFullscreen={isFullscreen}
              />
              {/* NEW: Readiness Indicator */}
              <div style={isGenerating ? styles.generatingIndicator : styles.readyIndicator}>
                {isGenerating ? '⏳ Generating Script...' : (isReady ? '✅ Ready to Start' : 'Waiting for Script...')}
              </div>
              <LogViewer logs={logs} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
