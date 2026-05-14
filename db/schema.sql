CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS districts (
  id SERIAL PRIMARY KEY,
  state VARCHAR(50) NOT NULL,
  district VARCHAR(100) NOT NULL,
  old_rep VARCHAR(100),
  new_rep VARCHAR(100),
  black_pct DECIMAL(5,2),
  change_type VARCHAR(30), -- eliminated | diluted | split | purged
  status VARCHAR(30) DEFAULT 'active', -- active | blocked | lawsuit | upheld
  details TEXT,
  affected_voters INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lawsuits (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  state VARCHAR(50),
  plaintiff VARCHAR(200),
  defendant VARCHAR(200),
  status VARCHAR(50), -- filed | injunction_sought | ruling_pending | won | lost | appealed
  court VARCHAR(200),
  filed_date DATE,
  summary TEXT,
  action_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  state VARCHAR(50) NOT NULL,
  city VARCHAR(100) NOT NULL,
  incident_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS actions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  action_url VARCHAR(500),
  action_type VARCHAR(50), -- petition | lawsuit | registration | contact | donate
  urgency VARCHAR(20) DEFAULT 'high', -- critical | high | medium
  state VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED: Real current redistricting attacks (May 2026)
INSERT INTO districts (state, district, old_rep, new_rep, black_pct, change_type, status, details, affected_voters) VALUES
('Tennessee', 'TN-09 Congressional', 'Rep. Steve Cohen (D)', 'GOP-drawn elimination', 56.8, 'eliminated', 'lawsuit', 'Tennessee Republicans held special session May 7 2026 and eliminated the state''s only majority-Black congressional district. New map gives GOP a projected 9-0 congressional delegation. NAACP and ACLU have filed emergency lawsuits.', 655000),
('Tennessee', 'TN House — All Democratic Committees', 'Full committee representation', 'Stripped by Speaker Sexton', 38.0, 'eliminated', 'active', 'Speaker Cameron Sexton removed every Democrat from all House committees after they protested the gerrymander. Removes every Black elected official in Tennessee legislature from their committee seats. Affects representation for nearly 2 million Tennesseans.', 1900000),
('Alabama', 'AL-07 Congressional', 'Rep. Terri Sewell (D)', 'GOP dilution map', 63.0, 'diluted', 'lawsuit', 'Alabama repeatedly defied SCOTUS orders to draw a second majority-Black district. State continued to use discriminatory maps through multiple election cycles while litigation proceeded.', 620000),
('Louisiana', 'LA-02 Congressional', 'Rep. Troy Carter (D)', 'GOP elimination attempt', 58.0, 'split', 'lawsuit', 'Louisiana Republicans drew maps eliminating majority-Black districts despite federal court orders. NAACP filed emergency injunction. Voters in majority-Black parishes split across three districts to dilute power.', 580000),
('Virginia', 'Multiple House Districts', 'Democratic incumbents', 'GOP redrawn', 32.0, 'diluted', 'active', 'Virginia Republicans redrew multiple state house districts reducing Black voter concentration in several majority-Black precincts in Richmond and Hampton Roads.', 420000),
('Georgia', 'GA-02 & GA-05 Areas', 'Democratic representation', 'Republican-drawn split', 42.0, 'split', 'lawsuit', 'Georgia Republicans split historically Black neighborhoods in Atlanta suburbs across multiple districts to dilute Democratic and Black voting power ahead of 2026 midterms.', 730000),
('North Carolina', 'Multiple Districts', 'Democratic incumbents', 'GOP supermajority map', 35.0, 'diluted', 'appealed', 'North Carolina GOP used supermajority to override veto and pass maps reducing Black representation. Federal appeals court challenge pending.', 890000),
('Florida', 'FL-05 & FL-10', 'Rep. Al Lawson (D)', 'DeSantis-drawn elimination', 48.0, 'eliminated', 'lost', 'DeSantis personally drew maps eliminating two majority-Black districts. NAACP lost challenge in Florida courts. Approximately 350,000 Black voters redistricted out of representation.', 350000);

-- SEED: Active lawsuits
INSERT INTO lawsuits (title, state, plaintiff, defendant, status, court, filed_date, summary, action_url) VALUES
('NAACP v. Tennessee Special Session', 'Tennessee', 'NAACP Tennessee State Conference', 'Tennessee Legislature / Speaker Cameron Sexton', 'injunction_sought', 'U.S. District Court, M.D. Tennessee', '2026-05-08', 'Emergency lawsuit arguing Tennessee Republicans violated state law and the state constitution when they repealed the mid-decade redistricting ban and enacted a new map eliminating the only majority-Black congressional district. Filing argues intentional racial discrimination under Section 2 of the Voting Rights Act.', 'https://naacpldf.org'),
('ACLU v. Tennessee (Memphis Voters)', 'Tennessee', 'Memphis Black Clergy Collaborative + Three Memphis Voters', 'State of Tennessee', 'filed', 'U.S. District Court, W.D. Tennessee', '2026-05-11', 'ACLU and ACLU of Tennessee filed on behalf of three Memphis voters arguing the new congressional map constitutes intentional racial discrimination and First Amendment retaliation against Black voters. Places redistricting within pattern of state action targeting Memphis: 2023 expulsion of Black lawmakers, 2026 state takeover of Memphis schools, 2026 law replacing Shelby County elected DA.', 'https://aclu.org/tennessee'),
('NAACP LDF v. Alabama Redistricting', 'Alabama', 'NAACP Legal Defense Fund', 'State of Alabama', 'ruling_pending', 'U.S. Supreme Court', '2023-11-01', 'Alabama defied Supreme Court orders to create a second majority-Black congressional district. After repeated failures to comply, federal courts redrew the map. Alabama continues to appeal. Sets national precedent for VRA Section 2 enforcement.', 'https://naacpldf.org/alabama'),
('Galmon v. Ardoin (Louisiana)', 'Louisiana', 'Black Louisiana voters', 'Louisiana Secretary of State Kyle Ardoin', 'appealed', 'U.S. Court of Appeals, 5th Circuit', '2022-06-15', 'Louisiana Republicans drew maps eliminating majority-Black districts. Lower courts ordered remedial maps. State appealed to 5th Circuit. Decision will directly affect two congressional seats and Black representation for the next decade.', 'https://naacpldf.org/louisiana'),
('NAACP v. Virginia Redistricting', 'Virginia', 'Virginia NAACP', 'Virginia General Assembly', 'filed', 'Virginia Supreme Court', '2026-02-20', 'Challenge to Virginia House maps that diluted Black voter concentration in Richmond and Hampton Roads by splitting historic Black communities across multiple districts.', 'https://naacpva.org'),
('Common Cause v. North Carolina', 'North Carolina', 'Common Cause NC + NAACP', 'North Carolina General Assembly', 'appealed', 'U.S. Court of Appeals, 4th Circuit', '2025-09-10', 'North Carolina Republican supermajority passed maps reducing Black representation in multiple congressional and state legislative districts. Federal appeal seeks injunction before 2026 elections.', 'https://commoncause.org/north-carolina');

-- SEED: Reported incidents
INSERT INTO incidents (state, city, incident_type, description, verified) VALUES
('Tennessee', 'Memphis', 'District Elimination', 'Entire majority-Black congressional district eliminated in special session. Voters woke up with no representative responsive to their community.', TRUE),
('Tennessee', 'Nashville', 'Legislative Retaliation', 'Black state representatives stripped from all committees after protesting gerrymandering. Justin Pearson: "Every Black elected official removed."', TRUE),
('Florida', 'Jacksonville', 'Polling Location Closure', 'Three polling locations in majority-Black precincts closed. Nearest alternative 12+ miles away with no public transit.', TRUE),
('Georgia', 'Atlanta', 'Voter Roll Purge', 'Algorithm purged 340,000 voters from rolls. Analysis shows purge disproportionately hit Black and Latino surnames.', TRUE),
('Alabama', 'Montgomery', 'Defiance of Court Order', 'State legislature drew replacement maps still failing to create second majority-Black district despite direct Supreme Court order.', TRUE);

-- SEED: Actions people can take right now
INSERT INTO actions (title, description, action_url, action_type, urgency, state) VALUES
('Sign NAACP Emergency Petition — Tennessee', 'The NAACP needs signatures NOW to demonstrate public opposition to the Tennessee gerrymander before emergency hearing.', 'https://naacp.org/take-action', 'petition', 'critical', 'Tennessee'),
('Support ACLU Memphis Lawsuit', 'The ACLU lawsuit needs community plaintiffs and funding. Filed May 11 2026 on behalf of Memphis Black voters.', 'https://aclu.org/donate', 'donate', 'critical', 'Tennessee'),
('Contact Justin Pearson Directly', 'Rep. Pearson is fighting on the floor right now. Show him he has national support.', 'https://justinpearson.com', 'contact', 'critical', 'Tennessee'),
('Check Your District Has Not Been Redrawn', 'Enter your address to see if your district changed and who now represents you.', 'https://www.vote.gov', 'registration', 'high', NULL),
('Register or Update Voter Registration', 'Redistricting can change your polling place. Verify your registration is current.', 'https://vote.gov', 'registration', 'high', NULL),
('Democracy Docket — Track All Active Cases', 'Democracy Docket tracks every active voting rights lawsuit in real time. Know the battlefield.', 'https://democracydocket.com', 'lawsuit', 'high', NULL),
('Donate to NAACP Legal Defense Fund', 'The NAACP LDF is fighting in courts in TN, AL, LA, VA, GA, NC simultaneously. They need resources.', 'https://naacpldf.org/donate', 'donate', 'high', NULL),
('Contact Your US Representative', 'Demand federal intervention. The John Lewis Voting Rights Advancement Act needs co-sponsors.', 'https://www.house.gov/representatives/find-your-representative', 'contact', 'medium', NULL);
