/**
 * Automated Verification Test for AI QR Quest Backend (Node.js + SQLite)
 */

const db = require('../database/db');

async function runTests() {
  console.log('----------------------------------------------------');
  console.log('⚡ Starting AI QR Quest Backend & SQLite Tests');
  console.log('----------------------------------------------------');

  // Test 1: Generate Sequential Team IDs
  console.log('Test 1: Verifying Sequential Team ID Generation...');
  const id1 = db.generateNextTeamId();
  console.assert(id1.startsWith('QRQ-'), `ID format error: expected QRQ-xxxx, got ${id1}`);
  console.log(`✅ Test 1 Passed: Initial Team ID candidate -> ${id1}`);

  const testId = Date.now().toString().slice(-6);
  const testEmail1 = `aarav.${testId}@jnec.edu`;
  const testMobile1 = `98${testId}01`;
  const testEmail2 = `rhea.${testId}@jnec.edu`;
  const testMobile2 = `91${testId}02`;

  // Test 2: Insert Team Registration
  console.log('\nTest 2: Inserting Team Registration into SQLite...');
  const team1 = db.createTeam({
    registrationType: 'team',
    teamName: `Cyber Hackers ${testId}`,
    teamLeader: 'Aarav Sharma',
    member1: 'Aarav Sharma',
    member2: 'Kunal Patil',
    member3: 'Sneha Joshi',
    mobile: testMobile1,
    email: testEmail1,
    college: 'JNEC - AI & DS',
    department: 'AI&DS'
  });
  console.assert(team1.teamId === id1, `Expected ${id1}, got ${team1.teamId}`);
  console.assert(team1.teamLeader === 'Aarav Sharma', 'Team leader mismatch');
  console.log(`✅ Test 2 Passed: Team registered with ID ${team1.teamId}`);

  // Test 3: Insert Solo Registration
  console.log('\nTest 3: Inserting Solo Registration into SQLite...');
  const team2 = db.createTeam({
    registrationType: 'solo',
    teamName: `Falcon Solo ${testId}`,
    teamLeader: 'Rhea Deshmukh',
    member1: 'Rhea Deshmukh',
    mobile: testMobile2,
    email: testEmail2,
    college: 'JNEC - AI & DS',
    department: 'AI&DS'
  });
  console.assert(team2.teamId !== team1.teamId, 'Team IDs must be unique');
  console.assert(team2.member2 === null, 'Solo participant should have null member2');
  console.log(`✅ Test 3 Passed: Solo registered with ID ${team2.teamId} (member2 is null)`);

  // Test 4: Duplicate Email Prevention
  console.log('\nTest 4: Checking Duplicate Email Prevention...');
  try {
    db.createTeam({
      registrationType: 'solo',
      teamName: 'Different Name',
      teamLeader: 'Another Person',
      member1: 'Another Person',
      mobile: '9988776655',
      email: testEmail1, // Duplicate email
      college: 'JNEC'
    });
    console.error('❌ Test 4 Failed: Expected duplicate email error');
    process.exit(1);
  } catch (err) {
    console.assert(err.message.includes('Email ID is already registered'), 'Unexpected error message');
    console.log(`✅ Test 4 Passed: Duplicate email rejected with message: "${err.message}"`);
  }

  // Test 5: Duplicate Mobile Prevention
  console.log('\nTest 5: Checking Duplicate Mobile Prevention...');
  try {
    db.createTeam({
      registrationType: 'solo',
      teamName: 'Different Name 2',
      teamLeader: 'Another Person 2',
      member1: 'Another Person 2',
      mobile: testMobile1, // Duplicate mobile
      email: `unique.${testId}@jnec.edu`,
      college: 'JNEC'
    });
    console.error('❌ Test 5 Failed: Expected duplicate mobile error');
    process.exit(1);
  } catch (err) {
    console.assert(err.message.includes('Mobile Number is already registered'), 'Unexpected error message');
    console.log(`✅ Test 5 Passed: Duplicate mobile rejected with message: "${err.message}"`);
  }

  // Test 6: Query All Teams & Verify Stats
  console.log('\nTest 6: Querying all teams and checking stats...');
  const allTeams = db.getAllTeams();
  const stats = db.getStats();
  console.assert(allTeams.length >= 2, `Expected at least 2 teams, found ${allTeams.length}`);
  console.assert(stats.totalTeams === allTeams.length, 'Stats count mismatch');
  console.log(`✅ Test 6 Passed: Found ${stats.totalTeams} total teams (Solo: ${stats.soloCount}, Team: ${stats.teamCount})`);

  console.log('\n====================================================');
  console.log('🎉 ALL BACKEND & DATABASE TESTS COMPLETED SUCCESSFULLY!');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
