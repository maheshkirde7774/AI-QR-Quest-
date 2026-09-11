/**
 * AI QR Quest — Backend Server
 * Technology: Node.js + Express + native SQLite
 * Event: Swayambhu Tech Fest | JNEC
 * Department: Artificial Intelligence & Data Science (AI&DS)
 */

const express = require('express');
const cors = require('cors');
const path = require('node:path');
const db = require('./database/db');
const emailService = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PIN = process.env.ADMIN_PIN || 'jnec2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// ============================================================================
// REST API Routes
// ============================================================================

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    event: 'AI QR Quest',
    fest: 'Swayambhu Tech Fest | JNEC',
    department: 'Artificial Intelligence & Data Science (AI&DS)',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get registration statistics
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, stats });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve stats' });
  }
});

/**
 * Get all registered teams
 */
app.get('/api/teams', (req, res) => {
  try {
    const teams = db.getAllTeams();
    res.json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch teams' });
  }
});

/**
 * Get a specific team by Team ID (e.g. QRQ-0001)
 */
app.get('/api/teams/:id', (req, res) => {
  try {
    const team = db.getTeamById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    res.json({ success: true, team });
  } catch (err) {
    console.error('Error finding team:', err);
    res.status(500).json({ success: false, error: 'Failed to find team' });
  }
});

/**
 * Register a new team or solo participant
 */
app.post('/api/teams/register', async (req, res) => {
  try {
    const {
      registrationType,
      teamName,
      teamLeader,
      member1,
      member2,
      member3,
      mobile,
      email,
      college,
      department
    } = req.body;

    // Validation
    if (!teamLeader || !teamLeader.trim()) {
      return res.status(400).json({ success: false, error: 'Team Leader name is required.', field: 'teamLeader' });
    }

    if (!mobile || !/^\d{10}$/.test(String(mobile).trim())) {
      return res.status(400).json({ success: false, error: 'Valid 10-digit mobile number is required.', field: 'mobile' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return res.status(400).json({ success: false, error: 'Valid email address is required.', field: 'email' });
    }

    if (registrationType === 'team' && (!member2 || !member2.trim())) {
      return res.status(400).json({ success: false, error: 'Member 2 name is required for team registration.', field: 'member2' });
    }

    // Insert into SQLite database
    const team = db.createTeam({
      registrationType: registrationType || 'team',
      teamName: teamName || (registrationType === 'solo' ? `${teamLeader} (Solo)` : 'Team ' + teamLeader),
      teamLeader,
      member1: member1 || teamLeader,
      member2,
      member3,
      mobile,
      email,
      college: college || 'JNEC',
      department: department || 'AI&DS'
    });

    // Send asynchronous confirmation email / log
    emailService.sendConfirmationEmail(team).catch(e => {
      console.warn('Failed to send confirmation email:', e);
    });

    res.status(201).json({
      success: true,
      teamId: team.teamId,
      team
    });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({
        success: false,
        error: err.message,
        field: err.field
      });
    }

    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      error: 'An internal server error occurred while registering the team.'
    });
  }
});

/**
 * Organizer Admin: Export all registered teams to CSV for Excel / Google Sheets
 */
app.get('/api/admin/export-csv', (req, res) => {
  try {
    const teams = db.getAllTeams();

    const headers = [
      'Team ID',
      'Registration Type',
      'Team Name',
      'Team Leader',
      'Member 1',
      'Member 2',
      'Member 3',
      'Mobile Number',
      'Email Address',
      'College',
      'Department',
      'Venue',
      'Fest',
      'Registration Timestamp'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = teams.map(t => [
      escapeCsv(t.teamId),
      escapeCsv(t.registrationType.toUpperCase()),
      escapeCsv(t.teamName),
      escapeCsv(t.teamLeader),
      escapeCsv(t.member1),
      escapeCsv(t.member2 || '-'),
      escapeCsv(t.member3 || '-'),
      escapeCsv(t.mobile),
      escapeCsv(t.email),
      escapeCsv(t.college),
      escapeCsv(t.department),
      escapeCsv(t.venue),
      escapeCsv(t.fest),
      escapeCsv(t.registeredAt)
    ].join(','));

    // UTF-8 BOM so Excel natively handles special characters
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="AI-QR-Quest-Teams-${dateStr}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error('CSV Export error:', err);
    res.status(500).send('Failed to generate CSV export');
  }
});

/**
 * Organizer Admin: Delete a team
 */
app.delete('/api/teams/:id', (req, res) => {
  const pin = req.headers['x-admin-pin'] || req.query.pin;
  if (pin !== ADMIN_PIN) {
    return res.status(403).json({ success: false, error: 'Unauthorized: Invalid Admin PIN' });
  }

  const teamId = req.params.id;
  const deleted = db.deleteTeam(teamId);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Team not found' });
  }

  res.json({ success: true, message: `Team ${teamId} deleted successfully` });
});

/**
 * Organizer Admin: Reset entire database (Delete all teams & reset counter)
 */
app.post('/api/admin/reset-database', (req, res) => {
  const pin = req.headers['x-admin-pin'] || req.body.pin || req.query.pin;
  if (pin !== ADMIN_PIN) {
    return res.status(403).json({ success: false, error: 'Unauthorized: Invalid Admin PIN' });
  }

  db.clearAllTeams();
  res.json({ success: true, message: 'All registrations deleted. Counter reset to QRQ-0001.' });
});

/**
 * Serve admin.html directly on /admin
 */
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Fallback to index.html for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`⚡ AI QR QUEST — Team Registration Server`);
  console.log(`🏛️ Fest: Swayambhu Tech Fest | JNEC`);
  console.log(`🤖 Organizing Dept: Artificial Intelligence & Data Science`);
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`📋 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`💽 SQLite Database: database/quest.db`);
  console.log(`=======================================================`);
});
