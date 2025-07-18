import React, { useState, useRef, useEffect } from 'react';

// Styles remain the same
const styles = {
    container: {
        padding: '2rem',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '700px',
        margin: 'auto',
        textAlign: 'center',
    },
    avatarBox: {
        width: '640px',
        height: '480px',
        margin: 'auto',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid #ccc',
        backgroundColor: '#1a1a1a',
        position: 'relative',
        overflow: 'hidden',
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
};

export default function Home() {
    const videoRef = useRef(null); 
    const avatarRef = useRef(null); 
    const [avatarReady, setAvatarReady] = useState(false);
    const [text, setText] = useState('');
    const [log, setLog] = useState([]);

    const AVATAR_ID = 'Pedro_CasualLook_public';
    const VOICE_ID = 'ff465a8dab0d42c78f874a135b11d47d';

    const appendLog = (msg) => setLog((l) => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);

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

    const startStream = async () => {
        if (avatarRef.current) stopStream();

        setAvatarReady(false);
        appendLog('Requesting session token...');
        try {
            const token = await fetchToken();
            const { default: StreamingAvatar, AvatarQuality, StreamingEvents } = await import('@heygen/streaming-avatar');

            // Enable debug mode for more verbose logging from the SDK
            const avatar = new StreamingAvatar({ token, debug: true });
            avatarRef.current = avatar;

            // NEW: Add listener for the raw WebRTC connection state
            avatar.on(StreamingEvents.ICE_CONNECTION_STATE_CHANGE, (state) => {
                appendLog(`ICE connection state changed: ${state}`);
            });

            avatar.on(StreamingEvents.AVATAR_MEDIA_STREAM, (stream) => {
                appendLog('✅ Media stream received. Attaching to video element...');
                if (videoRef.current) videoRef.current.srcObject = stream;
            });
            
            avatar.on(StreamingEvents.STREAM_DISCONNECTED, (e) => appendLog(`❌ Stream disconnected: ${e ? e.reason : 'Timeout'}`));
            
            appendLog('Starting avatar session...');
            
            await avatar.createStartAvatar({
                avatarName: AVATAR_ID,
                voice: { voiceId: VOICE_ID },
                quality: AvatarQuality.Medium,
            });

            appendLog('✅ Avatar session started. Ready to speak.');
            setAvatarReady(true);

        } catch (error) {
            appendLog(`❌ Failed to start avatar: ${error.message || 'Unknown error'}`);
            console.error('Avatar creation error:', error);
            if (avatarRef.current) avatarRef.current.stopAvatar();
            setAvatarReady(false);
        }
    };
    
    useEffect(() => {
      return () => { if (avatarRef.current) stopStream(); };
    }, []);

    const speak = () => {
        if (!avatarRef.current || !avatarReady || !text) return;
        avatarRef.current.speak({ text });
    };

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

    const clearChat = () => setLog([]);

    return (
        <div style={styles.container}>
            <h1 style={{ letterSpacing: 1, marginBottom: "1.3rem" }}>Streaming Avatar</h1>
            
            <div style={styles.avatarBox}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </div>
            
            <div style={styles.controls}>
                <button style={styles.button} onClick={startStream}>Start</button>
                <button style={styles.button} onClick={stopStream}>Stop</button>
                <button style={styles.button} onClick={clearChat}>Clear</button>
            </div>

            <div style={styles.controls}>
                <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Type something for the avatar to say..." style={styles.input} />
                <button style={styles.button} onClick={speak} disabled={!avatarReady} title={!avatarReady ? "Start the stream first" : "Send text to avatar"}>Send</button>
            </div>

            <div style={styles.log}>
                {log.map((line, i) => <div key={i}>{line}</div>)}
            </div>
        </div>
    );
}
