'use client'; // Force client-side rendering

import React from 'react';
import { Figtree } from 'next/font/google';

// Configure Figtree font
const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
});

// Styles (simplified for welcome page)
const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'var(--font-figtree), Arial, sans-serif',
    maxWidth: '1200px',
    margin: 'auto',
    textAlign: 'center',
  },
  section: {
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '2rem',
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
  buttonCreate: {
    backgroundColor: '#28a745',
    color: 'white',
  },
  buttonManage: {
    backgroundColor: '#e27d2aff',
    color: 'white',
  },
  header: {
    letterSpacing: 3,
    marginBottom: "1.3rem",
    textAlign: 'center',
    color: '#2c3e50',
    fontSize: '3rem',
    fontWeight: '300',
    fontFamily: 'var(--font-figtree), Arial, sans-serif',
    position: 'relative'
  },
  subheader: {
    color: '#666',
    fontSize: '1.2rem',
    marginBottom: '2rem',
  },
};

// Hover effects (applied via onMouseEnter/Leave, but for simplicity, suggest CSS if possible; here using inline)
const hoverStyles = {
  transform: 'scale(1.05)',
  boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
};

// Main Welcome Page Component
export default function Home() {
  const [hoveredButton, setHoveredButton] = React.useState(null);

  return (
    <div className={figtree.variable} style={styles.container}>
      <h1 style={styles.header}>
        Welcome to CAIRE<span style={{ color: '#0070f3', fontWeight: 'bold' }}>gen</span>
        <div style={{
          width: '60px',
          height: '3px',
          backgroundColor: '#0070f3',
          margin: '0.5rem auto 0 auto'
        }}></div>
      </h1>

      <p style={styles.subheader}>
        CAIREgen is an AI-powered platform for creating and viewing interactive slide presentations. 
        Use the tools below to get started!
      </p>

      <div style={styles.buttonContainer}>
        <a href="/upload" 
          style={{
            ...styles.button,
            ...styles.buttonCreate,
            ...(hoveredButton === 'create' ? hoverStyles : {})
          }}
          onMouseEnter={() => setHoveredButton('create')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          Create New Deck (Upload Page)
        </a>
        <a href="/admin" 
          style={{
            ...styles.button,
            ...styles.buttonManage,
            ...(hoveredButton === 'manage' ? hoverStyles : {})
          }}
          onMouseEnter={() => setHoveredButton('manage')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          Manage Decks (Admin Page)
        </a>
      </div>

      <div style={styles.section}>
        <h2>Upload Page</h2>
        <p>
          The Upload page lets you create new slide decks. You can:
        </p>
        <ul style={{ listStyleType: 'disc', textAlign: 'left', margin: '1rem auto', maxWidth: '600px' }}>
          <li>Enter a title for your deck.</li>
          <li>Choose an avatar for narration (Professional, Friendly, etc.).</li>
          <li>Upload a PDF file to automatically extract slides, images, and text.</li>
          <li>Or use Manual Entry to add slides one by one with custom topics, content, and optional images.</li>
          <li>Click "Create Slide Deck" to generate a shareable link for viewing.</li>
        </ul>
        <p>
          Once created, you'll get a URL to view the presentation on the Student page.
        </p>
      </div>

      <div style={styles.section}>
        <h2>Admin Page</h2>
        <p>
          The Admin page is for managing your existing decks. Features include:
        </p>
        <ul style={{ listStyleType: 'disc', textAlign: 'left', margin: '1rem auto', maxWidth: '600px' }}>
          <li>View a list of all decks with details like title, avatar, slides count, and dates.</li>
          <li>Search decks by title or ID.</li>
          <li>Select multiple decks for bulk deletion.</li>
          <li>View, copy link, or delete individual decks.</li>
          <li>Expand decks to see student questions, delete them, or generate AI summaries of questions.</li>
        </ul>
        <p>
          Use this to organize and analyze feedback from presentations.
        </p>
      </div>

      <div style={styles.section}>
        <h2>Student Page</h2>
        <p>
          The Student page is where presentations come to life. To use it:
        </p>
        <ul style={{ listStyleType: 'disc', textAlign: 'left', margin: '1rem auto', maxWidth: '600px' }}>
          <li>Visit /student/?deck=[your-deck-id] (get the ID from Upload or Admin page).</li>
          <li>View slides with AI-narrated content by an avatar.</li>
          <li>Use controls to start/pause, navigate slides, ask questions, and more.</li>
          <li>Questions you ask are stored and can be reviewed in Admin.</li>
          <li>Switch languages or regenerate scripts if needed.</li>
        </ul>
        <p>
          Share the link with others to view your interactive presentation!
        </p>
      </div>

      <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#666' }}>
        <p>Need help? Contact support or check documentation.</p>
      </footer>
    </div>
  );
}
