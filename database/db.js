/**
 * AI QR Quest — SQLite Database Module
 * Uses native Node.js 'node:sqlite' DatabaseSync for high performance and zero external dependencies.
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

// Ensure database directory exists
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'quest.db');
const db = new DatabaseSync(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id TEXT UNIQUE NOT NULL,
    registration_type TEXT NOT NULL,
    team_name TEXT NOT NULL,
    team_leader TEXT NOT NULL,
    member1 TEXT NOT NULL,
    member2 TEXT,
    member3 TEXT,
    mobile TEXT NOT NULL,
    email TEXT NOT NULL,
    college TEXT NOT NULL,
    department TEXT NOT NULL,
    venue TEXT NOT NULL DEFAULT 'JNEC',
    fest TEXT NOT NULL DEFAULT 'Swayambhu Tech Fest',
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_teams_team_id ON teams(team_id);
  CREATE INDEX IF NOT EXISTS idx_teams_email ON teams(email);
  CREATE INDEX IF NOT EXISTS idx_teams_mobile ON teams(mobile);
`);

/**
 * Generates the next sequential unique Team ID (e.g. QRQ-0001, QRQ-0002)
 */
function generateNextTeamId() {
  const row = db.prepare(`SELECT MAX(id) as maxId FROM teams`).get();
  let nextNum = (row && row.maxId ? row.maxId : 0) + 1;
  let candidateId = `QRQ-${String(nextNum).padStart(4, '0')}`;

  // Double check candidateId uniqueness
  while (true) {
    const existing = db.prepare(`SELECT id FROM teams WHERE team_id = ?`).get(candidateId);
    if (!existing) break;
    nextNum += 1;
    candidateId = `QRQ-${String(nextNum).padStart(4, '0')}`;
  }

  return candidateId;
}

/**
 * Check for duplicate email, mobile, or team name
 */
function checkDuplicate({ email, mobile, teamName }) {
  if (email) {
    const existingEmail = db.prepare(`SELECT team_id FROM teams WHERE LOWER(email) = LOWER(?)`).get(email.trim());
    if (existingEmail) {
      return { isDuplicate: true, field: 'email', message: 'This Email ID is already registered.' };
    }
  }

  if (mobile) {
    const existingMobile = db.prepare(`SELECT team_id FROM teams WHERE mobile = ?`).get(mobile.trim());
    if (existingMobile) {
      return { isDuplicate: true, field: 'mobile', message: 'This Mobile Number is already registered.' };
    }
  }

  if (teamName) {
    const existingTeam = db.prepare(`SELECT team_id FROM teams WHERE LOWER(team_name) = LOWER(?)`).get(teamName.trim());
    if (existingTeam) {
      return { isDuplicate: true, field: 'teamName', message: 'A team with this name is already registered.' };
    }
  }

  return { isDuplicate: false };
}

/**
 * Inserts a new team record into the database
 */
function createTeam(data) {
  // Validate duplicate
  const dupCheck = checkDuplicate({
    email: data.email,
    mobile: data.mobile,
    teamName: data.teamName
  });

  if (dupCheck.isDuplicate) {
    const err = new Error(dupCheck.message);
    err.field = dupCheck.field;
    err.statusCode = 400;
    throw err;
  }

  const teamId = generateNextTeamId();
  const isSolo = data.registrationType === 'solo';

  const insertStmt = db.prepare(`
    INSERT INTO teams (
      team_id,
      registration_type,
      team_name,
      team_leader,
      member1,
      member2,
      member3,
      mobile,
      email,
      college,
      department,
      venue,
      fest
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStmt.run(
    teamId,
    isSolo ? 'solo' : 'team',
    data.teamName ? data.teamName.trim() : `${data.teamLeader.trim()} (Solo)`,
    data.teamLeader.trim(),
    data.member1 ? data.member1.trim() : data.teamLeader.trim(),
    isSolo ? null : (data.member2 ? data.member2.trim() : null),
    isSolo ? null : (data.member3 ? data.member3.trim() : null),
    data.mobile.trim(),
    data.email.trim().toLowerCase(),
    data.college ? data.college.trim() : 'JNEC',
    data.department ? data.department.trim() : 'AI&DS',
    'JNEC',
    'Swayambhu Tech Fest'
  );

  return getTeamById(teamId);
}

/**
 * Retrieve team by team_id
 */
function getTeamById(teamId) {
  const row = db.prepare(`SELECT * FROM teams WHERE team_id = ?`).get(teamId);
  if (!row) return null;

  return {
    id: row.id,
    teamId: row.team_id,
    registrationType: row.registration_type,
    teamName: row.team_name,
    teamLeader: row.team_leader,
    member1: row.member1,
    member2: row.member2,
    member3: row.member3,
    mobile: row.mobile,
    email: row.email,
    college: row.college,
    department: row.department,
    venue: row.venue,
    fest: row.fest,
    registeredAt: row.registered_at
  };
}

/**
 * Retrieve all registered teams
 */
function getAllTeams() {
  const rows = db.prepare(`SELECT * FROM teams ORDER BY id ASC`).all();
  return rows.map(row => ({
    id: row.id,
    teamId: row.team_id,
    registrationType: row.registration_type,
    teamName: row.team_name,
    teamLeader: row.team_leader,
    member1: row.member1,
    member2: row.member2,
    member3: row.member3,
    mobile: row.mobile,
    email: row.email,
    college: row.college,
    department: row.department,
    venue: row.venue,
    fest: row.fest,
    registeredAt: row.registered_at
  }));
}

/**
 * Get registration metrics
 */
function getStats() {
  const totalRow = db.prepare(`SELECT COUNT(*) as count FROM teams`).get();
  const soloRow = db.prepare(`SELECT COUNT(*) as count FROM teams WHERE registration_type = 'solo'`).get();
  const teamRow = db.prepare(`SELECT COUNT(*) as count FROM teams WHERE registration_type = 'team'`).get();

  return {
    totalTeams: totalRow ? totalRow.count : 0,
    soloCount: soloRow ? soloRow.count : 0,
    teamCount: teamRow ? teamRow.count : 0
  };
}

/**
 * Delete a team by team_id
 */
function deleteTeam(teamId) {
  const existing = getTeamById(teamId);
  if (!existing) return false;
  db.prepare(`DELETE FROM teams WHERE team_id = ?`).run(teamId);
  return true;
}

/**
 * Clear all registered teams and reset counter to QRQ-0001
 */
function clearAllTeams() {
  db.exec(`DELETE FROM teams;`);
  db.exec(`DELETE FROM sqlite_sequence WHERE name = 'teams';`);
  return true;
}

module.exports = {
  db,
  generateNextTeamId,
  checkDuplicate,
  createTeam,
  getTeamById,
  getAllTeams,
  getStats,
  deleteTeam,
  clearAllTeams
};


