import React from 'react';

const styles = {
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    textAlign: 'center',
    border: '1px solid #e9ecef',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  statCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 15px rgba(0,0,0,0.1)'
  },
  statIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
    display: 'block'
  },
  statNumber: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '0.5rem',
    display: 'block'
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: '500'
  },
  statTrend: {
    fontSize: '0.8rem',
    marginTop: '0.5rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    display: 'inline-block'
  },
  trendUp: {
    backgroundColor: '#d4edda',
    color: '#155724'
  },
  trendDown: {
    backgroundColor: '#f8d7da',
    color: '#721c24'
  },
  loading: {
    backgroundColor: '#f8f9fa',
    color: '#6c757d'
  }
};

export default function StatsCards({ stats = {}, loading = false }) {
  const [hoveredCard, setHoveredCard] = React.useState(null);

  const defaultStats = {
    totalDecks: 0,
    totalSlides: 0,
    decksToday: 0,
    avgSlidesPerDeck: 0,
    ...stats
  };

  const statsConfig = [
    {
      key: 'totalDecks',
      icon: '📊',
      label: 'Total Decks',
      value: defaultStats.totalDecks,
      color: '#3498db',
      trend: defaultStats.decksToday > 0 ? 'up' : null
    },
    {
      key: 'totalSlides',
      icon: '📑',
      label: 'Total Slides',
      value: defaultStats.totalSlides,
      color: '#27ae60',
      trend: null
    },
    {
      key: 'decksToday',
      icon: '🆕',
      label: 'Created Today',
      value: defaultStats.decksToday,
      color: '#e74c3c',
      trend: defaultStats.decksToday > 0 ? 'up' : null
    },
    {
      key: 'avgSlidesPerDeck',
      icon: '📈',
      label: 'Avg Slides/Deck',
      value: defaultStats.avgSlidesPerDeck,
      color: '#f39c12',
      trend: null
    }
  ];

  if (loading) {
    return (
      <div style={styles.statsContainer}>
        {statsConfig.map((stat) => (
          <div key={stat.key} style={{ ...styles.statCard, ...styles.loading }}>
            <div style={styles.statIcon}>⏳</div>
            <div style={styles.statNumber}>---</div>
            <div style={styles.statLabel}>Loading...</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={styles.statsContainer}>
      {statsConfig.map((stat) => (
        <div
          key={stat.key}
          style={{
            ...styles.statCard,
            ...(hoveredCard === stat.key ? styles.statCardHover : {})
          }}
          onMouseEnter={() => setHoveredCard(stat.key)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div style={styles.statIcon}>{stat.icon}</div>
          <div style={{ ...styles.statNumber, color: stat.color }}>
            {stat.value.toLocaleString()}
          </div>
          <div style={styles.statLabel}>{stat.label}</div>
          
          {stat.trend && (
            <div style={{
              ...styles.statTrend,
              ...(stat.trend === 'up' ? styles.trendUp : styles.trendDown)
            }}>
              {stat.trend === 'up' ? '↗️ Active' : '↘️ Inactive'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
