/**
 * AI QR Quest - Holographic Digital Quest Pass & QR Badge Renderer
 * Renders the interactive badge, handles QR code generation,
 * copy-to-clipboard, canvas PNG badge export, and print functions.
 */
const QuestPassModal = (function () {
  'use strict';

  let modalOverlay;
  let currentTeam = null;

  function init() {
    modalOverlay = document.getElementById('quest-pass-modal');
    if (!modalOverlay) return;

    // Close button
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', hide);
    }

    // Backdrop click
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) hide();
    });

    // Copy Team ID button
    const copyBtn = document.getElementById('pass-copy-id-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', handleCopyId);
    }

    // Download PNG Badge button
    const downloadBtn = document.getElementById('pass-download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', handleDownloadBadge);
    }

    // Print Badge button
    const printBtn = document.getElementById('pass-print-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }

    // Proceed to Quest button
    const proceedBtn = document.getElementById('pass-proceed-btn');
    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => {
        hide();
        if (window.QuestApp) {
          window.QuestApp.navigateTo('checkpoints');
        }
      });
    }

    // Keyboard ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        hide();
      }
    });
  }

  /**
   * Shows the Quest Pass for a given team
   */
  function show(team) {
    currentTeam = team;
    if (!modalOverlay || !currentTeam) return;

    // Fill Pass Details
    const idEl = document.getElementById('pass-team-id');
    const nameEl = document.getElementById('pass-team-name');
    const trackEl = document.getElementById('pass-team-track');
    const tierEl = document.getElementById('pass-team-tier');
    const sizeEl = document.getElementById('pass-team-size');
    const pinEl = document.getElementById('pass-team-pin');
    const tokenEl = document.getElementById('pass-team-token');
    const dateEl = document.getElementById('pass-team-date');
    const rosterEl = document.getElementById('pass-team-roster');
    const canvasEl = document.getElementById('pass-qr-canvas');

    if (idEl) idEl.textContent = team.id;
    if (nameEl) nameEl.textContent = team.name;
    if (trackEl) trackEl.textContent = team.track;
    if (tierEl) tierEl.textContent = team.tier || 'Cyber Hacker';
    if (sizeEl) sizeEl.textContent = team.size === 1 ? 'Solo Operative' : `${team.size}-Member Team`;
    if (pinEl) pinEl.textContent = team.passcode || '8821';
    if (tokenEl) tokenEl.textContent = team.verificationToken || '0x7F2A81B9';
    if (dateEl) {
      const d = new Date(team.registeredAt || Date.now());
      dateEl.textContent = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Roster rendering
    if (rosterEl) {
      let membersHtml = `
        <div class="pass-member-entry">
          <span class="role-badge leader-badge">👑 Leader</span>
          <span class="member-name">${escapeHtml(team.leader.name)}</span>
          <span class="member-role">${escapeHtml(team.leader.role)}</span>
        </div>
      `;

      if (team.members && team.members.length > 0) {
        team.members.forEach((m, idx) => {
          membersHtml += `
            <div class="pass-member-entry">
              <span class="role-badge">Agent 0${idx + 2}</span>
              <span class="member-name">${escapeHtml(m.name)}</span>
              <span class="member-role">${escapeHtml(m.role)}</span>
            </div>
          `;
        });
      }
      rosterEl.innerHTML = membersHtml;
    }

    // Generate Scannable QR Code
    if (canvasEl && window.QRCode) {
      // Scannable payload containing quest authentication and team metadata
      const qrPayload = JSON.stringify({
        quest: 'AI-QR-QUEST-2026',
        teamId: team.id,
        teamName: team.name,
        track: team.track,
        size: team.size,
        token: team.verificationToken,
        authUrl: `${window.location.origin}${window.location.pathname}#checkin=${team.id}&token=${team.verificationToken}`
      });

      window.QRCode.toCanvas(canvasEl, qrPayload, {
        width: 180,
        height: 180,
        colorDark: '#00f0ff',
        colorLight: '#080c1a',
        quietZone: 2
      });
    }

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function hide() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function handleCopyId() {
    if (!currentTeam) return;
    navigator.clipboard.writeText(currentTeam.id).then(() => {
      if (window.QuestApp) {
        window.QuestApp.showToast(`Copied Team ID: ${currentTeam.id}`, 'success');
      }
      if (window.QuestAudio) window.QuestAudio.playClick();
    }).catch(() => {
      if (window.QuestApp) {
        window.QuestApp.showToast(`Team ID: ${currentTeam.id}`, 'info');
      }
    });
  }

  /**
   * Generates a high-resolution 800x1000 PNG Cyber Pass Badge
   * drawn on an off-screen HTML5 Canvas, then triggers download.
   */
  function handleDownloadBadge() {
    if (!currentTeam) return;

    const width = 800;
    const height = 1050;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Background Gradient (Dark Cyber Mesh)
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#060812');
    bgGradient.addColorStop(0.5, '#0b1026');
    bgGradient.addColorStop(1, '#050711');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative Holographic Border
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00f0ff';
    ctx.strokeRect(30, 30, width - 60, height - 60);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(138, 43, 226, 0.6)';
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Corner Accents
    const cornerSize = 25;
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(30, 30, cornerSize, 4);
    ctx.fillRect(30, 30, 4, cornerSize);
    ctx.fillRect(width - 30 - cornerSize, 30, cornerSize, 4);
    ctx.fillRect(width - 34, 30, 4, cornerSize);
    ctx.fillRect(30, height - 34, cornerSize, 4);
    ctx.fillRect(30, height - 30 - cornerSize, 4, cornerSize);
    ctx.fillRect(width - 30 - cornerSize, height - 34, cornerSize, 4);
    ctx.fillRect(width - 34, height - 30 - cornerSize, 4, cornerSize);

    // Header Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 32px "Outfit", sans-serif';
    ctx.fillText('AI QR QUEST // 2026', width / 2, 90);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '16px "Space Grotesk", monospace';
    ctx.fillText('OFFICIAL MISSION CREDENTIALS', width / 2, 120);

    // Team Name Card Box
    ctx.fillStyle = 'rgba(18, 26, 52, 0.85)';
    ctx.fillRect(60, 150, width - 120, 110);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.strokeRect(60, 150, width - 120, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Outfit", sans-serif';
    ctx.fillText(currentTeam.name, width / 2, 205);

    ctx.fillStyle = '#00ff9d';
    ctx.font = '16px "Space Grotesk", monospace';
    ctx.fillText(`${currentTeam.track.toUpperCase()} • ${currentTeam.tier || 'HACKER'}`, width / 2, 238);

    // Team ID Highlight Box
    ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.fillRect(60, 280, width - 120, 70);
    ctx.strokeStyle = '#00f0ff';
    ctx.strokeRect(60, 280, width - 120, 70);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '13px "Space Grotesk", monospace';
    ctx.fillText('UNIQUE TEAM ID', width / 2, 305);

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 28px "Space Grotesk", monospace';
    ctx.fillText(currentTeam.id, width / 2, 336);

    // Scannable QR Code Rendering onto canvas
    const qrCanvas = document.getElementById('pass-qr-canvas');
    if (qrCanvas) {
      const qrSize = 220;
      const qrX = (width - qrSize) / 2;
      const qrY = 380;

      // Glow border around QR
      ctx.fillStyle = '#080c1a';
      ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      ctx.strokeStyle = '#8a2be2';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
    }

    // Security Details Bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px "Space Grotesk", monospace';
    ctx.fillText(`SECURITY PIN: ${currentTeam.passcode || '8821'}   |   TOKEN: ${currentTeam.verificationToken || '0x7F2A81B9'}`, width / 2, 645);

    // Roster Members Box
    ctx.fillStyle = 'rgba(18, 26, 52, 0.85)';
    ctx.fillRect(60, 680, width - 120, 240);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(60, 680, width - 120, 240);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffb703';
    ctx.font = 'bold 16px "Space Grotesk", sans-serif';
    ctx.fillText('OPERATIVE ROSTER', 85, 715);

    let startY = 755;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Outfit", sans-serif';
    ctx.fillText(`1. ${currentTeam.leader.name} (Team Leader)`, 85, startY);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px "Space Grotesk", sans-serif';
    ctx.fillText(`   Role: ${currentTeam.leader.role} • ${currentTeam.leader.email}`, 85, startY + 22);

    if (currentTeam.members && currentTeam.members.length > 0) {
      currentTeam.members.forEach((m, idx) => {
        startY += 55;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Outfit", sans-serif';
        ctx.fillText(`${idx + 2}. ${m.name}`, 85, startY);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '14px "Space Grotesk", sans-serif';
        ctx.fillText(`   Role: ${m.role} • ${m.email}`, 85, startY + 22);
      });
    }

    // Footer Security Barcode & Disclaimer
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '12px "Space Grotesk", monospace';
    ctx.fillText('SCAN QR CODE AT PHYSICAL CHECKPOINTS TO UNLOCK AI CLUES & RECORD PROGRESS', width / 2, 970);
    ctx.fillText(`REGISTERED: ${new Date(currentTeam.registeredAt).toUTCString()}`, width / 2, 995);

    // Export to download
    const link = document.createElement('a');
    link.download = `AI-Quest-Pass-${currentTeam.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    if (window.QuestApp) {
      window.QuestApp.showToast('Quest Pass Badge Downloaded (PNG)!', 'success');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return {
    init,
    show,
    hide
  };
})();

window.QuestPassModal = QuestPassModal;
