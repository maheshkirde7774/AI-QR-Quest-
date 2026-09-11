/**
 * AI QR Quest — Dashboard UI Controller
 * Handles solo/team toggling, validation, submission, and success modal interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const form = document.getElementById('team-registration-form');
  const typeSoloBtn = document.getElementById('type-solo-btn');
  const typeTeamBtn = document.getElementById('type-team-btn');
  const regTypeInput = document.getElementById('registration-type-input');

  const teamNameInput = document.getElementById('team-name');
  const teamLeaderInput = document.getElementById('team-leader');
  const member1Input = document.getElementById('member-1');
  const member2Input = document.getElementById('member-2');
  const member3Input = document.getElementById('member-3');
  const mobileInput = document.getElementById('mobile-number');
  const emailInput = document.getElementById('email-id');
  const collegeDeptInput = document.getElementById('college-dept');

  const member2Slot = document.getElementById('member-2-slot');
  const member3Slot = document.getElementById('member-3-slot');
  const rosterHint = document.getElementById('roster-hint');

  const submitBtn = document.getElementById('submit-reg-btn');
  const successDialog = document.getElementById('registration-success-dialog');
  const generatedIdDisplay = document.getElementById('generated-team-id');
  const copyIdBtn = document.getElementById('copy-team-id-btn');
  const registerAnotherBtn = document.getElementById('register-another-btn');

  // Summary Elements inside modal
  const summaryTeamId = document.getElementById('summary-team-id');
  const summaryTeamName = document.getElementById('summary-team-name');
  const summaryLeader = document.getElementById('summary-leader');
  const summarySquad = document.getElementById('summary-squad');
  const summaryContact = document.getElementById('summary-contact');
  const summaryCollege = document.getElementById('summary-college');

  let currentRegType = 'team'; // Default to Team (up to 3 members)

  // ==========================================================================
  // 1. Registration Type Toggle (Solo vs Team)
  // ==========================================================================
  function setRegistrationType(type) {
    currentRegType = type;
    regTypeInput.value = type;

    if (type === 'solo') {
      typeSoloBtn.classList.add('active');
      typeSoloBtn.setAttribute('aria-pressed', 'true');
      typeTeamBtn.classList.remove('active');
      typeTeamBtn.setAttribute('aria-pressed', 'false');

      // Adjust Roster fields
      member2Slot.style.display = 'none';
      member3Slot.style.display = 'none';
      member2Input.removeAttribute('required');
      member3Input.removeAttribute('required');
      member2Input.value = '';
      member3Input.value = '';

      clearFieldError(member2Input);
      clearFieldError(member3Input);

      rosterHint.textContent = 'Solo participant mode: Leader is the sole member.';
      teamNameInput.placeholder = 'e.g. Solo Falcon or Your Tech Name';
    } else {
      typeTeamBtn.classList.add('active');
      typeTeamBtn.setAttribute('aria-pressed', 'true');
      typeSoloBtn.classList.remove('active');
      typeSoloBtn.setAttribute('aria-pressed', 'false');

      // Adjust Roster fields
      member2Slot.style.display = 'block';
      member3Slot.style.display = 'block';
      member2Input.setAttribute('required', 'true');

      rosterHint.textContent = 'Team mode: 2 to 3 members. Member 3 is optional.';
      teamNameInput.placeholder = 'e.g. Neural Hackers, Quantum Voyagers';
    }
  }

  typeSoloBtn.addEventListener('click', () => setRegistrationType('solo'));
  typeTeamBtn.addEventListener('click', () => setRegistrationType('team'));

  // Sync Leader Name with Member 1 Name if Member 1 hasn't been independently customized
  teamLeaderInput.addEventListener('input', () => {
    if (!member1Input.dataset.manuallyEdited) {
      member1Input.value = teamLeaderInput.value;
      clearFieldError(member1Input);
    }
  });

  member1Input.addEventListener('input', () => {
    member1Input.dataset.manuallyEdited = 'true';
  });

  // ==========================================================================
  // 2. Validation & Error Handlers
  // ==========================================================================
  function showFieldError(inputEl, message) {
    const group = inputEl.closest('.form-group');
    if (!group) return;
    group.classList.add('has-error');
    inputEl.classList.add('is-invalid');
    const feedback = group.querySelector('.error-feedback');
    if (feedback) {
      feedback.textContent = message;
    }
  }

  function clearFieldError(inputEl) {
    if (!inputEl) return;
    const group = inputEl.closest('.form-group');
    if (!group) return;
    group.classList.remove('has-error');
    inputEl.classList.remove('is-invalid');
    const feedback = group.querySelector('.error-feedback');
    if (feedback) {
      feedback.textContent = '';
    }
  }

  // Clear errors dynamically on user input
  const allInputs = form.querySelectorAll('.form-input, .form-select');
  allInputs.forEach(input => {
    input.addEventListener('input', () => clearFieldError(input));
  });

  function validateForm() {
    let isValid = true;

    // Team Name
    if (!teamNameInput.value.trim()) {
      showFieldError(teamNameInput, 'Please enter a team name.');
      isValid = false;
    }

    // Team Leader
    if (!teamLeaderInput.value.trim()) {
      showFieldError(teamLeaderInput, 'Please enter the team leader name.');
      isValid = false;
    }

    // Member 1
    if (!member1Input.value.trim()) {
      showFieldError(member1Input, 'Member 1 (Leader) name is required.');
      isValid = false;
    }

    // Team Mode specifics
    if (currentRegType === 'team') {
      if (!member2Input.value.trim()) {
        showFieldError(member2Input, 'Member 2 name is required for team registration.');
        isValid = false;
      }
    }

    // Mobile Number (10 digits)
    const mobileVal = mobileInput.value.trim();
    if (!mobileVal) {
      showFieldError(mobileInput, 'Mobile number is required.');
      isValid = false;
    } else if (!/^\d{10}$/.test(mobileVal)) {
      showFieldError(mobileInput, 'Enter a valid 10-digit mobile number (e.g. 9876543210).');
      isValid = false;
    }

    // Email ID
    const emailVal = emailInput.value.trim();
    if (!emailVal) {
      showFieldError(emailInput, 'Email address is required.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      showFieldError(emailInput, 'Enter a valid email address.');
      isValid = false;
    }

    // College / Department
    if (!collegeDeptInput.value.trim()) {
      showFieldError(collegeDeptInput, 'Please specify your College and Department.');
      isValid = false;
    }

    return isValid;
  }

  // ==========================================================================
  // 3. Form Submit Handler
  // ==========================================================================
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Find first invalid input and focus
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Disable button & show spinner
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');

    const rawData = {
      registrationType: currentRegType,
      teamName: teamNameInput.value.trim(),
      teamLeader: teamLeaderInput.value.trim(),
      member1: member1Input.value.trim(),
      member2: currentRegType === 'team' ? member2Input.value.trim() : null,
      member3: currentRegType === 'team' && member3Input.value.trim() ? member3Input.value.trim() : null,
      mobile: mobileInput.value.trim(),
      email: emailInput.value.trim(),
      college: collegeDeptInput.value.trim(),
      department: 'AI&DS'
    };

    try {
      const result = await window.registrationService.registerTeam(rawData);
      if (result && result.success) {
        openSuccessModal(result.team);
        updateLiveCounter();
      }
    } catch (err) {
      // If error points to duplicate field, highlight it
      const msg = err.message || 'Registration failed. Please try again.';
      if (msg.includes('Email')) {
        showFieldError(emailInput, msg);
        emailInput.focus();
      } else if (msg.includes('Mobile')) {
        showFieldError(mobileInput, msg);
        mobileInput.focus();
      } else if (msg.includes('name is already registered')) {
        showFieldError(teamNameInput, msg);
        teamNameInput.focus();
      } else {
        alert(msg);
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
    }
  });

  // ==========================================================================
  // 4. Success Modal Handler
  // ==========================================================================
  let activeTeamId = '';

  function openSuccessModal(team) {
    activeTeamId = team.teamId;
    generatedIdDisplay.textContent = team.teamId;
    
    // Fill summary details
    summaryTeamId.textContent = team.teamId;
    summaryTeamName.textContent = team.teamName;
    summaryLeader.textContent = team.teamLeader;
    
    const membersList = [team.member1];
    if (team.member2) membersList.push(team.member2);
    if (team.member3) membersList.push(team.member3);
    summarySquad.textContent = `${team.registrationType.toUpperCase()} (${membersList.join(', ')})`;

    summaryContact.textContent = `${team.mobile} • ${team.email}`;
    summaryCollege.textContent = team.college;

    // Configure WhatsApp Share Button
    const waBtn = document.getElementById('whatsapp-share-btn');
    if (waBtn) {
      const waText = [
        `🚀 *AI QR Quest — Registration Confirmed!*`,
        `🏛️ *Fest:* Swayambhu Tech Fest | JNEC`,
        `🤖 *Dept:* Artificial Intelligence & Data Science (AI&DS)`,
        `🏷️ *Team Name:* ${team.teamName}`,
        `🔑 *Team ID:* ${team.teamId}`,
        `👑 *Leader:* ${team.teamLeader}`,
        `👥 *Squad:* ${membersList.join(', ')}`,
        `📍 *Venue:* JNEC Campus`,
        ``,
        `Save this Team ID for check-in on event day!`
      ].join('\n');
      waBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
    }

    // Reset copy button text
    copyIdBtn.innerHTML = '<span class="icon">📋</span> Copy Team ID';
    copyIdBtn.classList.remove('copied');

    // Display dialog
    if (typeof successDialog.showModal === 'function') {
      successDialog.showModal();
    } else {
      successDialog.setAttribute('open', '');
    }
  }

  // Copy Team ID button action
  copyIdBtn.addEventListener('click', async () => {
    if (!activeTeamId) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(activeTeamId);
      } else {
        // Fallback for older browsers or non-secure origins
        const tempInput = document.createElement('input');
        tempInput.value = activeTeamId;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }

      copyIdBtn.innerHTML = '<span class="icon">✅</span> Copied!';
      copyIdBtn.classList.add('copied');

      setTimeout(() => {
        copyIdBtn.innerHTML = '<span class="icon">📋</span> Copy Team ID';
        copyIdBtn.classList.remove('copied');
      }, 3000);
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  });

  // Register Another Team button action
  registerAnotherBtn.addEventListener('click', () => {
    if (typeof successDialog.close === 'function') {
      successDialog.close();
    } else {
      successDialog.removeAttribute('open');
    }

    // Reset form
    form.reset();
    delete member1Input.dataset.manuallyEdited;
    setRegistrationType('team');
    teamNameInput.focus();
  });

  // Live Registration Counter Updater
  async function updateLiveCounter() {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        const numEl = document.getElementById('live-count-num');
        if (numEl && data.stats) {
          numEl.textContent = data.stats.totalTeams;
        }
      }
    } catch {
      // Offline fallback
    }
  }

  // Initialize view & live counter
  setRegistrationType('team');
  updateLiveCounter();
});

