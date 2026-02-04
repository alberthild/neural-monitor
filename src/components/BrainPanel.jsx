import React, { useState, useEffect } from 'react'

// Configurable endpoint (set via environment variable)
const BRAIN_API = import.meta.env.VITE_BRAIN_API || 'http://localhost:8767'

// Mini bar chart component
function MiniBar({ value, max, color = '#00ff88' }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="mini-bar">
      <div className="mini-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// Stats card
function StatCard({ icon, label, value, trend, color = '#00ff88' }) {
  return (
    <div className="stat-card" style={{ borderColor: color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
        {trend && <div className="stat-trend">{trend}</div>}
      </div>
    </div>
  )
}

export default function BrainPanel() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({ commits: true, claims: false, learning: true, facts: true })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BRAIN_API}/dashboard`)
        if (res.ok) {
          setData(await res.json())
        }
      } catch (e) {
        console.error('Brain API error:', e)
      }
      setLoading(false)
    }
    
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="brain-panel loading">
        <div className="brain-header">
          <h3>🧠 Neural Core</h3>
          <div className="pulse" />
        </div>
        <p className="loading-text">Initializing neural pathways...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="brain-panel error">
        <div className="brain-header">
          <h3>🧠 Neural Core</h3>
        </div>
        <p className="error-text">❌ Brain API offline (port 8767)</p>
      </div>
    )
  }

  const { brain, learning, facts } = data

  return (
    <div className="brain-panel">
      <div className="brain-header">
        <h3>🧠 Neural Core</h3>
        <div className="pulse active" />
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <StatCard 
          icon="📋" 
          label="Commitments" 
          value={brain.commitments.length}
          color="#ff6b6b"
        />
        <StatCard 
          icon="💡" 
          label="Claims" 
          value={brain.claimsCount}
          color="#4ecdc4"
        />
        <StatCard 
          icon="⚠️" 
          label="Contradictions" 
          value={brain.contradictions.length}
          color={brain.contradictions.length > 0 ? '#ff0000' : '#00ff88'}
        />
        <StatCard 
          icon="📚" 
          label="Facts" 
          value={facts?.total || 0}
          color="#a855f7"
        />
      </div>

      {/* Commitments */}
      <div className="brain-section">
        <div 
          className="section-header" 
          onClick={() => setExpanded(e => ({ ...e, commits: !e.commits }))}
        >
          <span>📋 Active Commitments</span>
          <span className="toggle">{expanded.commits ? '−' : '+'}</span>
        </div>
        {expanded.commits && (
          <div className="section-content">
            {brain.commitments.length === 0 ? (
              <p className="empty">No open commitments</p>
            ) : (
              brain.commitments.map(c => (
                <div key={c.id} className={`commitment-item ${c.type || 'standard'}`}>
                  <div className="commitment-badge">
                    {c.type === 'rule' ? '⚡' : c.deadline === 'permanent' ? '🔒' : '📌'}
                  </div>
                  <div className="commitment-content">
                    <div className="commitment-what">{c.what}</div>
                    <div className="commitment-meta">
                      <span className="tag who">👤 {c.who}</span>
                      <span className="tag date">📅 {c.date}</span>
                      {c.deadline && c.deadline !== 'permanent' && (
                        <span className="tag deadline">⏰ {c.deadline}</span>
                      )}
                      {c.deadline === 'permanent' && (
                        <span className="tag permanent">∞ Permanent</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Contradictions Alert */}
      {brain.contradictions.length > 0 && (
        <div className="brain-section contradictions-alert">
          <div className="section-header alert">
            <span>🚨 Contradictions Detected!</span>
          </div>
          <div className="section-content">
            {brain.contradictions.map(c => (
              <div key={c.id} className="contradiction-item">
                <div className="severity-badge">{c.severity?.toUpperCase()}</div>
                <div className="contradiction-content">
                  <div className="why">{c.why}</div>
                  <div className="details">
                    <span>Claim 1: {c.claim1_text?.slice(0, 50)}...</span>
                    <span>Claim 2: {c.claim2_text?.slice(0, 50)}...</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Context */}
      <div className="brain-section learning">
        <div 
          className="section-header"
          onClick={() => setExpanded(e => ({ ...e, learning: !e.learning }))}
        >
          <span>🎓 Learning Context</span>
          <span className="toggle">{expanded.learning ? '−' : '+'}</span>
        </div>
        {expanded.learning && (
          <div className="section-content">
            {/* Topics */}
            <div className="topics-section">
              <h4>🎯 Active Topics</h4>
              <div className="topics-grid">
                {(learning.topTopics || []).slice(0, 8).map((t, i) => (
                  <div key={i} className="topic-card">
                    <span className="topic-name">{t.topic || t.name}</span>
                    <MiniBar value={t.count} max={learning.topTopics[0]?.count || 100} />
                    <span className="topic-count">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Signals */}
            <div className="signals-section">
              <h4>📊 Feedback Signals</h4>
              <div className="signals-grid">
                <div className="signal positive">
                  <span className="signal-icon">✅</span>
                  <span className="signal-count">{learning.signals?.positive || 0}</span>
                  <span className="signal-label">Positive</span>
                </div>
                <div className="signal negative">
                  <span className="signal-icon">❌</span>
                  <span className="signal-count">{learning.signals?.negative || 0}</span>
                  <span className="signal-label">Negative</span>
                </div>
                <div className="signal corrections">
                  <span className="signal-icon">🔧</span>
                  <span className="signal-count">{learning.signals?.corrections || 0}</span>
                  <span className="signal-label">Corrections</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Knowledge Facts */}
      <div className="brain-section facts">
        <div 
          className="section-header"
          onClick={() => setExpanded(e => ({ ...e, facts: !e.facts }))}
        >
          <span>📚 Knowledge Graph</span>
          <span className="toggle">{expanded.facts ? '−' : '+'}</span>
        </div>
        {expanded.facts && (
          <div className="section-content">
            {facts?.recent?.length > 0 ? (
              <div className="facts-list">
                {facts.recent.slice(0, 5).map((f, i) => (
                  <div key={i} className="fact-item">
                    <span className="fact-entity">{f.entity}</span>
                    <span className="fact-text">{f.fact}</span>
                    <span className="fact-date">{f.date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty">No facts extracted yet</p>
            )}
            <div className="facts-stats">
              <span>People: {facts?.byType?.people || 0}</span>
              <span>Companies: {facts?.byType?.companies || 0}</span>
              <span>Decisions: {facts?.byType?.decisions || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* Claims (collapsed by default) */}
      <div className="brain-section claims">
        <div 
          className="section-header"
          onClick={() => setExpanded(e => ({ ...e, claims: !e.claims }))}
        >
          <span>💭 Recent Claims ({brain.claimsCount})</span>
          <span className="toggle">{expanded.claims ? '−' : '+'}</span>
        </div>
        {expanded.claims && (
          <div className="section-content claims-list">
            {(brain.recentClaims || []).map(c => (
              <div key={c.id} className="claim-item">
                <span className="claim-topic">{c.topic || 'general'}</span>
                <span className="claim-text">{c.claim}</span>
                <span className="claim-date">{c.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="brain-footer">
        <span className="update-time">
          Last sync: {new Date(data.timestamp).toLocaleTimeString()}
        </span>
        <span className="api-status online">● Online</span>
      </div>
    </div>
  )
}
