import React from 'react';

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f8f9fa'
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '1rem',
    boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
  },
  sidebarTitle: {
    fontSize: '1.5rem',
    marginBottom: '2rem',
    textAlign: 'center',
    fontWeight: 'bold',
    borderBottom: '2px solid #34495e',
    paddingBottom: '1rem'
  },
  sidebarNav: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  sidebarNavItem: {
    marginBottom: '0.5rem'
  },
  sidebarNavLink: {
    color: 'white',
    textDecoration: 'none',
    padding: '0.75rem 1rem',
    display: 'block',
    borderRadius: '6px',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem'
  },
  content: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    minHeight: '100vh'
  },
  header: {
    backgroundColor: 'white',
    padding: '1rem 2rem',
    borderBottom: '1px solid #dee2e6',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    color: '#2c3e50',
    margin: 0,
    fontSize: '1.5rem'
  },
  headerInfo: {
    color: '#6c757d',
    fontSize: '0.9rem'
  }
};

export default function AdminLayout({ children }) {
  const handleLinkHover = (e) => {
    e.target.style.backgroundColor = '#34495e';
    e.target.style.transform = 'translateX(5px)';
  };

  const handleLinkLeave = (e) => {
    e.target.style.backgroundColor = 'transparent';
    e.target.style.transform = 'translateX(0)';
  };

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>CAIREgen Admin</h2>
        <nav>
          <ul style={styles.sidebarNav}>
            <li style={styles.sidebarNavItem}>
              <a 
                href="/admin" 
                style={styles.sidebarNavLink}
                onMouseEnter={handleLinkHover}
                onMouseLeave={handleLinkLeave}
              >
                📊 Dashboard
              </a>
            </li>
            <li style={styles.sidebarNavItem}>
              <a 
                href="/admin" 
                style={styles.sidebarNavLink}
                onMouseEnter={handleLinkHover}
                onMouseLeave={handleLinkLeave}
              >
                📑 All Decks
              </a>
            </li>
            <li style={styles.sidebarNavItem}>
              <a 
                href="/upload" 
                style={styles.sidebarNavLink}
                onMouseEnter={handleLinkHover}
                onMouseLeave={handleLinkLeave}
              >
                ➕ Create New
              </a>
            </li>
            <li style={styles.sidebarNavItem}>
              <a 
                href="/" 
                style={styles.sidebarNavLink}
                onMouseEnter={handleLinkHover}
                onMouseLeave={handleLinkLeave}
              >
                🏠 Back to App
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      
      <main style={styles.content}>
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>Admin Dashboard</h1>
          <div style={styles.headerInfo}>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </header>
        <div style={{ padding: '2rem' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
