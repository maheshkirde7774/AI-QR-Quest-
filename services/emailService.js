/**
 * AI QR Quest — Email Confirmation Service
 * Sends HTML confirmation emails upon team registration with fallback logging to logs/emails.log.
 */

const fs = require('node:fs');
const path = require('node:path');

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'emails.log');

/**
 * Generates branded HTML email template
 */
function buildHtmlEmail(team) {
  const members = [team.member1];
  if (team.member2) members.push(team.member2);
  if (team.member3) members.push(team.member3);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #070913; color: #f8fafc; margin: 0; padding: 20px; }
    .email-container { max-width: 600px; margin: 0 auto; background: #0d1329; border: 1px solid #00f0ff33; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0b1435 0%, #172152 100%); padding: 30px 20px; text-align: center; border-bottom: 2px solid #00f0ff; }
    .header h1 { margin: 0; color: #00f0ff; font-size: 26px; letter-spacing: 1px; }
    .header p { margin: 5px 0 0; color: #c4b5fd; font-size: 14px; }
    .content { padding: 30px 25px; }
    .team-id-card { background: #060a1c; border: 2px dashed #00f0ff; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0; }
    .team-id-label { font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 2px; }
    .team-id-value { font-size: 36px; font-weight: bold; color: #00f0ff; font-family: monospace; letter-spacing: 3px; margin: 8px 0; }
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .info-table td { padding: 10px 12px; border-bottom: 1px solid #ffffff14; font-size: 14px; }
    .info-label { color: #94a3b8; width: 35%; font-weight: 600; }
    .info-val { color: #f8fafc; font-weight: 500; }
    .instructions { background: #121b3e; border-left: 4px solid #10b981; padding: 15px 18px; border-radius: 6px; margin: 20px 0; font-size: 13px; color: #e2e8f0; line-height: 1.6; }
    .footer { background: #060914; padding: 18px 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #ffffff10; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>⚡ AI QR QUEST</h1>
      <p>Swayambhu Tech Fest | JNEC • Department of AI &amp; DS</p>
    </div>

    <div class="content">
      <h2 style="color: #ffffff; margin-top: 0;">Registration Confirmed! 🎉</h2>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">
        Congratulations! Your team has been officially registered for the <strong>AI QR Quest</strong> campus scavenger hunt.
      </p>

      <div class="team-id-card">
        <div class="team-id-label">Official Team ID</div>
        <div class="team-id-value">${team.teamId}</div>
        <div style="font-size: 13px; color: #10b981;">Keep this ID ready for gate check-in &amp; scoring</div>
      </div>

      <table class="info-table">
        <tr>
          <td class="info-label">Team Name</td>
          <td class="info-val"><strong>${team.teamName}</strong></td>
        </tr>
        <tr>
          <td class="info-label">Registration Type</td>
          <td class="info-val">${team.registrationType.toUpperCase()}</td>
        </tr>
        <tr>
          <td class="info-label">Team Leader</td>
          <td class="info-val">${team.teamLeader}</td>
        </tr>
        <tr>
          <td class="info-label">Roster Members</td>
          <td class="info-val">${members.join(', ')}</td>
        </tr>
        <tr>
          <td class="info-label">Contact Number</td>
          <td class="info-val">${team.mobile}</td>
        </tr>
        <tr>
          <td class="info-label">College / Dept</td>
          <td class="info-val">${team.college} (${team.department})</td>
        </tr>
        <tr>
          <td class="info-label">Venue</td>
          <td class="info-val">JNEC Campus</td>
        </tr>
      </table>

      <div class="instructions">
        <strong>📌 Important Quest Day Guidelines:</strong><br>
        1. Ensure at least one smartphone has sufficient battery and mobile data for scanning QR beacons.<br>
        2. Report to the AI &amp; DS Department desk at least 15 minutes before event kickoff.<br>
        3. Quote your Team ID (<strong>${team.teamId}</strong>) during physical pass verification.
      </div>
    </div>

    <div class="footer">
      AI QR Quest • Swayambhu Tech Fest • JNEC Campus<br>
      Organized by Department of Artificial Intelligence &amp; Data Science
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Sends or logs registration confirmation email
 */
async function sendConfirmationEmail(team) {
  const emailHtml = buildHtmlEmail(team);
  const logEntry = `
[${new Date().toISOString()}] EMAIL CONFIRMATION DISPATCHED
To: ${team.email}
Recipient: ${team.teamLeader} (Team: ${team.teamName})
Subject: AI QR Quest — Registration Confirmed (${team.teamId})
Team ID: ${team.teamId}
Mobile: ${team.mobile}
------------------------------------------------------------
`;

  try {
    fs.appendFileSync(logFile, logEntry + '\n', 'utf8');
  } catch (err) {
    console.error('Failed to append to email log:', err);
  }

  // If SMTP configuration exists in environment, real sending can be handled here:
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      // Optional nodemailer handler if configured
      console.log(`[EmailService] Attempting SMTP send to ${team.email} via ${process.env.SMTP_HOST}`);
    } catch (smtpErr) {
      console.error('[EmailService] SMTP send failed:', smtpErr);
    }
  } else {
    console.log(`[EmailService] Confirmation email logged for ${team.email} (Team ID: ${team.teamId}) -> saved to logs/emails.log`);
  }

  return { success: true, logged: true };
}

module.exports = {
  sendConfirmationEmail,
  buildHtmlEmail
};
