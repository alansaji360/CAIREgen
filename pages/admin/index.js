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


  const [expandedNarrDeck, setExpandedNarrDeck] = useState(null); // string|null
  const [deckNarrations, setDeckNarrations] = useState({});       // { [deckId]: { bySlide: { [id]: text }, count } }
  const [regenPending, setRegenPending] = useState({});           // { [slideId]: boolean }
  const [language, setLanguage] = useState(undefined);           // string|undefined

  // NEW: State to manage the expanded image modal
  const [modalImageUrl, setModalImageUrl] = useState(null);


  const appendLog = (msg) => setStatus(`[${new Date().toLocaleTimeString()}] ${msg}`);


  // Fetch all decks on page load
  useEffect(() => {
    fetchDecks();
  }, []);


  // const fetchDecks = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await fetch('/api/admin/prisma/decks/decks');
  //     if (!response.ok) throw new Error('Failed to fetch decks');


  //     const data = await response.json();
  //     // Sort by createdAt descending for newer first
  //     // const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  //     setDecks(data);
  //     appendLog(`Loaded ${sortedData.length} decks`);
  //   } catch (error) {
  //     console.error('Error fetching decks:', error);
  //     appendLog(`Error loading decks: ${error.message}`);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/prisma/decks/decks');
      if (!response.ok) throw new Error('Failed to fetch decks');

      const data = await response.json();

      // --- DEBUGGING START ---
      // This will log the entire array of decks to your browser's console.
      console.log('Full API Response:', data);

      // This will log the details of the very first deck in the list.
      // We can check its 'slides' array to see if imageUrl is there.
      if (data && data.length > 0) {
        console.log('First deck object:', data[0]);

        // Check the slides of the first deck
        if (data[0].slides && data[0].slides.length > 0) {
          console.log('Slides of the first deck:', data[0].slides);
          console.log('First slide of the first deck:', data[0].slides[0]);
        } else {
          console.log('The first deck has no slides.');
        }
      }
      // --- DEBUGGING END ---

      setDecks(data); // Use the data directly from the API
      appendLog(`Loaded ${data.length} decks`);

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
      const response = await fetch(`/api/admin/prisma/decks/${deckId}`, {
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
      const response = await fetch('/api/admin/prisma/decks/bulk-delete', {
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
      const response = await fetch(`/api/admin/prisma/questions/${deckId}`);
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
      const response = await fetch(`/api/admin/prisma/questions/${questionId}`, {
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });


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


  async function fetchNarrations(deckId, lang) {
    const params = new URLSearchParams({ deckId: String(deckId) });
    if (lang) params.set('language', lang);
    const res = await fetch(`/api/prisma/narration?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch narrations');
    const { narrations } = await res.json();


    const bySlide = {};
    for (const n of narrations) bySlide[Number(n.slideId)] = n.text;


    setDeckNarrations(prev => ({
      ...prev,
      [deckId]: { bySlide, count: narrations.length }
    }));
  }


  // Local edit helper
  function setSlideText(deckId, slideId, text) {
    setDeckNarrations(prev => ({
      ...prev,
      [deckId]: {
        bySlide: { ...(prev[deckId]?.bySlide || {}), [slideId]: text },
        count: prev[deckId]?.count || 0
      }
    }));
  }


  // Save edited narration (no overwrite)
  async function saveNarration(deckId, slideId) {
    const text = (deckNarrations[deckId]?.bySlide?.[slideId] || '').trim();
    if (!text) return;


    const res = await fetch('/api/prisma/narration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slideId, text, language: language || 'en', overwrite: false })
    });
    if (!res.ok) throw new Error('Save failed');
    appendLog(`Saved narration for slide ${slideId}`);
  }


  // Regenerate per slide (optimistic)
  async function regenerateNarration(deckId, slideId) {
    setRegenPending(p => ({ ...p, [slideId]: true }));
    const prev = deckNarrations[deckId]?.bySlide?.[slideId];


    try {
      // Replace this with your actual generator call
      const newText = `Auto-regenerated narration for slide ${slideId}.`;
      setSlideText(deckId, slideId, newText);


      await fetch('/api/prisma/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideId, text: newText, language: language || 'en', overwrite: true })
      });


      appendLog(`Regenerated narration for slide ${slideId}`);
    } catch (e) {
      setSlideText(deckId, slideId, prev || 'Narration unavailable for this slide.');
      appendLog(`Regenerate error: ${e.message}`);
    } finally {
      setRegenPending(p => ({ ...p, [slideId]: false }));
    }
  }


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
      {/* NEW: Image Modal */}
      {modalImageUrl && (
        <div
          onClick={() => setModalImageUrl(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            cursor: 'pointer'
          }}
        >
          <img
            src={modalImageUrl}
            alt="Expanded slide"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              boxShadow: '0 0 20px rgba(0,0,0,0.5)',
              borderRadius: '8px'
            }}
          />
          <span style={{ position: 'absolute', top: 20, right: 30, fontSize: '2rem', color: 'white' }}>&times;</span>
        </div>
      )}

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


                <button
                  onClick={() => {
                    if (expandedNarrDeck === deck.id) {
                      setExpandedNarrDeck(null);
                    } else {
                      setExpandedNarrDeck(deck.id);
                      fetchNarrations(deck.id, language).catch(err => appendLog(`Error loading narrations: ${err.message}`));
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#0d6efd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    marginLeft: 8
                  }}
                >
                  {expandedNarrDeck === deck.id ? 'Hide Narrations' : 'Show Narrations'}
                </button>


                {expandedNarrDeck === deck.id && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <h4>
                      Narrations ({deckNarrations[deck.id]?.count ?? 0})
                    </h4>


                    {Array.isArray(deck.slides) && deck.slides.length > 0 ? (
                      <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* NEW: Modified loop to include thumbnails */}
                        {deck.slides.map((slide) => {
                          const slideId = Number(slide.id);
                          const text = deckNarrations[deck.id]?.bySlide?.[slideId] ?? 'Narration unavailable for this slide.';
                          return (
                            <li key={slideId} style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                {/* NEW: Expandable thumbnail image. Assumes 'slide.imageUrl' property exists. */}
                                {slide.image ? (
                                  <img
                                    src={slide.image}
                                    alt={`Thumbnail for Slide ${slideId}`}
                                    style={{ width: 120, height: 'auto', borderRadius: 4, cursor: 'pointer', border: '1px solid #eee' }}
                                    onClick={() => setModalImageUrl(slide.image)}
                                    title="Click to expand"
                                  />
                                ) : (
                                  <div style={{ width: 120, height: 70, background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontSize: 12, color: '#6c757d', textAlign: 'center', border: '1px solid #dee2e6' }}>No Image</div>
                                )}

                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                                    Slide #{slideId}
                                  </div>
                                  <textarea
                                    value={text}
                                    onChange={(e) => setSlideText(deck.id, slideId, e.target.value)}
                                    rows={3}
                                    style={{ width: '100%', border: '1px solid #ccc', borderRadius: 4, padding: 8 }}
                                  />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <button
                                    onClick={() => regenerateNarration(deck.id, slideId)}
                                    disabled={!!regenPending[slideId]}
                                    style={{ padding: '6px 10px', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                                    title="Regenerate narration for this slide"
                                  >
                                    {regenPending[slideId] ? 'Regenerating…' : 'Regen'}
                                  </button>

                                  <button
                                    onClick={() => saveNarration(deck.id, slideId)}
                                    style={{ padding: '6px 10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                                    title="Save edited narration"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p>No slides in this deck.</p>
                    )}
                  </div>
                )}


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

