# JustUs Vote — Black Voting Rights Command Center
**© Julius Cameron Hill · TitanU AI LLC · JCH-2026**
**justus-ai.online**

---

## What This Is

A real-time tracker that shows Black communities exactly what is being done to their voting power — redistricting attacks, active lawsuits, voter suppression incidents — and what they can do about it TODAY.

Built to connect to justus-ai.online as a standalone module.

---

## Stack

| Layer | Technology |
|-------|-----------|
| API | Go + Gin |
| Database | PostgreSQL 16 |
| Frontend | Next.js 14 + TypeScript |
| Reverse Proxy | Nginx |
| Container | Docker Compose |

---

## What's Pre-Loaded (Real Data, May 2026)

**8 Redistricting Attacks**
- Tennessee — only majority-Black congressional district eliminated (May 7, 2026)
- Tennessee — every Black lawmaker stripped from all committees
- Alabama — defied Supreme Court order on majority-Black district
- Louisiana — maps eliminating majority-Black districts despite court orders
- Virginia, Georgia, North Carolina, Florida — documented attacks

**6 Active Lawsuits**
- NAACP v. Tennessee Special Session (filed May 8, 2026)
- ACLU v. Tennessee on behalf of Memphis voters (filed May 11, 2026)
- NAACP LDF v. Alabama (pending Supreme Court)
- Galmon v. Ardoin — Louisiana (5th Circuit)
- NAACP v. Virginia
- Common Cause v. North Carolina (4th Circuit)

**5 Community Reports** — verified incidents including polling closures, voter roll purges, and legislative retaliation

**8 Call-to-Action Items** — ordered by urgency (CRITICAL → HIGH → MEDIUM), linked directly to petitions, lawsuits, and registration tools

---

## Project Structure

```
justus-vote/
├── api/
│   ├── main.go          # Go API — all endpoints
│   ├── go.mod           # Go dependencies
│   └── Dockerfile       # API container build
├── web/
│   ├── pages/
│   │   └── index.tsx    # Full Next.js frontend
│   ├── next.config.js
│   ├── package.json
│   └── Dockerfile       # Frontend container build
├── db/
│   └── schema.sql       # Tables + all real seeded data
├── nginx/
│   └── vote.conf        # Nginx routing config
├── docker-compose.yml   # Full stack orchestration
└── Makefile             # Simple deploy commands
```

---

## Deploy — Local or Server

### Requirements
- Docker
- Docker Compose v2+

### Step 1 — Clone / Unzip

```bash
unzip justus-vote.zip
cd justus-vote
```

### Step 2 — Start Everything

```bash
make up
```

This single command:
1. Starts PostgreSQL and runs schema.sql (creates tables + seeds all real data)
2. Builds and starts the Go API on port 8091
3. Builds and starts the Next.js frontend on port 3001
4. Starts Nginx on port 80 routing everything

### Step 3 — Verify

```bash
# Check API health
curl http://localhost:8091/health

# Check stats
curl http://localhost:8091/api/stats
```

Open browser → `http://localhost`

---

## Connect to justus-ai.online

### Option A — Subdomain (vote.justus-ai.online)

In your DNS, add an A record:
```
vote.justus-ai.online → YOUR_SERVER_IP
```

The included `nginx/vote.conf` already handles this. No code change needed.

### Option B — Path on existing domain (/vote)

Add this block to your existing JustUs nginx config:

```nginx
location /vote {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location /vote-api/ {
    proxy_pass http://localhost:8091/api/;
    proxy_set_header Host $host;
}
```

### SSL (Certbot)

```bash
sudo certbot --nginx -d vote.justus-ai.online
```

---

## API Endpoints

All endpoints return JSON.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/api/stats` | Dashboard numbers |
| GET | `/api/districts` | All redistricting attacks |
| GET | `/api/districts?state=Tennessee` | Filter by state |
| GET | `/api/districts/:id` | Single district detail |
| GET | `/api/lawsuits` | All active lawsuits |
| GET | `/api/lawsuits?state=Alabama` | Filter by state |
| GET | `/api/incidents` | Community-reported incidents |
| POST | `/api/incidents` | Submit a new incident report |
| GET | `/api/actions` | Call-to-action items by urgency |

### POST /api/incidents — Body

```json
{
  "state": "Tennessee",
  "city": "Memphis",
  "incident_type": "Polling Place Closed",
  "description": "Three polling locations in majority-Black precincts shut down."
}
```

---

## Adding New Data

No code changes. Connect to the database and insert directly:

```bash
# Get into the database
docker compose exec db psql -U justus -d justus_vote

# Add a new redistricting attack
INSERT INTO districts (state, district, old_rep, new_rep, black_pct, change_type, status, details, affected_voters)
VALUES ('Texas', 'TX-18', 'Rep. Sheila Jackson Lee', 'GOP redrawn', 62.0, 'diluted', 'lawsuit', 'Details here.', 710000);

# Add a new lawsuit
INSERT INTO lawsuits (title, state, plaintiff, defendant, status, court, filed_date, summary, action_url)
VALUES ('NAACP v. Texas', 'Texas', 'Texas NAACP', 'State of Texas', 'filed', 'U.S. District Court, S.D. Texas', '2026-05-14', 'Summary.', 'https://naacpldf.org');
```

The frontend pulls live — changes appear immediately. No restart needed.

---

## Useful Commands

```bash
make up        # Start full stack
make down      # Stop full stack
make logs      # Follow all logs
make rebuild   # Full teardown and rebuild
```

---

## Ports

| Service | Port |
|---------|------|
| Nginx (public) | 80 |
| Go API | 8091 |
| Next.js | 3001 |
| PostgreSQL | 5432 (internal only) |

Port 8091 does not conflict with any existing JustUs ports.

---

## Frontend Tabs

**DISTRICTS** — Every redistricting attack. Click any card to expand details: who represented those voters before, who controls them now, how many Black voters were affected.

**LAWSUITS** — Every active legal battle with plaintiff, defendant, court, filing date, case summary, and direct link to take action.

**REPORT** — Community members submit incidents directly. Encrypted. Shared with legal partners.

**ACT NOW** — Petitions, donations, registration links, and contact tools ordered by urgency. CRITICAL items always float to the top.

---

## IP & Ownership

All code, architecture, and data structure:
**© 2026 Julius Cameron Hill · TitanU AI LLC**
Patent filing series JCH-2026
justus-ai.online

---

*Legal information only. Not legal advice. Consult a licensed attorney.*
