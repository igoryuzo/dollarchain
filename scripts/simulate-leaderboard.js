// Simulate a Dollarchain leaderboard with 100 users, 100 teams, and 200 deposits

// type User = { fid: number; username: string; teamId: number; neynarScore: number };
// type Team = { id: number; name: string; members: User[]; totalDeposit: number; chainLength: number; totalPoints: number };
// type Deposit = { userFid: number; teamId: number; amount: number };

const NUM_USERS = 1000;
const NUM_TEAMS = 100;
const NUM_DEPOSITS = 10000;

// Generate users
const users = Array.from({ length: NUM_USERS }, (_, i) => ({
  fid: i + 1,
  username: `user${i + 1}`,
  teamId: Math.floor(Math.random() * NUM_TEAMS) + 1,
  neynarScore: Math.random(),
}));

// Generate teams
const teams = Array.from({ length: NUM_TEAMS }, (_, i) => ({
  id: i + 1,
  name: `Team ${i + 1}`,
  members: [],
  totalDeposit: 0,
  chainLength: 0,
  totalPoints: 0,
}));

// Assign users to teams
users.forEach(user => {
  teams[user.teamId - 1].members.push(user);
});

// Generate deposits
const deposits = Array.from({ length: NUM_DEPOSITS }, () => {
  const user = users[Math.floor(Math.random() * users.length)];
  return { userFid: user.fid, teamId: user.teamId, amount: 1, neynarScore: user.neynarScore };
});

// Sum deposits per team and build per-user deposit count for chain length
const teamDepositCounts = {};
deposits.forEach(dep => {
  teams[dep.teamId - 1].totalDeposit += dep.amount;
  teams[dep.teamId - 1].chainLength += 1;
  teamDepositCounts[dep.teamId] = (teamDepositCounts[dep.teamId] || 0) + 1;
});

// Calculate total points per team using correct multiplier and neynarScore
// First, find the max chain length among all teams
const maxChainLength = Math.max(...teams.map(t => t.chainLength));
teams.forEach(team => {
  // Get all deposits for this team
  const teamDeposits = deposits.filter(d => d.teamId === team.id);
  let multiplier = 1;
  if (maxChainLength > 0) {
    const ratio = team.chainLength / maxChainLength;
    multiplier = Math.max(1.0, 3.5 - 2.5 * ratio); // 3.5x when small, 1x when equal to max
  }
  // Points: sum for each deposit: 1 * multiplier * neynarScore
  team.totalPoints = teamDeposits.reduce((sum, d) => sum + (1 * multiplier * d.neynarScore), 0);
});

// Calculate pot
const potAmount = deposits.reduce((sum, d) => sum + d.amount, 0);

// Print leaderboard
console.log('Leaderboard:');
console.log('Rank | Team Name   | Members | Deposit | Chain | Points | Potential Payout');
console.log('--------------------------------------------------------------------------');
teams
  .sort((a, b) => b.totalPoints - a.totalPoints)
  .forEach((team, idx) => {
    const potentialPayout =
      team.totalDeposit > 0
        ? Math.round(((potAmount - team.totalDeposit) / team.totalDeposit) * 100)
        : 0;
    console.log(
      `${String(idx + 1).padEnd(4)} | ${team.name.padEnd(10)} | ${String(team.members.length).padEnd(7)} | $${String(team.totalDeposit).padEnd(7)} | ${String(team.chainLength).padEnd(5)} | ${team.totalPoints.toFixed(2).padEnd(8)} | ${potentialPayout > 0 ? '+' : ''}${potentialPayout}%`
    );
  }); 