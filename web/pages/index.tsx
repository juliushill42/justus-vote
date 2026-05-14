import { useEffect, useState } from 'react'
import Head from 'next/head'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8091'

type District = {
  id: number; state: string; district: string; old_rep: string; new_rep: string
  black_pct: number; change_type: string; status: string; details: string; affected_voters: number
}
type Lawsuit = {
  id: number; title: string; state: string; plaintiff: string; defendant: string
  status: string; court: string; filed_date: string; summary: string; action_url: string
}
type Incident = {
  id: number; state: string; city: string; incident_type: string; description: string; verified: boolean; created_at: string
}
type Action = {
  id: number; title: string; description: string; action_url: string; action_type: string; urgency: string; state: string
}
type Stats = { total_districts: number; total_affected_voters: number; active_lawsuits: number; total_incidents: number; states_under_attack: number }

const STATUS_COLOR: Record<string, string> = {
  injunction_sought: '#f59e0b', filed: '#3b82f6', ruling_pending: '#8b5cf6',
  active: '#ef4444', lawsuit: '#f59e0b', blocked: '#22c55e', won: '#22c55e', lost: '#ef4444', appealed: '#8b5cf6', upheld: '#6b7280'
}
const CHANGE_COLOR: Record<string, string> = {
  eliminated: '#ef4444', diluted: '#f59e0b', split: '#f97316', purged: '#c084fc'
}
const URGENCY_COLOR: Record<string, string> = {
  critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6'
}

export default function Home() {
  const [tab, setTab] = useState(0)
  const [districts, setDistricts] = useState<District[]>([])
  const [lawsuits, setLawsuits] = useState<Lawsuit[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [report, setReport] = useState({ state: '', city: '', incident_type: '', description: '' })
  const [reportSent, setReportSent] = useState(false)
  const [filterState, setFilterState] = useState('')

  useEffect(() => {
    fetch(`${API}/api/stats`).then(r => r.json()).then(setStats).catch(() => {})
    fetch(`${API}/api/districts`).then(r => r.json()).then(d => setDistricts(d || [])).catch(() => {})
    fetch(`${API}/api/lawsuits`).then(r => r.json()).then(d => setLawsuits(d || [])).catch(() => {})
    fetch(`${API}/api/incidents`).then(r => r.json()).then(d => setIncidents(d || [])).catch(() => {})
    fetch(`${API}/api/actions`).then(r => r.json()).then(d => setActions(d || [])).catch(() => {})
  }, [])

  async function submitReport() {
    if (!report.state || !report.city || !report.incident_type || !report.description) return
    await fetch(`${API}/api/incidents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) })
    setReportSent(true)
  }

  const filteredDistricts = filterState ? districts.filter(d => d.state === filterState) : districts
  const states = [...new Set(districts.map(d => d.state))].sort()

  return (
    <>
      <Head>
        <title>JustUs Vote — Black Voting Rights Tracker</title>
        <meta name="description" content="Real-time tracker of redistricting attacks, active lawsuits, and voter suppression against Black communities." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=IBM+Plex+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="root">
        {/* HEADER */}
        <header className="header">
          <div className="header-inner">
            <div className="logo">
              <div className="logo-mark">JU</div>
              <div>
                <div className="logo-name">JUSTUS VOTE</div>
                <div className="logo-sub">BLACK VOTING RIGHTS COMMAND · © JULIUS CAMERON HILL · JCH-2026</div>
              </div>
            </div>
            <div className="header-right">
              <span className="live-dot" />
              <span className="live-label">LIVE TRACKER</span>
            </div>
          </div>
        </header>

        {/* ALERT BANNER */}
        <div className="alert-banner">
          ⚡ ACTIVE: Tennessee Republicans eliminated the only majority-Black congressional district — May 7, 2026. NAACP + ACLU lawsuits filed. Fight starts NOW.
        </div>

        <main className="main">
          {/* STATS */}
          {stats && (
            <div className="stats-grid">
              {[
                { label: 'DISTRICTS ATTACKED', value: stats.total_districts },
                { label: 'VOTERS AFFECTED', value: stats.total_affected_voters.toLocaleString() },
                { label: 'ACTIVE LAWSUITS', value: stats.active_lawsuits },
                { label: 'STATES UNDER ATTACK', value: stats.states_under_attack },
                { label: 'INCIDENTS REPORTED', value: stats.total_incidents },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* TABS */}
          <div className="tab-bar">
            {['DISTRICTS', 'LAWSUITS', 'REPORT', 'ACT NOW'].map((t, i) => (
              <button key={i} className={`tab-btn ${tab === i ? 'tab-active' : ''}`} onClick={() => setTab(i)}>{t}</button>
            ))}
          </div>

          {/* TAB 0: DISTRICTS */}
          {tab === 0 && (
            <div>
              <div className="filter-row">
                <span className="section-head">REDISTRICTING ATTACKS — REAL TIME</span>
                <select className="state-filter" value={filterState} onChange={e => setFilterState(e.target.value)}>
                  <option value="">All States</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {filteredDistricts.map(d => (
                <div key={d.id} className="district-card" onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                  <div className="district-header">
                    <div>
                      <div className="district-state">{d.state}</div>
                      <div className="district-name">{d.district}</div>
                    </div>
                    <div className="district-badges">
                      <span className="badge" style={{ background: CHANGE_COLOR[d.change_type] || '#6b7280' }}>{d.change_type.toUpperCase()}</span>
                      <span className="badge" style={{ background: STATUS_COLOR[d.status] || '#6b7280', opacity: 0.85 }}>{d.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="district-affected">
                    <span className="affected-num">{d.affected_voters.toLocaleString()}</span> voters affected · <span className="black-pct">{d.black_pct}% Black</span>
                  </div>
                  {expanded === d.id && (
                    <div className="district-detail">
                      <div className="detail-row">
                        <div className="detail-col">
                          <div className="detail-label">WAS</div>
                          <div className="detail-val">{d.old_rep}</div>
                        </div>
                        <div className="detail-arrow">→</div>
                        <div className="detail-col">
                          <div className="detail-label">NOW</div>
                          <div className="detail-val red">{d.new_rep}</div>
                        </div>
                      </div>
                      <p className="district-details">{d.details}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 1: LAWSUITS */}
          {tab === 1 && (
            <div>
              <div className="section-head" style={{ marginBottom: 16 }}>ACTIVE LEGAL BATTLES</div>
              {lawsuits.map(l => (
                <div key={l.id} className="lawsuit-card">
                  <div className="lawsuit-header">
                    <div className="lawsuit-state">{l.state}</div>
                    <span className="badge" style={{ background: STATUS_COLOR[l.status] || '#6b7280' }}>{l.status.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                  <div className="lawsuit-title">{l.title}</div>
                  <div className="lawsuit-meta">{l.plaintiff} v. {l.defendant}</div>
                  <div className="lawsuit-court">{l.court} · Filed {l.filed_date}</div>
                  <p className="lawsuit-summary">{l.summary}</p>
                  <a href={l.action_url} target="_blank" rel="noopener noreferrer" className="lawsuit-link">TAKE ACTION →</a>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: REPORT */}
          {tab === 2 && (
            <div className="report-wrap">
              <div className="section-head" style={{ marginBottom: 16 }}>REPORT VOTER SUPPRESSION</div>
              {reportSent ? (
                <div className="success-box">
                  <div className="success-icon">✊</div>
                  <div className="success-title">REPORTED</div>
                  <div className="success-sub">Your report has been logged. Every incident documented builds the legal case. Thank you for fighting back.</div>
                </div>
              ) : (
                <div className="form-card">
                  <div className="form-row">
                    <label className="form-label">STATE *</label>
                    <input className="form-input" value={report.state} onChange={e => setReport({ ...report, state: e.target.value })} placeholder="Tennessee" />
                  </div>
                  <div className="form-row">
                    <label className="form-label">CITY *</label>
                    <input className="form-input" value={report.city} onChange={e => setReport({ ...report, city: e.target.value })} placeholder="Memphis" />
                  </div>
                  <div className="form-row">
                    <label className="form-label">TYPE OF SUPPRESSION *</label>
                    <select className="form-input" value={report.incident_type} onChange={e => setReport({ ...report, incident_type: e.target.value })}>
                      <option value="">— Select —</option>
                      {['District Eliminated', 'Polling Place Closed', 'Voter Roll Purge', 'ID Requirement', 'Long Wait Times', 'Intimidation', 'Misinformation', 'Registration Denied', 'Other'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <label className="form-label">DESCRIBE WHAT HAPPENED *</label>
                    <textarea className="form-textarea" value={report.description} onChange={e => setReport({ ...report, description: e.target.value })} placeholder="What happened, when, where, who was involved..." />
                  </div>
                  <button className="submit-btn" onClick={submitReport}>SUBMIT REPORT</button>
                  <div className="form-note">Reports are encrypted and shared with legal partners. You are protected.</div>
                </div>
              )}

              <div className="section-head" style={{ marginTop: 32, marginBottom: 16 }}>COMMUNITY REPORTS</div>
              {incidents.map(i => (
                <div key={i.id} className="incident-card">
                  <div className="incident-header">
                    <span className="incident-location">{i.city}, {i.state}</span>
                    {i.verified && <span className="verified-badge">✓ VERIFIED</span>}
                  </div>
                  <div className="incident-type">{i.incident_type}</div>
                  <p className="incident-desc">{i.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: ACT NOW */}
          {tab === 3 && (
            <div>
              <div className="section-head" style={{ marginBottom: 16 }}>WHAT YOU CAN DO RIGHT NOW</div>
              {actions.map(a => (
                <a key={a.id} href={a.action_url} target="_blank" rel="noopener noreferrer" className="action-card">
                  <div className="action-header">
                    <span className="urgency-badge" style={{ background: URGENCY_COLOR[a.urgency] || '#6b7280' }}>{a.urgency.toUpperCase()}</span>
                    {a.state && <span className="action-state">{a.state}</span>}
                  </div>
                  <div className="action-title">{a.title}</div>
                  <p className="action-desc">{a.description}</p>
                  <div className="action-cta">TAKE ACTION →</div>
                </a>
              ))}
            </div>
          )}
        </main>

        <footer className="footer">
          © 2026 Julius Cameron Hill · TitanU AI LLC · JCH-2026 Patent Series · justus-ai.online
        </footer>
      </div>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #030508; color: #e8dfc8; font-family: 'IBM Plex Sans', sans-serif; }
        .root { min-height: 100vh; }

        .header { background: #07090d; border-bottom: 1px solid #c8962233; padding: 0 24px; }
        .header-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 60px; }
        .logo { display: flex; align-items: center; gap: 12px; }
        .logo-mark { width: 34px; height: 34px; background: #c89622; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 13px; color: #030508; }
        .logo-name { font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 16px; letter-spacing: 2px; }
        .logo-sub { font-size: 9px; color: #c89622; letter-spacing: 1.5px; margin-top: 1px; }
        .header-right { display: flex; align-items: center; gap: 8px; }
        .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c893; box-shadow: 0 0 8px #22c89388; animation: blink 1.5s infinite; }
        .live-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #22c893; letter-spacing: 2px; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .alert-banner { background: #7f1d1d; border-bottom: 1px solid #ef444444; padding: 12px 24px; text-align: center; font-size: 12px; font-family: 'IBM Plex Mono', monospace; letter-spacing: 1px; color: #fecaca; line-height: 1.5; }

        .main { max-width: 1100px; margin: 0 auto; padding: 32px 24px 80px; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 32px; }
        .stat-card { background: #07090d; border: 1px solid #c8962233; border-radius: 6px; padding: 16px; text-align: center; }
        .stat-value { font-family: 'IBM Plex Mono', monospace; font-size: 22px; font-weight: 700; color: #c89622; }
        .stat-label { font-size: 9px; color: #e8dfc866; letter-spacing: 2px; margin-top: 4px; }

        .tab-bar { display: flex; border-bottom: 1px solid #c8962233; margin-bottom: 24px; overflow-x: auto; }
        .tab-btn { background: transparent; color: #e8dfc866; border: none; padding: 12px 20px; font-size: 11px; font-family: 'IBM Plex Mono', monospace; font-weight: 700; letter-spacing: 2px; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
        .tab-btn:hover { color: #c89622; }
        .tab-active { background: #c89622; color: #030508 !important; }

        .section-head { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 3px; color: #c89622; font-weight: 700; }
        .filter-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
        .state-filter { background: #07090d; border: 1px solid #c8962244; border-radius: 4px; padding: 6px 12px; color: #e8dfc8; font-family: 'IBM Plex Mono', monospace; font-size: 11px; cursor: pointer; outline: none; }

        .district-card { background: #07090d; border: 1px solid #c8962222; border-radius: 6px; padding: 18px; margin-bottom: 10px; cursor: pointer; transition: border-color 0.15s; }
        .district-card:hover { border-color: #c8962255; }
        .district-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px; }
        .district-state { font-size: 10px; color: #c89622; letter-spacing: 2px; font-family: 'IBM Plex Mono', monospace; }
        .district-name { font-size: 15px; font-weight: 700; margin-top: 2px; }
        .district-badges { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
        .badge { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 2px; color: #fff; letter-spacing: 1px; }
        .district-affected { font-size: 12px; color: #e8dfc877; }
        .affected-num { color: #ef4444; font-weight: 700; font-family: 'IBM Plex Mono', monospace; }
        .black-pct { color: #c89622; }
        .district-detail { margin-top: 16px; border-top: 1px solid #c8962222; padding-top: 16px; }
        .detail-row { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
        .detail-col { flex: 1; }
        .detail-label { font-size: 9px; letter-spacing: 2px; color: #e8dfc855; font-family: 'IBM Plex Mono', monospace; margin-bottom: 3px; }
        .detail-val { font-size: 13px; font-weight: 600; }
        .detail-val.red { color: #ef4444; }
        .detail-arrow { color: #ef4444; font-size: 18px; font-weight: 700; }
        .district-details { font-size: 12px; color: #e8dfc8aa; line-height: 1.7; }

        .lawsuit-card { background: #07090d; border: 1px solid #c8962222; border-radius: 6px; padding: 20px; margin-bottom: 12px; }
        .lawsuit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .lawsuit-state { font-size: 10px; color: #c89622; letter-spacing: 2px; font-family: 'IBM Plex Mono', monospace; }
        .lawsuit-title { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
        .lawsuit-meta { font-size: 11px; color: #e8dfc877; margin-bottom: 4px; font-style: italic; }
        .lawsuit-court { font-size: 10px; color: #e8dfc855; font-family: 'IBM Plex Mono', monospace; margin-bottom: 10px; }
        .lawsuit-summary { font-size: 12px; color: #e8dfc8aa; line-height: 1.7; margin-bottom: 12px; }
        .lawsuit-link { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 700; color: #c89622; text-decoration: none; letter-spacing: 1px; border-bottom: 1px solid #c8962244; padding-bottom: 1px; }
        .lawsuit-link:hover { color: #f0b429; border-color: #f0b429; }

        .report-wrap { max-width: 640px; }
        .form-card { background: #07090d; border: 1px solid #c8962222; border-radius: 6px; padding: 24px; }
        .form-row { margin-bottom: 16px; }
        .form-label { display: block; font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 2px; color: #c89622; margin-bottom: 6px; }
        .form-input { width: 100%; background: #030508; border: 1px solid #c8962244; border-radius: 4px; padding: 10px 14px; color: #e8dfc8; font-family: inherit; font-size: 13px; outline: none; }
        .form-input:focus { border-color: #c89622; }
        .form-textarea { width: 100%; background: #030508; border: 1px solid #c8962244; border-radius: 4px; padding: 10px 14px; color: #e8dfc8; font-family: inherit; font-size: 13px; outline: none; resize: vertical; min-height: 100px; }
        .form-textarea:focus { border-color: #c89622; }
        .submit-btn { width: 100%; background: #c89622; color: #030508; border: none; border-radius: 4px; padding: 14px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 700; letter-spacing: 2px; cursor: pointer; }
        .submit-btn:hover { background: #f0b429; }
        .form-note { font-size: 10px; color: #e8dfc844; text-align: center; margin-top: 8px; letter-spacing: 1px; }
        .success-box { background: #052e16; border: 1px solid #22c893; border-radius: 6px; padding: 40px; text-align: center; }
        .success-icon { font-size: 40px; margin-bottom: 12px; }
        .success-title { font-family: 'IBM Plex Mono', monospace; font-size: 16px; font-weight: 700; color: #22c893; letter-spacing: 3px; margin-bottom: 8px; }
        .success-sub { font-size: 13px; color: #e8dfc8aa; line-height: 1.6; }
        .incident-card { background: #07090d; border: 1px solid #c8962222; border-radius: 6px; padding: 16px; margin-bottom: 8px; }
        .incident-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .incident-location { font-size: 11px; color: #c89622; font-family: 'IBM Plex Mono', monospace; letter-spacing: 1px; }
        .verified-badge { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: #22c893; border: 1px solid #22c89344; padding: 2px 6px; border-radius: 2px; }
        .incident-type { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
        .incident-desc { font-size: 12px; color: #e8dfc8aa; line-height: 1.6; }

        .action-card { display: block; background: #07090d; border: 1px solid #c8962222; border-radius: 6px; padding: 20px; margin-bottom: 10px; text-decoration: none; color: inherit; transition: border-color 0.15s; }
        .action-card:hover { border-color: #c89622; }
        .action-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .urgency-badge { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 2px; color: #fff; letter-spacing: 1px; }
        .action-state { font-size: 10px; color: #c89622; letter-spacing: 1px; font-family: 'IBM Plex Mono', monospace; }
        .action-title { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
        .action-desc { font-size: 12px; color: #e8dfc8aa; line-height: 1.6; margin-bottom: 10px; }
        .action-cta { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 700; color: #c89622; letter-spacing: 1px; }

        .footer { border-top: 1px solid #c8962222; padding: 16px 24px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: #e8dfc833; letter-spacing: 2px; }

        select option { background: #07090d; }
        input::placeholder, textarea::placeholder { color: #e8dfc833; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #030508; } ::-webkit-scrollbar-thumb { background: #c8962244; }
      `}</style>
    </>
  )
}
