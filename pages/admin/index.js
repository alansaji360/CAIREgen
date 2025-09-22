import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Figtree } from 'next/font/google';

// Configure Figtree font
const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
});

export default function AdminPage() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDecks, setSelectedDecks] = useState([]);
  const [copyFeedback, setCopyFeedback] = useState({}); // For "Copied!" messages per deck
  const [expandedDeck, setExpandedDeck] = useState(null); // For showing questions per deck
  const [deckQuestions, setDeckQuestions] = useState({}); // {deckId: [questions]}
  const [summaries, setSummaries] = useState({}); // {deckId: summary}

  const appendLog = (msg) => setStatus(`[${new Date().toLocaleTimeString()}] ${msg}`);

  // Fetch all decks on page load
  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/decks/decks');
      if (!response.ok) throw new Error('Failed to fetch decks');

      const data = await response.json();
      // Sort by createdAt descending for newer first
      const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDecks(sortedData);
      appendLog(`✅ Loaded ${sortedData.length} decks`);
    } catch (error) {
      console.error('Error fetching decks:', error);
      appendLog(`Error loading decks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteDeck = async (deckId, deckTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${deckTitle}"? This will also delete all its slides.`)) {
      return;
    }

    appendLog(`🗑️ Deleting deck: ${deckTitle}...`);

    try {
      const response = await fetch(`/api/admin/decks/${deckId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 405) {
          throw new Error('API does not support DELETE method—check server configuration');
        }
        throw new Error(errorData.error || 'Failed to delete deck');
      }

      // Remove from local state
      setDecks(decks.filter(deck => deck.id !== deckId));
      appendLog(`Successfully deleted "${deckTitle}"`);

    } catch (error) {
      console.error('Error deleting deck:', error);
      appendLog(`Error deleting deck: ${error.message}`);
    }
  };

  const deleteMultiple = async (selectedIds) => {
    if (selectedIds.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} decks?`)) {
      return;
    }

    appendLog(`Deleting ${selectedIds.length} decks...`);

    try {
      const response = await fetch('/api/admin/decks/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 405) {
          throw new Error('API does not support DELETE method—check server configuration');
        }
        throw new Error(errorData.error || 'Failed to delete decks');
      }

      // Remove from local state
      setDecks(decks.filter(deck => !selectedIds.includes(deck.id)));
      setSelectedDecks([]);
      appendLog(`Successfully deleted ${selectedIds.length} decks`);

    } catch (error) {
      console.error('Error deleting decks:', error);
      appendLog(`Error deleting decks: ${error.message}`);
    }
  };

  const fetchQuestions = async (deckId) => {
    try {
      const response = await fetch(`/api/admin/questions/${deckId}`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      const questions = await response.json();
      setDeckQuestions((prev) => ({ ...prev, [deckId]: questions }));
      appendLog(`Loaded ${questions.length} questions for deck ${deckId}`);
    } catch (error) {
      appendLog(`Error loading questions: ${error.message}`);
    }
  };

  // NEW: Delete a single question
  const deleteQuestion = async (deckId, questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    appendLog(`Deleting question ${questionId}...`);

    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete question');
      }

      // Update local state to remove the question
      setDeckQuestions(prev => ({
        ...prev,
        [deckId]: prev[deckId].filter(q => q.id !== questionId)
      }));
      appendLog(`Successfully deleted question ${questionId}`);
    } catch (error) {
      console.error('Error deleting question:', error);
      appendLog(`Error deleting question: ${error.message}`);
    }
  };

  // Gemini summarization
  const summarizeQuestions = async (deckId, questions) => {
    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY; // Use your env var
    if (!GEMINI_API_KEY) {
      appendLog('Gemini API key missing');
      return;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Or your preferred model[19][20]

    const questionTexts = questions.map(q => q.text).join('\n');
    const prompt = `Summarize these student questions from a lecture: "${questionTexts}". Identify the most common topics, areas with the least understanding (e.g., frequent confusion), and key insights for the professor. Keep it concise (3-5 sentences). Output as plain text.`;

    try {
      const result = await model.generateContent(prompt);
      const summary = result.response.text().trim();
      setSummaries((prev) => ({ ...prev, [deckId]: summary }));
      appendLog('Summary generated');
    } catch (error) {
      appendLog(`Gemini error: ${error.message}`);
    }
  };

  const copyLink = (deckId) => {
    const link = `${window.location.origin}/student/?deck=${deckId}`;
    navigator.clipboard.writeText(link)
      .then(() => {
        setCopyFeedback(prev => ({ ...prev, [deckId]: true }));
        appendLog(`📋 Copied link for deck ${deckId}`);
        setTimeout(() => setCopyFeedback(prev => ({ ...prev, [deckId]: false })), 2000); // Hide after 2s
      })
      .catch((err) => {
        console.error('Copy failed:', err);
        appendLog('Failed to copy link—check browser permissions');
      });
  };

  const filteredDecks = decks.filter(deck =>
    deck.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deck.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelection = (deckId) => {
    if (selectedDecks.includes(deckId)) {
      setSelectedDecks(selectedDecks.filter(id => id !== deckId));
    } else {
      setSelectedDecks([...selectedDecks, deckId]);
    }
  };

  const selectAll = () => {
    if (selectedDecks.length === filteredDecks.length) {
      setSelectedDecks([]);
    } else {
      setSelectedDecks(filteredDecks.map(deck => deck.id));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Loading decks...</h1>
      </div>
    );
  }

  return (
    <div className={figtree.variable} style={{ padding: '2rem', maxWidth: '1200px', margin: 'auto', fontFamily: 'var(--font-figtree)', background: 'linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%)', borderRadius: '15px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', fontSize: '3rem', fontWeight: '300', position: 'relative', marginBottom: '1.3rem' }}>🔧 Admin - Deck Management</h1>
      <div style={{ width: '60px', height: '3px', backgroundColor: '#0070f3', margin: '0 auto 1rem auto' }}></div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <a href="/upload" style={{
          padding: '8px 16px',
          backgroundColor: '#28a745',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
        }}>
          Upload
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
      </div>

      {/* Search and Bulk Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <input
          type="text"
          placeholder="Search decks by title or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '300px'
          }}
        />

        <div>
          <button
            onClick={selectAll}
            disabled={loading}
            style={{
              padding: '8px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              marginRight: '8px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {selectedDecks.length === filteredDecks.length ? 'Unselect All' : 'Select All'}
          </button>

          {selectedDecks.length > 0 && (
            <button
              onClick={() => deleteMultiple(selectedDecks)}
              disabled={loading}
              style={{
                padding: '8px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              🗑️ ({selectedDecks.length})
            </button>
          )}
        </div>
      </div>

      {/* Decks List */}
      {filteredDecks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h3>No decks found</h3>
          <p>{searchTerm ? 'Try a different search term' : 'No decks have been created yet'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredDecks.map((deck) => (
            <div
              key={deck.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '1.5rem',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {/* Existing content: checkbox, title, details */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  checked={selectedDecks.includes(deck.id)}
                  onChange={() => toggleSelection(deck.id)}
                  style={{ marginRight: '1rem' }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0', color: '#0070f3' }}>📊 {deck.title}</h3>
                  <p style={{ margin: '0.5rem 0', color: '#666', fontSize: '14px' }}>
                    ID: {deck.id}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <strong>Avatar:</strong> {deck.avatar || 'Not set'}
                </div>
                <div>
                  <strong>Slides:</strong> {deck.slides?.length || 0}
                </div>
                <div>
                  <strong>Created:</strong> {new Date(deck.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <strong>Last Updated:</strong> {new Date(deck.updatedAt).toLocaleDateString()}
                </div>
              </div>

              {/* Existing buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                <a
                  href={`/student/?deck=${deck.id}`}
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
                  onClick={() => copyLink(deck.id)}
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
                  {copyFeedback[deck.id] && (
                    <span style={{
                      position: 'absolute',
                      top: '-25px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#28a745',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      Copied!
                    </span>
                  )}
                </button>

                <button
                  onClick={() => deleteDeck(deck.id, deck.title)}
                  disabled={loading}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  🗑️
                </button>
              </div>

              {/* Expand/Collapse for Questions */}
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={() => {
                    if (expandedDeck === deck.id) {
                      setExpandedDeck(null);
                    } else {
                      setExpandedDeck(deck.id);
                      fetchQuestions(deck.id);
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {expandedDeck === deck.id ? 'Hide Questions' : 'Show Questions'}
                </button>

                {expandedDeck === deck.id && deckQuestions[deck.id] && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <h4>Questions ({deckQuestions[deck.id].length})</h4>
                    {deckQuestions[deck.id].length === 0 ? (
                      <p>No questions yet.</p>
                    ) : (
                      <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {deckQuestions[deck.id].map((q) => (
                          <li key={q.id} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{q.text} ({new Date(q.createdAt).toLocaleString()})</span>
                            <button
                              onClick={() => deleteQuestion(deck.id, q.id)}
                              style={{
                                padding: '2px 6px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                              title="Delete this question"
                            >
                              🗑️
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      onClick={() => summarizeQuestions(deck.id, deckQuestions[deck.id])}
                      disabled={deckQuestions[deck.id].length < 1}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: deckQuestions[deck.id].length < 1 ? 'not-allowed' : 'pointer',
                        marginTop: '0.5rem'
                      }}
                    >
                      Summarize Questions
                    </button>
                    {summaries[deck.id] && (
                      <p style={{ marginTop: '1rem' }}>
                        <strong>Summary:</strong> {summaries[deck.id]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Log */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        fontFamily: 'var(--font-figtree), Arial, sans-serif',
        fontSize: '14px'
      }}>
        <h3>Status Log:</h3>
        <div>{status || 'Ready...'}</div>
      </div>
    </div>
  );
}
