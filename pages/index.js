import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import { GoogleGenerativeAI } from '@google/generative-ai';
import JSZip from 'jszip'; 
import Draggable from 'react-draggable';

// Constants
const AVATAR_ID = 'Pedro_CasualLook_public';
const VOICE_ID = '8661cd40d6c44c709e2d0031c0186ada';
const SAMPLE_SLIDE_DATA = [  
    { image: 'https://example.com/slide1.jpg', topic: 'Sample', content: 'Sample Slide', alt: 'Slide 1' }
]

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
        '@media (maxWidth: 1200px)': {  // Responsive: Stack vertically on smaller screens
            flexDirection: 'column',
            alignItems: 'center',
        },
    },
    avatarBox: {
        width: '480px',
        height: '840px',
        margin: 'auto',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid #ccc',
        backgroundColor: '#1a1a1a',
        position: 'gcfgfggfgffdgdsfarelative',
        overflow: 'hidden',
        flexShrink: 0,
    },
    slideshowBox: {
        width: '1494px',
        height: '840px',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid #ccc',
        backgroundColor: '#f9f9f9',
        flexShrink: 0,
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
    },
    uploadInput: {
        marginTop: '1rem',
        padding: '10px',
        fontSize: '1rem',
        borderRadius: '5px',
        border: '1px solid #ccc',
        outline: 'none',
    },
};

const AvatarVideo = ({ videoRef, style }) => (
    <div style={style}>
        <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block', backgroundColor: '#000' }}
        />
    </div>
);

const SlideshowNarrator = ({ slideData, narrationScript, onSlideChange }) => (
    <div style={styles.slideshowBox}>
        <Slide
            duration={5000}
            transitionDuration={500}
            onChange={onSlideChange}
            indicators={true}
            arrows={true}
        >
            {slideData.map((slide, index) => (
                <div key={index} style={{ textAlign: 'center', padding: '1rem' }}>
                    {slide.image && <img src={slide.image} alt={slide.alt} style={{ width: '100%', height: 'auto' }} />}
                    <h3>{slide.topic}</h3>
                    <p>{slide.content || ''}</p>
                    <p><em>Narration:</em> {narrationScript[index] || 'Generating...'}</p>
                </div>
            ))}
        </Slide>
    </div>
);

const Controls = ({ onStart, onStop, onClearLog, onRegenerate, onUpload }) => (
    <div style={styles.controls}>
        <button style={styles.button} onClick={onStart}>Start Stream</button>
        <button style={styles.button} onClick={onStop}>Stop</button>
        <button style={styles.button} onClick={onClearLog}>Clear Log</button>
        <button style={styles.button} onClick={onRegenerate}>Regenerate Script</button>
        <input type="file" accept=".pptx" onChange={onUpload} style={styles.uploadInput} />  // NEW: PPTX upload
    </div>
);

const LogViewer = ({ logs }) => (
    <div style={styles.log}>
        {logs.map((line, i) => <div key={i}>{line}</div>)}
    </div>
);

export default function Home() {
    
    
    const videoRef = useRef(null);
    const avatarRef = useRef(null);
    const [avatarReady, setAvatarReady] = useState(false);
    const [logs, setLogs] = useState([]);
    const [narrationScript, setNarrationScript] = useState([]);
    const [slideData, setSlideData] = useState(SAMPLE_SLIDE_DATA); 
    const [currentSlide, setCurrentSlide] = useState(0);

    const appendLog = (msg) => setLogs((l) => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);

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

    const parsePPTX = async (file) => {
        appendLog('📂 Parsing PPTX file...');
        try {
            const zip = new JSZip();
            const content = await zip.loadAsync(file); 
            if (!content) throw new Error('Failed to load PPTX content');

            const extractedSlides = [];

            const slideFiles = Object.keys(content.files).filter(name => name.startsWith('ppt/slides/slide'));
            slideFiles.sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));

            for (let i = 0; i < slideFiles.length; i++) {
                const slideXml = await content.file(slideFiles[i]).async('string');
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(slideXml, 'application/xml');

                const texts = Array.from(xmlDoc.getElementsByTagName('a:t')).map(t => t.textContent.trim());
                const topic = texts[0] || `Slide ${i + 1}`;
                const slideContent = texts.slice(1).join(' '); 

                let image = null;
                const relsFile = `ppt/slides/_rels/${slideFiles[i].split('/').pop()}.rels`;
                if (content.files[relsFile]) {
                    const relsXml = await content.file(relsFile).async('string');
                    const relsDoc = parser.parseFromString(relsXml, 'application/xml');
                    const imageRel = relsDoc.querySelector('Relationship[Type*="image"]');
                    if (imageRel) {
                        const imagePath = `ppt/media/${imageRel.getAttribute('Target').split('/').pop()}`;
                        if (content.files[imagePath]) {
                            const imageBlob = await content.file(imagePath).async('blob');
                            image = URL.createObjectURL(imageBlob);
                        }
                    }
                }

                extractedSlides.push({ topic, content: slideContent, image, alt: `Slide ${i + 1}` }); 
            }

            appendLog(`✅ Extracted ${extractedSlides.length} slides from PPTX`);
            return extractedSlides;
        } catch (error) {
            appendLog(`❌ PPTX parsing error: ${error.message}`);
            return [];
        }
    };

    const generateScriptWithGemini = useCallback(async () => {
        const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            appendLog('❌ Gemini API key missing. Add it to .env');
            return;
        }
        appendLog(GEMINI_API_KEY);
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
        const prompt = `Generate an engaging narration script for this presentation based on the following slide contents: 
        ${slideSummaries}. 
        Create one short paragraph (2-3 sentences) per slide. Make it informative, friendly, and suitable for an avatar to narrate. 
        Output ONLY a JSON array of strings, with no additional text, explanations, or Markdown formatting.`;

        try {
            const result = await model.generateContent(prompt);
            let responseText = result.response.text();
            
            // Remove Markdown code blocks and trim whitespace
            responseText = responseText.replace(/``````/g, '').trim();
            
            const script = JSON.parse(responseText);
            setNarrationScript(script);
            appendLog('✅ Narration script generated with Gemini');
        } catch (error) {
            appendLog(`❌ Gemini error: ${error.message}`);
        }
    }, [appendLog, slideData]);

    const handleUpload = useCallback(async (event) => {
        const file = event.target.files[0];
        if (!file || !file.name.endsWith('.pptx')) {
            appendLog('❌ Please upload a valid .pptx file');
            return;
        }
        const parsedSlides = await parsePPTX(file);
        if (parsedSlides.length > 0) {
            setSlideData(parsedSlides);
            await generateScriptWithGemini(); 
        }
    }, [appendLog, generateScriptWithGemini, parsePPTX]);

    const startStream = async () => {
        if (avatarRef.current)
        {
            appendLog("Session Already Exists");
            return;
        }

        setAvatarReady(false);
        appendLog('Requesting session token...');
        try {
            const token = await fetchToken();
            const { default: StreamingAvatar, AvatarQuality, StreamingEvents, TaskType } = await import('@heygen/streaming-avatar');

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

            appendLog('Starting avatar session...');
            
            await avatar.createStartAvatar({
                avatarName: AVATAR_ID,
                voice: { voiceId: VOICE_ID },
                quality: AvatarQuality.Medium,
            });

            appendLog('✅ Avatar session started');
            setAvatarReady(true);

        } catch (error) {
            appendLog(`❌ Failed to start avatar: ${error.message || 'Unknown error'}`);
            console.error('Avatar creation error:', error);
            // if (avatarRef.current) avatarRef.current.stopAvatar();
            setAvatarReady(false);
        }
    };

    const speak = useCallback((scriptText) => {
        if (!avatarRef.current || !avatarReady || !scriptText) return;
        avatarRef.current.speak({ text: scriptText, task_type: "repeat" });
        appendLog(`🗣️ Narrating: ${scriptText.slice(0, 50)}...`);
    }, [avatarReady, appendLog]);

    const handleSlideChange = useCallback((oldIndex, newIndex) => {
        setCurrentSlide(newIndex);
        if (narrationScript[newIndex]) {
            speak(narrationScript[newIndex]);
        }
    }, [narrationScript, speak]);


    const stopStream = () => {
        if (!avatarRef.current) return;
       
        if (avatarRef.current) {
            avatarRef.current.stopAvatar();
            avatarRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
        setAvatarReady(false);
        appendLog('🛑 Avatar stopped.');
    };

    useEffect(() => {
      return () => { if (avatarRef.current) stopStream(); };
    }, []);

    const clearLogs = useCallback(() => setLogs([]), []);

    return (
        <div style={styles.container}>
            <div>
                <h1 style={{ letterSpacing: 1, marginBottom: "1.3rem" }}>CAIREgen</h1>
                <AvatarVideo videoRef={videoRef} style={styles.avatarBox} />
                <Controls
                    onStart={startStream}
                    onStop={stopStream}
                    onClearLog={clearLogs}
                    onRegenerate={generateScriptWithGemini}
                    onUpload={handleUpload}  // NEW: Pass upload handler
                />
                <LogViewer logs={logs} />
            </div>
            <SlideshowNarrator
                slideData={slideData}
                narrationScript={narrationScript}
                onSlideChange={handleSlideChange}
            />
        </div>
    );

}