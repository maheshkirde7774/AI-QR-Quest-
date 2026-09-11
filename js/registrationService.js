/**
 * AI QR Quest — Registration Service Module
 * Handles communication with the Node.js + SQLite backend REST API.
 * Includes automatic local storage caching and offline fallback.
 */

const STORAGE_KEYS = {
  TEAMS: 'AI_QR_QUEST_REGISTERED_TEAMS_V2',
  COUNTER: 'AI_QR_QUEST_TEAM_COUNTER_V2'
};

class RegistrationService {
  constructor() {
    // Connect to Node.js backend REST API
    this.apiEndpoint = '/api/teams/register';
    this._initStorage();
  }

  /**
   * Initialize local storage structures if not already present
   */
  _initStorage() {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) {
        localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.COUNTER)) {
        localStorage.setItem(STORAGE_KEYS.COUNTER, '0');
      }
    } catch (err) {
      console.warn('LocalStorage unavailable or restricted:', err);
    }
  }

  /**
   * Retrieves all registered teams (from local cache or server)
   * @returns {Promise<Array>} Array of team objects
   */
  async getRegisteredTeams() {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        if (data && data.teams) {
          localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(data.teams));
          return data.teams;
        }
      }
    } catch {
      // Fallback to local storage
    }

    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEAMS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Local fallback ID generator in case server is completely offline
   */
  generateLocalTeamId() {
    let currentCount = 0;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COUNTER);
      currentCount = raw ? parseInt(raw, 10) : 0;
    } catch {
      currentCount = 0;
    }
    currentCount += 1;
    localStorage.setItem(STORAGE_KEYS.COUNTER, String(currentCount));
    return `QRQ-${String(currentCount).padStart(4, '0')}`;
  }

  /**
   * Registers a team via the Node.js + SQLite backend
   * @param {Object} rawData 
   * @returns {Promise<Object>}
   */
  async registerTeam(rawData) {
    // 1. Primary path: Call Backend REST API
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(rawData)
      });

      const result = await response.json();

      if (!response.ok) {
        const err = new Error(result.error || 'Registration failed');
        err.field = result.field;
        throw err;
      }

      // Cache confirmed team locally
      try {
        const teams = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]');
        teams.push(result.team);
        localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
      } catch (e) {
        console.warn('Failed to cache locally:', e);
      }

      return result;
    } catch (networkErr) {
      // If error is an explicit validation error from backend, rethrow it
      if (networkErr.field || (networkErr.message && !networkErr.message.includes('Failed to fetch'))) {
        throw networkErr;
      }

      console.warn('Backend server unreachable, executing offline registration fallback:', networkErr);

      // Offline fallback: generate local ID and save to localStorage
      const isSolo = rawData.registrationType === 'solo';
      const localId = this.generateLocalTeamId();

      const teamRecord = {
        teamId: localId,
        registrationType: isSolo ? 'solo' : 'team',
        teamName: rawData.teamName ? rawData.teamName.trim() : `${rawData.teamLeader.trim()} (Solo)`,
        teamLeader: rawData.teamLeader.trim(),
        member1: rawData.member1 ? rawData.member1.trim() : rawData.teamLeader.trim(),
        member2: isSolo ? null : (rawData.member2 ? rawData.member2.trim() : null),
        member3: isSolo ? null : (rawData.member3 ? rawData.member3.trim() : null),
        mobile: rawData.mobile.trim(),
        email: rawData.email.trim().toLowerCase(),
        college: rawData.college ? rawData.college.trim() : 'JNEC',
        department: rawData.department ? rawData.department.trim() : 'AI&DS',
        registeredAt: new Date().toISOString(),
        venue: 'JNEC',
        fest: 'Swayambhu Tech Fest',
        offlineSaved: true
      };

      try {
        const teams = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]');
        teams.push(teamRecord);
        localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
      } catch (err) {
        console.error('Failed to save to local storage:', err);
      }

      return {
        success: true,
        teamId: localId,
        team: teamRecord
      };
    }
  }
}

// Export singleton instance
window.registrationService = new RegistrationService();
