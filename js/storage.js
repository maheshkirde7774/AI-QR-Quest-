/**
 * LocalStorage & Data Store Manager for AI QR Quest
 */
const QuestStorage = (function () {
  'use strict';

  const STORAGE_KEY_TEAMS = 'ai_qr_quest_teams_v1';
  const STORAGE_KEY_ACTIVE_TEAM = 'ai_qr_quest_active_team_v1';
  const STORAGE_KEY_SETTINGS = 'ai_qr_quest_settings_v1';

  // Starter demo teams for rich presentation on first load
  const INITIAL_DEMO_TEAMS = [
    {
      id: 'AIQ-NEURAL-8842',
      name: 'CyberPhantoms',
      track: 'Neural Maze',
      size: 3,
      leader: {
        name: 'Aria Chen',
        email: 'aria.chen@matrix.ai',
        role: 'Prompt Architect',
        handle: '@aria_chen'
      },
      members: [
        { name: 'Kaelen Vance', email: 'kvance@matrix.ai', role: 'Security Engineer' },
        { name: 'Devon Lee', email: 'dlee@matrix.ai', role: 'Data Strategist' }
      ],
      registeredAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      passcode: '4921',
      verificationToken: '0x9E7F4C82',
      status: 'In Quest',
      score: 1850,
      checkpointsCleared: 3
    },
    {
      id: 'AIQ-CRYPTO-4190',
      name: 'ZeroDay Solvers',
      track: 'AI Cryptography',
      size: 2,
      leader: {
        name: 'Marcus Brody',
        email: 'mbrody@cipher.net',
        role: 'Cryptographer',
        handle: '@mbrody_sec'
      },
      members: [
        { name: 'Elena Rostova', email: 'elena@cipher.net', role: 'Reverse Engineer' }
      ],
      registeredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      passcode: '8103',
      verificationToken: '0x3D1A9F5C',
      status: 'In Quest',
      score: 1420,
      checkpointsCleared: 2
    },
    {
      id: 'AIQ-QUANT-7215',
      name: 'Nexus Solo',
      track: 'Quantum AI',
      size: 1,
      leader: {
        name: 'Samira Ortiz',
        email: 'samira@quantum.io',
        role: 'Solo Algorithmist',
        handle: '@samira_ai'
      },
      members: [],
      registeredAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      passcode: '6390',
      verificationToken: '0xAA8219BC',
      status: 'Active',
      score: 950,
      checkpointsCleared: 1
    }
  ];

  function getTeams() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TEAMS);
      if (!data) {
        // Initialize with default demo data
        localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(INITIAL_DEMO_TEAMS));
        return INITIAL_DEMO_TEAMS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading teams from storage:', e);
      return INITIAL_DEMO_TEAMS;
    }
  }

  function saveTeams(teams) {
    try {
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
      return true;
    } catch (e) {
      console.error('Error saving teams:', e);
      return false;
    }
  }

  function addTeam(team) {
    const teams = getTeams();
    // Prepend new team so it shows up at top
    teams.unshift(team);
    saveTeams(teams);
    setActiveTeam(team);
    return team;
  }

  function findTeamById(id) {
    const teams = getTeams();
    return teams.find(t => t.id.toLowerCase() === id.trim().toLowerCase()) || null;
  }

  function getActiveTeam() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ACTIVE_TEAM);
      if (data) return JSON.parse(data);
      const teams = getTeams();
      return teams.length > 0 ? teams[0] : null;
    } catch (e) {
      return null;
    }
  }

  function setActiveTeam(team) {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_TEAM, JSON.stringify(team));
      // Dispatch custom event for reactive updates across the dashboard
      window.dispatchEvent(new CustomEvent('activeTeamChanged', { detail: team }));
    } catch (e) {
      console.error('Error setting active team:', e);
    }
  }

  function deleteTeam(id) {
    const teams = getTeams().filter(t => t.id !== id);
    saveTeams(teams);
    const active = getActiveTeam();
    if (active && active.id === id) {
      setActiveTeam(teams.length > 0 ? teams[0] : null);
    }
    return teams;
  }

  function resetToDefaults() {
    localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(INITIAL_DEMO_TEAMS));
    setActiveTeam(INITIAL_DEMO_TEAMS[0]);
    return INITIAL_DEMO_TEAMS;
  }

  function exportTeamsJSON() {
    const teams = getTeams();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(teams, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ai-qr-quest-teams-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  return {
    getTeams,
    saveTeams,
    addTeam,
    findTeamById,
    getActiveTeam,
    setActiveTeam,
    deleteTeam,
    resetToDefaults,
    exportTeamsJSON
  };
})();

window.QuestStorage = QuestStorage;
