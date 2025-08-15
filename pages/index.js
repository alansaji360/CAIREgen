'use client'; // Force client-side rendering

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Draggable from 'react-draggable';

// Constants
const AVATAR_ID = 'Pedro_CasualLook_public';
const VOICE_ID = '8661cd40d6c44c709e2d0031c0186ada';
const SAMPLE_SLIDE_DATA = [
  { image: 'https://example.com/slide1.jpg', topic: 'Sample', content: 'Sample Slide', alt: 'Slide 1' }
];
const VOICE_IDS = {
  english: '8661cd40d6c44c709e2d0031c0186ada', // English
  spanish: '7dde95cac3cf4d888f8e27db7b44ee75',  // Spanish
};

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
    '@media (maxWidth: 1200px)': {
      flexDirection: 'column',
      alignItems: 'center',
    },
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
    position: 'relative', // Required for absolute positioning of PiP overlay
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
  },
  slideImageSection: {
    flex: '0 0 80%',
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
    borderRadius: '0',
  },
  slideNarration: {
    flex: '0 0 20%',
    fontSize: '1rem',
    fontStyle: 'italic',
    color: '#888',
    backgroundColor: '#f0f0f0',
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    maxWidth: '80%',
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
  // PiP avatar overlay styles (preserves 4:7 aspect ratio)
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
    paddingTop: '175%', // 7/4 = 1.75 for 4:7 ratio
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
};

// Sub-Components
const Controls = ({
  onStart,
  onStop,
  onClearLog,
  onRegenerate,
  onUpload,
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
  toggleFullScreen,
  isFullScreen,
}) => (
  <div style={styles.controls}>
    <button style={styles.button} onClick={onStart}>Start Stream</button>
    <button style={styles.button} onClick={onStop}>Stop</button>
    <button
      style={{
        ...styles.button,
        backgroundColor: isPresenting ? '#dc3545' : '#28a745',
      }}
      onClick={onStartPresentation}
    >
      {isPresenting ? '🛑 Stop Presentation' : '🎤 Start Presentation'}
    </button>
    <button
      style={{
        ...styles.button,
        backgroundColor: isPaused ? '#28a745' : '#ffc107',
      }}
      onClick={onTogglePause}
      disabled={!isPresenting}
    >
      {isPaused ? '▶️ Resume' : '⏸️ Pause'}
    </button>
    <button
      style={styles.button}
      onClick={onPrevSlide}
      disabled={!isPresenting || currentSlide === 0}
    >
      ⬅️ Previous
    </button>
    <button
      style={styles.button}
      onClick={onNextSlide}
      disabled={!isPresenting || currentSlide >= totalSlides - 1}
    >
      Next ➡️
    </button>
    <span style={{ margin: '0 10px', fontSize: '1rem' }}>
      Slide {currentSlide + 1} of {totalSlides}
    </span>
    <button style={styles.button} onClick={onClearLog}>Clear Log</button>
    <button style={styles.button} onClick={onRegenerate}>Regenerate Script</button>
    <input type="file" accept="application/pdf,.pdf" onChange={onUpload} style={styles.uploadInput} />
    <select
      value={selectedLanguage}
      onChange={(e) => setSelectedLanguage(e.target.value)}
      style={{ ...styles.input, width: 'auto', marginRight: '10px' }}
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
    />
    <button
      style={styles.button}
      onClick={onAskQuestion}
      disabled={!isPresenting || !questionText.trim()}
    >
      Ask Question
    </button>
    <button
      style={{
        ...styles.button,
        backgroundColor: isFullScreen ? '#dc3545' : '#0070f3',
      }}
      onClick={toggleFullScreen}
    >
      {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
    </button>
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
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={styles.avatarVideoFill}
          />
        </div>
      </div>
    </Draggable>
  );
};

const SlideshowNarrator = ({ slideData, narrationScript, currentSlide, slideshowRef, slideRef, videoRef, isAvatarExpanded, onToggleAvatarExpanded }) => (
  <div ref={slideshowRef} style={styles.slideshowBox}>
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
    {/* PiP avatar overlay */}
    <AvatarOverlay
      videoRef={videoRef}
      isExpanded={isAvatarExpanded}
      onToggleExpand={onToggleAvatarExpanded}
    />
  </div>
);

const SlideMenu = ({ slideData, slideSummaries, currentSlide, goToSlide }) => (
  <div style={{
    width: '300px',
    height: '840px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #ccc',
    backgroundColor: '#f0f0f0',
    overflowY: 'auto',
    padding: '1rem',
    flexShrink: 0,
    marginLeft: '20px',
  }}>
    <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Slide Menu</h3>
    {slideData.map((slide, index) => (
      <div
        key={`menu-${index}`}
        onClick={() => goToSlide(index)}
        style={{
          padding: '1rem',
          marginBottom: '0.5rem',
          backgroundColor: currentSlide === index ? '#0070f3' : '#fff',
          color: currentSlide === index ? '#fff' : '#333',
          borderRadius: '5px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'background 0.3s',
        }}
      >
        <strong>Slide {index + 1}: {slide.topic}</strong>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          {slideSummaries[index] || 'Generating summary...'}
        </p>
      </div>
    ))}
  </div>
);

// Main Home Component
export default function Home() {
  // States and Refs
  const videoRef = useRef(null);
  const avatarRef = useRef(null);
  const slideRef = useRef(null);
  const slideshowRef = useRef(null);
  const [avatarReady, setAvatarReady] = useState(false);
  const [logs, setLogs] = useState([]);
  const [narrationScript, setNarrationScript] = useState([]);
  const [slideData, setSlideData] = useState(SAMPLE_SLIDE_DATA);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [questionText, setQuestionText] = useState('');
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);
  const [slideSummaries, setSlideSummaries] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);

  const appendLog = (msg) => setLogs((l) => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  // Auto-load avatar on page load
  useEffect(() => {
    startStream();
  }, []);

  // Full-screen toggle
  const toggleFullScreen = useCallback(() => {
    if (!slideshowRef.current) return;

    if (!isFullScreen) {
      slideshowRef.current.requestFullscreen().catch((err) => appendLog(`❌ Full screen error: ${err.message}`));
    } else {
      document.exitFullscreen().catch((err) => appendLog(`❌ Exit full screen error: ${err.message}`));
    }
  }, [isFullScreen]);

  useEffect(() => {
    const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Fetch token for avatar
  const fetchToken = async () => {
    try {
      const res = await fetch('/api/get-access-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      appendLog(`Token received successfully`);
      return data.token;
    } catch (error) {
      appendLog(`❌ Token fetch failed: ${error.message}`);
      throw error;
    }
  };

  // Generate narration script
  const generateScriptWithGemini = useCallback(async () => {
    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      appendLog('❌ Gemini API key missing. Add it to .env');
      return;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      }
    });

    const slideSummaries = slideData.map((slide, i) => `Slide ${i + 1}: Topic - ${slide.topic}. Content - ${slide.content}`).join('\n');
    const prompt = `Generate an engaging narration script in ${selectedLanguage.toUpperCase()} Based on the following slide contents: ${slideSummaries}. 
                    For each slide, create one in-depth paragraph (4-6 sentences) that explains the topic thoroughly, provides historical or contextual 
                    background, includes relevant examples or analogies, discusses implications or applications, and ends with key takeaways or questions for reflection. 
                    Make it informative, academic yet approachable, and suitable for an avatar to narrate as if teaching a class. 
                    Output ONLY a JSON array of strings, with no additional text, explanations, or Markdown formatting.`;

    try {
      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      responseText = responseText.replace(/``````/g, '').trim();
      const script = JSON.parse(responseText);
      setNarrationScript(script);
      setSlideSummaries(slideSummaries);
      appendLog('✅ Narration script generated with Gemini');
    } catch (error) {
      appendLog(`❌ Gemini error: ${error.message}`);
    }
  }, [slideData, selectedLanguage]);

  // Auto-regenerate script when slideData or language changes
  useEffect(() => {
    if (slideData.length > 0) {
      generateScriptWithGemini();
    }
  }, [slideData, selectedLanguage, generateScriptWithGemini]);

  // Handle PDF upload
  const handleUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      appendLog('❌ Please upload a valid PDF file');
      return;
    }

    setUploadedFile(file);
  }, []);

  // Process uploaded PDF (client-side)
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
  }, [uploadedFile, generateScriptWithGemini]);

  // Start avatar stream
  const startStream = async () => {
    if (avatarRef.current) {
      appendLog("Session Already Exists");
      return;
    }

    setAvatarReady(false);
    appendLog('Requesting session token...');
    try {
      const token = await fetchToken();
      const { default: StreamingAvatar, AvatarQuality, StreamingEvents } = await import('@heygen/streaming-avatar');

      const avatar = new StreamingAvatar({ token, debug: true });
      avatarRef.current = avatar;

      avatar.on(StreamingEvents.ICE_CONNECTION_STATE_CHANGE, (state) => {
        appendLog(`ICE connection state changed: ${state}`);
      });

      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        const stream = event.detail;
        appendLog('Media stream received. Attaching to video element...');
        if (stream) {
          appendLog(`Stream details - Video tracks: ${stream.getVideoTracks().length}, Audio tracks: ${stream.getAudioTracks().length}`);
        } else {
          appendLog('❌ Stream is null or undefined!');
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => appendLog(`Video play error: ${err.message}`));
        }
        appendLog('Avatar stream attached');
        setAvatarReady(true);
      });

      avatar.on(StreamingEvents.STREAM_DISCONNECTED, (e) => appendLog(`❌ Stream disconnected: ${e ? e.reason : 'Timeout'}`));

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        appendLog('🔇 Avatar finished speaking');
        if (isPresenting && currentSlide < slideData.length - 1) {
          setTimeout(() => {
            goToNextSlide();
          }, 1500);
        }
      });

      appendLog('Starting avatar session...');

      await avatar.createStartAvatar({
        avatarName: AVATAR_ID,
        voice: { voiceId: VOICE_IDS[selectedLanguage] || VOICE_IDS.english },
        quality: AvatarQuality.Medium,
      });

      appendLog('✅ Avatar session started');
      setAvatarReady(true);
    } catch (error) {
      appendLog(`❌ Failed to start avatar: ${error.message || 'Unknown error'}`);
      console.error('Avatar creation error:', error);
      setAvatarReady(false);
    }
  };

  // Speak function
  const speak = useCallback((scriptText) => {
    if (!avatarRef.current || !avatarReady || !scriptText) return;
    avatarRef.current.speak({ text: scriptText, task_type: "repeat" });
    appendLog(`🗣️ Narrating: ${scriptText.slice(0, 50)}...`);
  }, [avatarReady]);

  // Go to slide and speak
  const goToSlide = useCallback((slideIndex) => {
    if (slideIndex < 0 || slideIndex >= slideData.length) return;

    if (avatarRef.current && avatarReady) {
      avatarRef.current.interrupt();
      appendLog('🛑 Interrupted ongoing narration for slide change.');
    }

    setCurrentSlide(slideIndex);

    if (isPresenting && narrationScript[slideIndex] && avatarReady && !isPaused) {
      speak(narrationScript[slideIndex]);
    }

    appendLog(`📊 Moved to slide ${slideIndex + 1}`);
  }, [slideData.length, isPresenting, narrationScript, avatarReady, isPaused, speak]);

  const goToNextSlide = useCallback(() => {
    const nextIndex = currentSlide + 1;
    if (nextIndex < slideData.length) {
      goToSlide(nextIndex);
    } else {
      appendLog('📍 Reached end of presentation');
      setIsPresenting(false);
    }
  }, [currentSlide, slideData.length, goToSlide]);

  const goToPrevSlide = useCallback(() => {
    const prevIndex = currentSlide - 1;
    if (prevIndex >= 0) {
      goToSlide(prevIndex);
    }
  }, [currentSlide, goToSlide]);

  // Start presentation (auto-start speaking without pause)
  const startPresentation = useCallback(() => {
    if (!avatarReady) {
      appendLog('❌ Avatar not ready. Please start the stream first.');
      return;
    }

    if (!narrationScript.length) {
      appendLog('❌ No narration script available. Please generate or upload a presentation.');
      return;
    }

    setIsPresenting(true);
    setIsPaused(false); // Ensure not paused
    setCurrentSlide(0);
    goToSlide(0); // This will trigger speak
    appendLog('🎤 Presentation started');
  }, [avatarReady, narrationScript.length, goToSlide]);

  const stopStream = () => {
    if (!avatarRef.current) return;

    avatarRef.current.stopAvatar();
    avatarRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setAvatarReady(false);
    setIsPresenting(false);
    setIsPaused(false);
    appendLog('🛑 Avatar stopped.');
  };

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
  }, [avatarReady]);

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
  }, [avatarReady, currentSlide, narrationScript, speak]);

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

    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      appendLog('❌ Gemini API key missing. Add it to .env');
      speak('Sorry, I cannot answer questions at this time due to a missing API key.');
      setQuestionText('');
      resumeNarration();
      return;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'text/plain'
      }
    });

    const currentSlideContent = `Slide ${currentSlide + 1}: Topic - ${slideData[currentSlide]?.topic}. Content - ${slideData[currentSlide]?.content}`;
    const prompt = `You are an instructor giving a college lecture. A student has asked the following question during a presentation: "${questionText}". 
    The current slide being discussed is: ${currentSlideContent}. 
    Provide a clear, concise, and informative answer (2-4 sentences) in ${selectedLanguage.toUpperCase()}, suitable for an avatar to narrate. 
    End with a smooth transition statement to return to the lecture content, such as "Now, let's get back to our discussion on [topic]."`;

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
      speak('Sorry, I encountered an error while trying to answer your question. Let’s continue with the lecture.');
      resumeNarration();
    }
  }, [avatarReady, isPresenting, questionText, currentSlide, slideData, selectedLanguage, speak, resumeNarration]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      resumeNarration();
    } else {
      pauseNarration();
    }
  }, [isPaused, pauseNarration, resumeNarration]);

  const clearLogs = useCallback(() => setLogs([]), []);

  const toggleAvatarExpanded = useCallback(() => {
    setIsAvatarExpanded((prev) => !prev);
  }, []);

  return (
    <div>
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
      <div style={styles.container}>
        {/* Removed separate avatar box; now overlaid in slideshow */}
        <SlideshowNarrator
          slideData={slideData}
          narrationScript={narrationScript}
          currentSlide={currentSlide}
          slideshowRef={slideshowRef}
          slideRef={slideRef}
          videoRef={videoRef}
          isAvatarExpanded={isAvatarExpanded}
          onToggleAvatarExpanded={toggleAvatarExpanded}
        />
        <SlideMenu
          slideData={slideData}
          slideSummaries={slideSummaries}
          currentSlide={currentSlide}
          goToSlide={goToSlide}
        />
      </div>
      <div style={styles.controlsContainer}>
        <div style={styles.fullWidthControls}>
          <Controls
            onStart={startStream}
            onStop={stopStream}
            onClearLog={clearLogs}
            onRegenerate={generateScriptWithGemini}
            onUpload={handleUpload}
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
            toggleFullScreen={toggleFullScreen}
            isFullScreen={isFullScreen}
          />
          <LogViewer logs={logs} />
        </div>
      </div>
    </div>
  );
}
