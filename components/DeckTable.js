import React, { useState } from 'react';

const styles = {
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    border: '1px solid #e9ecef'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    color: '#495057',
    padding: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #dee2e6'
  },
  tableTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#2c3e50'
  },
  tableControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  searchInput: {
    padding: '0.5rem 1rem',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    fontSize: '0.9rem',
    minWidth: '200px',
    outline: 'none',
    transition: 'border-color 0.3s ease'
  },
  searchInputFocus: {
    borderColor: '#007bff',
    boxShadow: '0 0 0 2px rgba(0,123,255,0.25)'
  },
  refreshButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    backgroundColor: '#f8f9fa',
    padding: '1rem 1.5rem',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '0.85rem',
    color: '#495057',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '2px solid #dee2e6'
  },
  td: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #f1f3f4',
    fontSize: '0.9rem',
    color: '#495057'
  },
  actionButton: {
    padding: '0.375rem 0.75rem',
    marginRight: '0.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'inline-block',
    textAlign: 'center'
  },
  viewButton: {
    backgroundColor: '#007bff',
    color: 'white'
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white'
  },
  emptyState: {
    padding: '3rem 2rem',
    textAlign: 'center',
    color: '#6c757d'
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    display: 'block'
  },
  deckId: {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    color: '#6c757d',
    backgroundColor: '#f8f9fa',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    marginTop: '0.25rem',
    display: 'inline-block'
  },
  statusBadge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500',
    textTransform: 'uppercase'
  },
  statusActive: {
    backgroundColor: '#d4edda',
    color: '#155724'
  }
};

export default function DeckTable({ decks = [], onDelete, onRefresh, loading = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredDecks = decks.filter(deck =>
    deck.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deck.avatar.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deck.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (deckId, deckTitle) => {
    if (window.confirm(`Are you sure you want to delete "${deckTitle}"?\n\nThis action cannot be undone.`)) {
      onDelete(deckId);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAvatarName = (avatarId) => {
    const avatarNames = {
      'avatar1': 'Professional',
      'avatar2': 'Friendly', 
      'avatar3': 'Creative',
      'avatar4': 'Tech'
    };
    return avatarNames[avatarId] || avatarId;
  };

  return (
    <div style={styles.tableContainer}>
      <div style={styles.tableHeader}>
        <h3 style={styles.tableTitle}>
          Presentation Decks ({filteredDecks.length})
        </h3>
        <div style={styles.tableControls}>
          <input
            type="text"
            placeholder="Search decks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              ...styles.searchInput,
              ...(searchFocused ? styles.searchInputFocus : {})
            }}
          />
          <button 
            onClick={onRefresh} 
            style={styles.refreshButton}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      
      {loading ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>⏳</div>
          <h4>Loading decks...</h4>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            {searchTerm ? '🔍' : '📊'}
          </div>
          <h4>{searchTerm ? 'No decks match your search' : 'No decks found'}</h4>
          <p>
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Create your first presentation deck to get started'
            }
          </p>
          {!searchTerm && (
            <a href="/upload" style={{
              ...styles.actionButton,
              ...styles.viewButton,
              textDecoration: 'none',
              marginTop: '1rem'
            }}>
              ➕ Create First Deck
            </a>
          )}
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Avatar</th>
              <th style={styles.th}>Slides</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDecks.map((deck) => (
              <tr key={deck.id} style={{ backgroundColor: 'white' }}>
                <td style={styles.td}>
                  <div>
                    <strong style={{ color: '#2c3e50' }}>{deck.title}</strong>
                    <div style={styles.deckId}>ID: {deck.id}</div>
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={{ fontWeight: '500' }}>
                    {getAvatarName(deck.avatar)}
                  </span>
                </td>
                <td style={styles.td}>
                  <strong style={{ color: '#007bff' }}>
                    {deck.slides?.length || 0}
                  </strong>
                </td>
                <td style={styles.td}>
                  {formatDate(deck.createdAt)}
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.statusBadge,
                    ...styles.statusActive
                  }}>
                    Active
                  </span>
                </td>
                <td style={styles.td}>
                  <a
                    href={`/?deck=${deck.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...styles.actionButton,
                      ...styles.viewButton,
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                  >
                    👁️ View
                  </a>
                  <button
                    onClick={() => handleDelete(deck.id, deck.title)}
                    style={{
                      ...styles.actionButton,
                      ...styles.deleteButton
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
