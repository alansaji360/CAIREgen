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
    fontFamily: 'var(--font-figtree), Arial, sans-serif',
    maxWidth: '2000px',
    margin: 'auto',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    gap: '20px',
    background: 'linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%)',
    borderRadius: '15px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
  },
  controlsContainer: {
    width: '100%',
    maxWidth: '2000px',
    margin: '2rem auto 0 auto',
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    backgroundColor: '#f6f7faff',
    padding: '1rem',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
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
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
    flexShrink: 0,
    overflow: 'hidden',
    position: 'relative',
    transition: 'all 0.3s ease',
  },
  slideshowBoxFullscreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
    boxShadow: 'none',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  },
  slideContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    boxSizing: 'border-box',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  slideImageSection: {
    flex: '1 1 auto',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  slideImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: '10px',
    transition: 'transform 0.3s ease',
  },
  slideNarration: {
    flex: '0 0 auto',
    minHeight: '10%',
    fontSize: '1rem',
    fontStyle: 'italic',
    color: '#000',
    backgroundColor: '#e9ecef',
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    maxWidth: '100%',
    textAlign: 'center',
    overflowY: 'auto',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
  },
  controls: {
    marginTop: '1.25rem',
  },
  button: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 22px',
    marginRight: '12px',
    marginTop: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem',
    transition: 'background 0.3s, transform 0.2s',
    fontFamily: 'var(--font-figtree), sans-serif',
  },
  input: {
    width: '370px',
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '5px',
    border: '1px solid #ddd',
    marginRight: '10px',
    outline: 'none',
    transition: 'border 0.3s',
  },
  log: {
    marginTop: '1.5rem',
    backgroundColor: '#e9edf1ff',
    borderRadius: '8px',
    padding: '1rem',
    height: '160px',
    overflowY: 'auto',
    textAlign: 'left',
    fontFamily: 'var(--font-figtree), monospace',
    fontSize: '0.96rem',
    color: '#333',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  avatarOverlayWrapperSmall: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    width: '150px',
    zIndex: 10,
    cursor: 'pointer',
    transition: 'width 0.3s ease',
  },
  avatarOverlayWrapperLarge: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    width: '200px',
    zIndex: 10,
    cursor: 'pointer',
    transition: 'width 0.3s ease',
  },
  avatarRatioBox: {
    position: 'relative',
    width: '100%',
    paddingTop: '175%',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '2px solid #f0f0f0',
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
    backgroundColor: '#f6f7faff',
    borderRadius: '8px',
    border: '1px solid #eee',
    marginBottom: '1rem',
    textAlign: 'center',
    fontFamily: 'var(--font-figtree), Arial, sans-serif',
  },
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontFamily: 'var(--font-figtree), Arial',
    fontSize: '18px',
    background: 'linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%)',
  },
  errorScreen: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontFamily: 'var(--font-figtree), Arial',
    fontSize: '18px',
    background: 'linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%)',
  },
  indicatorContainer: {
    marginTop: '1rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    fontFamily: 'var(--font-figtree), Arial',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  ready: {
    backgroundColor: '#28a745',
  },
  generating: {
    backgroundColor: '#ffc107',
  },
  notReady: {
    backgroundColor: '#6d7d6cff',
  },
};


// Loading Component
const LoadingScreen = () => (
  <div style={styles.loadingScreen}>
    <div style={{ fontSize: '48px', marginBottom: '1rem' }}>⏳</div>
    <div>Loading presentation...</div>
  </div>
);

// Error Component
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
  onSkipIntro,
  introPlaying
}) => {
  const darkenColor = (hexColor, factor = 0.8) => {
    if (!hexColor || typeof hexColor !== 'string') {
      return;
    }

    hexColor = hexColor.replace('#', '');
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);

    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r / 255: h = (g / 255 - b / 255) / d + (g / 255 < b / 255 ? 6 : 0); break;
        case g / 255: h = (b / 255 - r / 255) / d + 2; break;
        case b / 255: h = (r / 255 - g / 255) / d + 4; break;
      }
      h /= 6;
    }

    l = Math.max(0, l * factor);

    const rgbToHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    if (s === 0) {
      const val = Math.round(l * 255);
      return `#${rgbToHex(val / 255)}${rgbToHex(val / 255)}${rgbToHex(val / 255)}`;
    }

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    const red = hue2rgb(p, q, h + 1 / 3);
    const green = hue2rgb(p, q, h);
    const blue = hue2rgb(p, q, h - 1 / 3);

    return `#${rgbToHex(red)}${rgbToHex(green)}${rgbToHex(blue)}`;
  };

  const handleMouseEnter = (e, originalColor) => {
    e.currentTarget.style.transform = 'scale(1.05)';
    e.currentTarget.style.backgroundColor = darkenColor(originalColor, 0.8);
    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  };

  const handleMouseLeave = (e, originalColor) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.backgroundColor = originalColor;
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div style={styles.controls}>

      <button
        style={{ ...styles.button, backgroundColor: isPresenting ? '#dc3545' : '#28a745' }}
        onClick={onStartPresentation}
        title={isPresenting ? 'Reset the presentation' : 'Start the presentation'}
        onMouseEnter={(e) => handleMouseEnter(e, isPresenting ? '#dc3545' : '#28a745')}
        onMouseLeave={(e) => handleMouseLeave(e, isPresenting ? '#dc3545' : '#28a745')}
      >
        {isPresenting ? 'Reset' : 'Start'}
      </button>

      <button
        style={{ ...styles.button, backgroundColor: '#cfd5dfff' }}
        onClick={onPrevSlide}
        disabled={!isPresenting || currentSlide === 0}
        title="Go to the previous slide"
        onMouseEnter={(e) => handleMouseEnter(e, '#cfd5dfff')}
        onMouseLeave={(e) => handleMouseLeave(e, '#cfd5dfff')}
      >
        🡰
      </button>

      <button
        style={{ ...styles.button, backgroundColor: isPaused ? '#28a745' : '#ffc107' }}
        onClick={onTogglePause}
        disabled={!isPresenting}
        title={isPaused ? 'Resume narration' : 'Pause narration'}
        onMouseEnter={(e) => handleMouseEnter(e, isPaused ? '#28a745' : '#ffc107')}
        onMouseLeave={(e) => handleMouseLeave(e, isPaused ? '#28a745' : '#ffc107')}
      >
        {isPaused ? '▶' : '⏸︎'}
      </button>

      <button
        style={{ ...styles.button, backgroundColor: '#cfd5dfff' }}
        onClick={onNextSlide}
        disabled={!isPresenting || currentSlide === totalSlides - 1}
        title="Go to the next slide"
        onMouseEnter={(e) => handleMouseEnter(e, '#cfd5dfff')}
        onMouseLeave={(e) => handleMouseLeave(e, '#cfd5dfff')}
      >
        🡲
      </button>

      <button
        style={{ ...styles.button, backgroundColor: '#9caac0ff' }}
        onClick={onToggleFullscreen}
        title={isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode for slides'}
        onMouseEnter={(e) => handleMouseEnter(e, '#9caac0ff')}
        onMouseLeave={(e) => handleMouseLeave(e, '#9caac0ff')}
      >
        ⛶
      </button>

      <select
        value={selectedLanguage}
        onChange={(e) => setSelectedLanguage(e.target.value)}
        style={{ ...styles.input, width: 'auto', marginRight: '10px' }}
        title="Select narration language"
      >
        <option value="en">English</option>
        <option value="es">Spanish</option>
      </select>
      <input
        type="text"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        placeholder="Ask a question..."
        style={{ ...styles.input, width: '250px' }}
        disabled={!isPresenting}
        title="Type a question to ask during the presentation"
      />
      <button
        style={{ ...styles.button, backgroundColor: '#e01f1fff' }}
        onClick={onAskQuestion}
        disabled={!isPresenting || !questionText.trim()}
        title="Submit your question to the avatar"
        onMouseEnter={(e) => handleMouseEnter(e, '#e01f1fff')}
        onMouseLeave={(e) => handleMouseLeave(e, '#e01f1fff')}
      >
        ?
      </button>


      <button
        style={{ ...styles.button, backgroundColor: '#5f5f5fff' }}
        onClick={onRegenerate}
        title="Regenerate narration script"
        onMouseEnter={(e) => handleMouseEnter(e, '#5f5f5fff')}
        onMouseLeave={(e) => handleMouseLeave(e, '#5f5f5fff')}
      >
        Regenerate Script
      </button>

      <button
        style={{ ...styles.button, backgroundColor: '#5f5f5fff' }}
        onClick={onRestart}
        title="Restart narration"
        onMouseEnter={(e) => handleMouseEnter(e, '#5f5f5fff')}
        onMouseLeave={(e) => handleMouseLeave(e, '#5f5f5fff')}
      >
        Restart Avatar
      </button>

      <button
        style={{ ...styles.button, backgroundColor: '#5f5f5fff' }}
        onClick={onClearLog}
        title="Clear the log messages"
        onMouseEnter={(e) => handleMouseEnter(e, '#5f5f5fff')}
        onMouseLeave={(e) => handleMouseLeave(e, '#5f5f5fff')}
      >
        🗑️
      </button>

    </div>
  );
};

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
        style={{ height: '100%', width: '100%' }}
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
  const fullscreenRef = useRef(null);
  const [isAvatarReady, setisAvatarReady] = useState(false);
  const [logs, setLogs] = useState([]);
  const [narrationScript, setNarrationScript] = useState([]);
  const [slideData, setSlideData] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [questionText, setQuestionText] = useState('');
  const [slideSummaries, setSlideSummaries] = useState([]);
  const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);
  const [deckData, setDeckData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentAvatarId, setCurrentAvatarId] = useState(AVATAR_ID);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const generatingRef = useRef(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isReady, setIsReady] = useState(false); // tracks if script is fully generated
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);

  const appendLog = useCallback((msg) => {
    setLogs((l) => {
      const timestamped = `[${new Date().toLocaleTimeString()}] ${msg}`;
      if (l.length > 0 && l[l.length - 1] === timestamped) return l;
      return [...l, timestamped];
    });
  }, []);

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
        window.dispatchEvent(new Event('resize'));
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch('/api/heygen/get-access-token', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data.token;
    } catch (error) {
      appendLog(error);
    }
  }, [appendLog]);

  const generateScriptWithGemini = useCallback(async () => {
    if (generatingRef.current) {
      return;
    }
    setIsGenerating(true);
    generatingRef.current = true;
    appendLog('Starting script generation...');

    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      appendLog('Gemini API key missing. Add it to .env');
      generatingRef.current = false;
      setIsGenerating(false);
      return;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'array', items: { type: 'string' } } }
    });

    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < slideData.length; i += batchSize) {
      batches.push(slideData.slice(i, i + batchSize));
    }


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

    setNarrationScript(fullScript);
    setSlideSummaries(fullScript.map(script => script.slice(0, 100) + '...'));

    appendLog(`Script generated...`);

    generatingRef.current = false;
    setIsGenerating(false);
    setHasGenerated(true);
  }, [slideData, selectedLanguage, appendLog]);

  // CHECK: Script Mismatch
  useEffect(() => {
    if (slideData.length > 0 && narrationScript.length !== slideData.length && !hasGenerated) {
      generateScriptWithGemini();
    }
  }, [slideData.length, narrationScript.length, generateScriptWithGemini, appendLog, isGenerating]);

  useEffect(() => {
    if (narrationScript.length === slideData.length && hasGenerated && !isGenerating) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [narrationScript.length, slideData.length, hasGenerated, isGenerating, appendLog]);

  const speak = useCallback((scriptText) => {
    if (!avatarRef.current || !isAvatarReady || !scriptText) return;
    avatarRef.current.speak({ text: scriptText, task_type: "repeat" });
  }, [isAvatarReady, appendLog]);

  const goToSlide = useCallback((slideIndex) => {
    if (slideIndex < 0 || slideIndex >= slideData.length) return;
    if (avatarRef.current && isAvatarReady) {
      avatarRef.current.interrupt();
    }
    setCurrentSlide(slideIndex);
    if (isPresenting && narrationScript[slideIndex] && isAvatarReady && !isPaused) {
      speak(narrationScript[slideIndex]);
    }
  }, [slideData.length, isPresenting, narrationScript, isAvatarReady, isPaused, speak, appendLog]);

  const goToNextSlide = useCallback(() => {
    const nextIndex = currentSlide + 1;
    if (nextIndex < slideData.length) {
      goToSlide(nextIndex);
    } else {
      appendLog('End of presentation');
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
    if (!avatarRef.current || !isAvatarReady) {
      appendLog('Avatar not ready for pause command');
      return;
    }
    try {
      avatarRef.current.interrupt();
      setIsPaused(true);
      appendLog('Paused');
    } catch (error) {
      appendLog(`Failed to pause narration: ${error.message}`);
    }
  }, [isAvatarReady, appendLog]);

  const resumeNarration = useCallback(() => {
    if (!avatarRef.current || !isAvatarReady) {
      appendLog('Avatar not ready for resume command');
      return;
    }
    if (narrationScript[currentSlide]) {
      speak(narrationScript[currentSlide]);
      setIsPaused(false);
      appendLog('Resumed');
    }
  }, [isAvatarReady, currentSlide, narrationScript, speak, appendLog]);

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
    setisAvatarReady(false);
    setIsPresenting(false);
    setIsPaused(false);
    appendLog('🛑 Avatar stopped.');
  }, [appendLog]);

  // EFFECT: Auto-stop stream on unmount
  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const startStream = useCallback(async () => {
    if (avatarRef.current) {
      return;
    }
    if (!isReady) { // Block stream start until script is ready
      appendLog("Script not fully generated. Please wait before starting.");
      return;
    }

    setisAvatarReady(false);
    try {
      const token = await fetchToken();
      const { default: StreamingAvatar, AvatarQuality, StreamingEvents } = await import('@heygen/streaming-avatar');
      const avatar = new StreamingAvatar({ token, debug: true });
      avatarRef.current = avatar;

      avatar.on(StreamingEvents.ICE_CONNECTION_STATE_CHANGE, (state) => appendLog(`ICE connection state changed: ${state}`));
      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        const stream = event.detail;
        if (stream) {
        } else {
          appendLog('Stream is null or undefined!');
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => appendLog(`Video play error: ${err.message}`));
          return;
        }
        setisAvatarReady(true);
      });
      avatar.on(StreamingEvents.STREAM_DISCONNECTED, (e) => appendLog(`Stream disconnected: ${e ? e.reason : 'Timeout'}`));

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        if (isPresenting && currentSlide < slideData.length - 1) {
          setTimeout(() => goToNextSlide(), 1500);
        }
      });

      await avatar.createStartAvatar({
        avatarName: currentAvatarId,
        voice: { voiceId: VOICE_IDS[selectedLanguage] || VOICE_IDS.english },
        quality: AvatarQuality.Medium,
        activityIdleTimeout: 180,
      });

      appendLog('Avatar connected');
      setisAvatarReady(true);
    } catch (error) {
      appendLog(`Failed to start avatar: ${error.message || 'Unknown error'}`);
      console.error('Avatar creation error:', error);
      setisAvatarReady(false);
    }
  }, [fetchToken, currentAvatarId, selectedLanguage, appendLog, isReady, isPresenting, currentSlide, slideData.length, goToNextSlide]);

  const startPresentation = useCallback(() => {
    if (!isReady) { // Block if not ready
      appendLog('Script not fully generated. Please wait.');
      return;
    }
    if (!isAvatarReady) {
      appendLog('Avatar not ready. Starting stream...');
      startStream();
      return;
    }
    if (!narrationScript.length) {
      appendLog('No narration script available. Please generate or upload a presentation.');
      return;
    }
    setIsPaused(false);
    setIsPresenting(true);
    setisAvatarReady(true);

    setCurrentSlide(0);

  }, [isReady, isAvatarReady, narrationScript.length, goToSlide, appendLog, startStream]);

  useEffect(() => {
    if (isPresenting) {
      goToSlide(0);
    }

    appendLog('Presentation started');
  }, [isPresenting]);

  const askQuestion = useCallback(async () => {
    if (!isAvatarReady || !isPresenting || !questionText.trim()) {
      appendLog('Cannot ask question: Avatar not ready or not presenting.');
      return;
    }
    if (avatarRef.current) {
      avatarRef.current.interrupt();
      setIsPaused(true);
      appendLog('Lecture interrupted for question.');
    }
    appendLog(`Question asked: ${questionText}`);

    console.log('Deck ID (router.query.deck):', router.query.deck);
    console.log('Question Text:', questionText);
    console.log('Current Slide:', currentSlide);

    const storeQuestion = async () => {
      try {
        const response = await fetch('/api/prisma/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deckId: router.query.deck, text: questionText, slideId: currentSlide }),
        });

        const responseBody = await response.json();
        if (!response.ok) {
          console.error('Failed to store question:', response.status, responseBody);
          appendLog(`Failed to store question: ${response.status} ${responseBody.error || 'Unknown error'}`);
          return;
        }

        console.log('Question stored successfully:', responseBody);
        appendLog('Question stored in database');
      } catch (error) {
        console.error('Network error storing question:', error);
        appendLog(`Network error storing question: ${error.message}`);
      }
    };
    await storeQuestion();

    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      appendLog('Gemini API key missing. Add it to .env');
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
      // appendLog('Answer received from Gemini.');
      setIsAnsweringQuestion(true);
      speak(answer);
      setQuestionText('');
      setIsAnsweringQuestion(false);
    } catch (error) {
      appendLog(`Gemini error while answering: ${error.message}`);
      speak('Sorry, I encountered an error while trying to answer your question. Let\'s continue with the lecture.');
      resumeNarration();
    }
  }, [isAvatarReady, isPresenting, questionText, currentSlide, slideData, selectedLanguage, speak, resumeNarration, appendLog, router.query.deck]);

  useEffect(() => {
    const loadDeckData = async () => {
      const { deck: deckId } = router.query;

      if (deckId) {
        if (typeof deckId !== 'string' || deckId.trim() === '') {
          setError('Invalid presentation link');
          appendLog('Invalid deck ID format');
          setLoading(false);
          return;
        }

        try {
          setLoading(true);

          const response = await fetch(`/api/prisma/${deckId}`);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

            if (response.status === 404) {
              setError('Presentation not found');
              appendLog(`Presentation not found: ${deckId}`);
            } else if (response.status === 400) {
              setError('Invalid presentation link');
              appendLog(`Invalid deck ID: ${deckId}`);
            } else {
              setError('Failed to load presentation');
              appendLog(`Failed to load presentation: ${response.status}`);
            }
            setLoading(false);
            return;
          }

          const deck = await response.json();

          if (!deck || !deck.slides || !Array.isArray(deck.slides)) {
            setError('Invalid presentation data');
            appendLog('Received invalid deck data from server');
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
          }

        } catch (error) {
          appendLog(`Network error: ${error.message}`);
          setError('Network error - please try again');
        }
      } else {
        setSlideData(SAMPLE_SLIDE_DATA);
        appendLog('Using sample slide data');
      }
      setLoading(false);
    };

    if (router.isReady) {
      loadDeckData();
    }
  }, [router.isReady, router.query, appendLog]);

  useEffect(() => {
    if (slideData.length > 0 && !hasGenerated) {
      generateScriptWithGemini();
    }
  }, [slideData, selectedLanguage, generateScriptWithGemini]);

  const restartStream = useCallback(() => {
    stopStream();
    setTimeout(startStream, 500);
    appendLog('Stream restarted');
  }, [stopStream, startStream, appendLog]);

  const onRegenerate = () => {
    setHasGenerated(false);
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
            fontFamily: 'var(--font-figtree), Arial, sans-serif',
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
            <div style={styles.indicatorContainer}>
              <div
                style={{
                  ...styles.indicator,
                  ...(isGenerating ? styles.generating : (isReady && isAvatarReady) ? styles.ready : styles.notReady)
                }}
                title={isGenerating ? 'Generating Script...' : (isReady && isAvatarReady) ? 'Ready to Start' : 'Not Ready - Start Avatar...'}


                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {isGenerating ? 'Generating' : (isReady && isAvatarReady) ? 'Ready' : 'Press Start'}
              </div>
            </div>
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
              <LogViewer logs={logs} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
