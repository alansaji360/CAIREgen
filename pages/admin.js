import React, { useState, useEffect } from 'react';

export default function AdminPage() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const appendLog = (msg) => setStatus(`[${new Date().toLocaleTimeString()}] ${msg}`);

  // Fetch all decks on page load
  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/decks');
      if (!response.ok) throw new Error('Failed to fetch decks');
      
      const data = await response.json();
      setDecks(data);
      appendLog(`✅ Loaded ${data.length} decks`);
    } catch (error) {
      console.error('Error fetching decks:', error);
      appendLog(`❌ Error loading decks: ${error.message}`);
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
        throw new Error(errorData.error || 'Failed to delete deck');
      }

      // Remove from local state
      setDecks(decks.filter(deck => deck.id !== deckId));
      appendLog(`✅ Successfully deleted "${deckTitle}"`);
      
    } catch (error) {
      console.error('Error deleting deck:', error);
      appendLog(`❌ Error deleting deck: ${error.message}`);
    }
  };

  const deleteMultiple = async (selectedIds) => {
    if (selectedIds.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} decks?`)) {
      return;
    }

    appendLog(`🗑️ Deleting ${selectedIds.length} decks...`);
    
    try {
      const response = await fetch('/api/admin/decks/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete decks');
      }

      // Remove from local state
      setDecks(decks.filter(deck => !selectedIds.includes(deck.id)));
      setSelectedDecks([]);
      appendLog(`✅ Successfully deleted ${selectedIds.length} decks`);
      
    } catch (error) {
      console.error('Error deleting decks:', error);
      appendLog(`❌ Error deleting decks: ${error.message}`);
    }
  };

  // Search and selection functionality
  const [selectedDecks, setSelectedDecks] = useState([]);
  
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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>🔧 Admin - Deck Management</h1>
        <div>
          <a href="/upload" style={{ 
            padding: '8px 16px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '4px',
            marginRight: '10px'
          }}>
            ➕ Create New Deck
          </a>
          <a href="/" style={{ 
            padding: '8px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '4px'
          }}>
            🏠 Home
          </a>
        </div>
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
            style={{
              padding: '8px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              marginRight: '8px'
            }}
          >
            {selectedDecks.length === filteredDecks.length ? 'Unselect All' : 'Select All'}
          </button>
          
          {selectedDecks.length > 0 && (
            <button
              onClick={() => deleteMultiple(selectedDecks)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              🗑️ Delete Selected ({selectedDecks.length})
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

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <a
                  href={`/?deck=${deck.id}`}
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
                  👁️ View
                </a>
                
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?deck=${deck.id}`)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  📋 Copy Link
                </button>
                
                <button
                  onClick={() => deleteDeck(deck.id, deck.title)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  🗑️ Delete
                </button>
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
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        <h3>Status Log:</h3>
        <div>{status || 'Ready...'}</div>
      </div>
    </div>
  );
}