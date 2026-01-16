import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Figtree } from 'next/font/google';

const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree' });

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className={figtree.variable} style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'var(--font-figtree), sans-serif',
      background: 'linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%)'
    }}>
      <form onSubmit={handleLogin} style={{
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h1 style={{ marginBottom: '1.5rem', color: '#2c3e50' }}>Admin Login</h1>
        
        {error && <div style={{ color: '#dc3545', marginBottom: '1rem' }}>{error}</div>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '1rem',
            borderRadius: '5px',
            border: '1px solid #ddd',
            boxSizing: 'border-box'
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '1.5rem',
            borderRadius: '5px',
            border: '1px solid #ddd',
            boxSizing: 'border-box'
          }}
        />
        <button type="submit" style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '1rem'
        }}>
          Login
        </button>
      </form>
    </div>
  );
}
