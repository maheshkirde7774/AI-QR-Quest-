/**
 * AI QR Quest - Team Registration Controller
 * Handles solo/duo/trio (1 to 3 members) dynamic forms,
 * Unique Team ID generation, live preview, and validation.
 */
const TeamRegistration = (function () {
  'use strict';

  // State
  let currentTeamSize = 1; // 1 (Solo), 2 (Duo), or 3 (Trio)

  // DOM Elements
  let formEl,
    sizeRadios,
    member2Card,
    member3Card,
    teamNameInput,
    trackSelect,
    previewTeamName,
    previewTeamId,
    previewTrackBadge,
    previewMemberCount,
    previewRosterList,
    previewQrCanvas,
    submitBtn;

  const TRACK_PREFIXES = {
    'AI Cryptography': 'CRYPTO',
    'Neural Maze': 'NEURAL',
    'Cyber Forensics': 'FORENSIC',
    'Quantum AI': 'QUANTUM',
    'Autonomous Agents': 'AGENTS'
  };

  function init() {
    formEl = document.getElementById('team-reg-form');
    sizeRadios = document.querySelectorAll('input[name="team-size"]');
    member2Card = document.getElementById('member-2-section');
    member3Card = document.getElementById('member-3-section');
    teamNameInput = document.getElementById('team-name');
    trackSelect = document.getElementById('quest-track');
    submitBtn = document.getElementById('btn-submit-reg');

    // Live preview elements
    previewTeamName = document.getElementById('preview-team-name');
    previewTeamId = document.getElementById('preview-team-id');
    previewTrackBadge = document.getElementById('preview-track-badge');
    previewMemberCount = document.getElementById('preview-member-count');
    previewRosterList = document.getElementById('preview-roster-list');
    previewQrCanvas = document.getElementById('preview-qr-canvas');

    if (!formEl) return;

    setupEventListeners();
    setTeamSize(1);
    updateLivePreview();
  }

  function setupEventListeners() {
    // Team size selection radio buttons
    sizeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const size = parseInt(e.target.value, 10);
        setTeamSize(size);
        if (window.QuestAudio) window.QuestAudio.playClick();
      });
    });

    // Form inputs change -> live preview update
    formEl.addEventListener('input', () => {
      updateLivePreview();
    });

    if (trackSelect) {
      trackSelect.addEventListener('change', () => {
        updateLivePreview();
        if (window.QuestAudio) window.QuestAudio.playClick();
      });
    }

    // Form submission
    formEl.addEventListener('submit', handleFormSubmit);

    // Quick random generator button
    const randomBtn = document.getElementById('btn-random-name');
    if (randomBtn) {
      randomBtn.addEventListener('click', generateRandomTeamName);
    }
  }

  function setTeamSize(size) {
    currentTeamSize = Math.max(1, Math.min(3, size));

    // Dynamic visibility for member fields
    if (member2Card) {
      if (currentTeamSize >= 2) {
        member2Card.classList.remove('hidden-member');
        member2Card.querySelectorAll('input').forEach(input => {
          if (input.dataset.required === 'true') input.required = true;
        });
      } else {
        member2Card.classList.add('hidden-member');
        member2Card.querySelectorAll('input').forEach(input => {
          input.required = false;
        });
      }
    }

    if (member3Card) {
      if (currentTeamSize === 3) {
        member3Card.classList.remove('hidden-member');
        member3Card.querySelectorAll('input').forEach(input => {
          if (input.dataset.required === 'true') input.required = true;
        });
      } else {
        member3Card.classList.add('hidden-member');
        member3Card.querySelectorAll('input').forEach(input => {
          input.required = false;
        });
      }
    }

    // Update label for Member 1 (Solo Operative vs Team Captain)
    const leaderTitle = document.getElementById('leader-card-title');
    if (leaderTitle) {
      leaderTitle.textContent = currentTeamSize === 1 ? 'Solo Operative' : 'Team Captain (Leader)';
    }

    updateLivePreview();
  }

  /**
   * Generates a unique, high-tech Team ID
   * E.g. AIQ-NEURAL-8492
   */
  function generateUniqueTeamId(trackName) {
    const prefix = TRACK_PREFIXES[trackName] || 'CYBER';
    let newId;
    let attempts = 0;
    const existingTeams = window.QuestStorage.getTeams();

    do {
      const randomHex = Math.floor(1000 + Math.random() * 9000);
      newId = `AIQ-${prefix}-${randomHex}`;
      attempts++;
    } while (existingTeams.some(t => t.id === newId) && attempts < 100);

    return newId;
  }

  /**
   * Generates a 4-digit security PIN
   */
  function generateSecurityPin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Generates a cryptographic verification token
   */
  function generateVerificationToken() {
    const chars = '0123456789ABCDEF';
    let token = '0x';
    for (let i = 0; i < 8; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
  }

  /**
   * Real-time live card preview updater
   */
  function updateLivePreview() {
    const name = teamNameInput.value.trim() || 'Codename: Unassigned';
    const track = trackSelect ? trackSelect.value : 'AI Cryptography';
    const leaderName = (document.getElementById('leader-name')?.value || '').trim() || 'Operative One';
    const leaderRole = (document.getElementById('leader-role')?.value || '').trim() || 'Leader';

    if (previewTeamName) previewTeamName.textContent = name;
    if (previewTrackBadge) previewTrackBadge.textContent = track;
    if (previewMemberCount) {
      previewMemberCount.textContent = currentTeamSize === 1 ? 'Solo Agent' : `${currentTeamSize} Members`;
    }

    // Dynamic temporary preview ID
    const prefix = TRACK_PREFIXES[track] || 'CYBER';
    if (previewTeamId) {
      previewTeamId.textContent = `AIQ-${prefix}-PREVIEW`;
    }

    // Update member avatars/roster in preview
    if (previewRosterList) {
      let html = `<li class="preview-member-item">
        <span class="member-dot leader-dot"></span>
        <span class="member-info">
          <strong>${escapeHtml(leaderName)}</strong>
          <small>${escapeHtml(leaderRole)} (Leader)</small>
        </span>
      </li>`;

      if (currentTeamSize >= 2) {
        const m2Name = (document.getElementById('member2-name')?.value || '').trim() || 'Teammate Two';
        const m2Role = (document.getElementById('member2-role')?.value || '').trim() || 'Specialist';
        html += `<li class="preview-member-item">
          <span class="member-dot"></span>
          <span class="member-info">
            <strong>${escapeHtml(m2Name)}</strong>
            <small>${escapeHtml(m2Role)}</small>
          </span>
        </li>`;
      }

      if (currentTeamSize === 3) {
        const m3Name = (document.getElementById('member3-name')?.value || '').trim() || 'Teammate Three';
        const m3Role = (document.getElementById('member3-role')?.value || '').trim() || 'Specialist';
        html += `<li class="preview-member-item">
          <span class="member-dot"></span>
          <span class="member-info">
            <strong>${escapeHtml(m3Name)}</strong>
            <small>${escapeHtml(m3Role)}</small>
          </span>
        </li>`;
      }

      previewRosterList.innerHTML = html;
    }

    // Render Preview QR Code
    if (previewQrCanvas && window.QRCode) {
      const qrData = JSON.stringify({
        t: name,
        s: currentTeamSize,
        k: track,
        preview: true
      });
      window.QRCode.toCanvas(previewQrCanvas, qrData, {
        width: 140,
        height: 140,
        colorDark: '#00f0ff',
        colorLight: '#0b1021'
      });
    }
  }

  /**
   * Submits the registration form, creates the team with unique Team ID,
   * saves to storage, and launches the Quest Pass badge!
   */
  function handleFormSubmit(e) {
    e.preventDefault();

    const teamName = teamNameInput.value.trim();
    const track = trackSelect.value;
    const tier = document.getElementById('experience-tier')?.value || 'Cyber Hacker';

    if (!teamName) {
      showNotice('Please enter a team name.', 'error');
      teamNameInput.focus();
      return;
    }

    // Member 1 (Leader)
    const leaderName = document.getElementById('leader-name').value.trim();
    const leaderEmail = document.getElementById('leader-email').value.trim();
    const leaderRole = document.getElementById('leader-role').value.trim() || 'Operative';
    const leaderHandle = document.getElementById('leader-handle').value.trim() || '';

    if (!leaderName || !leaderEmail) {
      showNotice('Please enter leader name and email address.', 'error');
      return;
    }

    const members = [];

    // Member 2 if size >= 2
    if (currentTeamSize >= 2) {
      const m2Name = document.getElementById('member2-name').value.trim();
      const m2Email = document.getElementById('member2-email').value.trim();
      const m2Role = document.getElementById('member2-role').value.trim() || 'Specialist';
      if (!m2Name || !m2Email) {
        showNotice('Please fill in required fields for Member 2.', 'error');
        return;
      }
      members.push({ name: m2Name, email: m2Email, role: m2Role });
    }

    // Member 3 if size === 3
    if (currentTeamSize === 3) {
      const m3Name = document.getElementById('member3-name').value.trim();
      const m3Email = document.getElementById('member3-email').value.trim();
      const m3Role = document.getElementById('member3-role').value.trim() || 'Specialist';
      if (!m3Name || !m3Email) {
        showNotice('Please fill in required fields for Member 3.', 'error');
        return;
      }
      members.push({ name: m3Name, email: m3Email, role: m3Role });
    }

    // Generate Unique Team ID and security credentials
    const uniqueTeamId = generateUniqueTeamId(track);
    const securityPin = generateSecurityPin();
    const verificationToken = generateVerificationToken();

    const newTeam = {
      id: uniqueTeamId,
      name: teamName,
      track: track,
      tier: tier,
      size: currentTeamSize,
      leader: {
        name: leaderName,
        email: leaderEmail,
        role: leaderRole,
        handle: leaderHandle
      },
      members: members,
      registeredAt: new Date().toISOString(),
      passcode: securityPin,
      verificationToken: verificationToken,
      status: 'Active',
      score: 0,
      checkpointsCleared: 0
    };

    // Save to LocalStorage
    window.QuestStorage.addTeam(newTeam);

    // Audio effect
    if (window.QuestAudio) window.QuestAudio.playSuccess();

    // Show Notification Toast
    showNotice(`Registration Complete! Team ID ${newTeam.id} generated.`, 'success');

    // Display the Holographic Quest Pass Modal
    if (window.QuestPassModal) {
      window.QuestPassModal.show(newTeam);
    }

    // Reset Form for next registration
    formEl.reset();
    setTeamSize(1);
    const soloRadio = document.querySelector('input[name="team-size"][value="1"]');
    if (soloRadio) soloRadio.checked = true;
    updateLivePreview();
  }

  function generateRandomTeamName() {
    const prefixes = ['Quantum', 'Neural', 'Cyber', 'Nexus', 'Binary', 'Ghost', 'Vector', 'Echo', 'Synthetic', 'Apex'];
    const suffixes = ['Phantoms', 'Glitchers', 'Runners', 'Syndicate', 'Ciphers', 'Vanguard', 'Protocol', 'Oracles', 'Spectres', 'Hounds'];
    const randomName = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    teamNameInput.value = randomName;
    updateLivePreview();
    if (window.QuestAudio) window.QuestAudio.playClick();
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showNotice(msg, type) {
    if (window.QuestApp && window.QuestApp.showToast) {
      window.QuestApp.showToast(msg, type);
    } else {
      alert(msg);
    }
  }

  return {
    init,
    setTeamSize,
    updateLivePreview
  };
})();

window.TeamRegistration = TeamRegistration;
