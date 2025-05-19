import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { createPublicClient, http, parseAbi, decodeEventLog } from 'viem';

// USDC contract address on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
// Dollarchain treasury address
const TREASURY_ADDRESS = '0x638d7b6b585F2e248Ecbbc84047A96FD600e204E'.toLowerCase();
// 1 USDC in 6 decimals
const MIN_AMOUNT = BigInt('1000000'); // Use BigInt for 1 USDC (6 decimals)
// Minimal ERC20 ABI for Transfer event
const ERC20_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)'
]);
// Use Base mainnet RPC
const BASE_RPC = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const client = createPublicClient({
  chain: {
    id: 8453,
    name: 'Base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [BASE_RPC] } },
  },
  transport: http(BASE_RPC),
});

async function verifyOnchainUSDCDeposit({ transactionHash, userEthAddress }: { transactionHash: string, userEthAddress: string }) {
  try {
    // Wait for the transaction receipt (with retries)
    let receipt = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        receipt = await client.getTransactionReceipt({ hash: transactionHash as `0x${string}` });
        if (receipt) break;
      } catch {
        // wait and retry
        await new Promise(res => setTimeout(res, 3000));
      }
    }
    if (!receipt) return false;

    // Check logs for USDC Transfer to treasury
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
        try {
          const parsed = decodeEventLog({
            abi: ERC20_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (
            parsed.eventName === 'Transfer' &&
            parsed.args.to.toLowerCase() === TREASURY_ADDRESS &&
            parsed.args.from.toLowerCase() === userEthAddress.toLowerCase() &&
            BigInt(parsed.args.value.toString()) >= MIN_AMOUNT
          ) {
            return true;
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    return false;
  } catch (err) {
    console.error("[DEPOSIT] Error in verifyOnchainUSDCDeposit", { transactionHash, userEthAddress, err });
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      console.error("[DEPOSIT] Unauthorized: No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { team_id: incomingTeamId, transactionHash, team_name } = body;
    if (!transactionHash) {
      console.error("[DEPOSIT] Missing transactionHash", { transactionHash });
      return NextResponse.json({ error: "Missing transactionHash" }, { status: 400 });
    }

    // 1. Find the current active game
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("status", "active")
      .single();
    if (gameError || !game) {
      console.error("[DEPOSIT] No active game found", { gameError });
      return NextResponse.json({ error: "No active game found" }, { status: 400 });
    }

    // 2. Get user's ETH address
    const { data: dbUser } = await supabase
      .from("users")
      .select("primary_eth_address")
      .eq("fid", user.fid)
      .single();
    if (!dbUser?.primary_eth_address) {
      console.error("[DEPOSIT] User ETH address not found", { user });
      return NextResponse.json({ error: "User ETH address not found" }, { status: 400 });
    }

    // 3. Check if transactionHash already used
    const { count: txCount } = await supabase
      .from("deposits")
      .select("id", { count: "exact", head: true })
      .eq("game_id", game.id)
      .eq("transaction_hash", transactionHash);
    if ((txCount ?? 0) > 0) {
      console.error("[DEPOSIT] Transaction already used", { transactionHash });
      return NextResponse.json({ error: "Transaction already used" }, { status: 400 });
    }

    // 4. Enforce global deposit rate limit (across all teams)
    const { data: lastDeposit } = await supabase
      .from("deposits")
      .select("created_at")
      .eq("user_fid", user.fid)
      .eq("game_id", game.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (lastDeposit) {
      const last = new Date(lastDeposit.created_at).getTime();
      const now = Date.now();
      if (now - last < 60 * 1000) { // 1 minute rule (for testing)
        console.error("[DEPOSIT] Deposit too soon (global 1/min rule)", { lastDeposit, now });
        return NextResponse.json({ error: "You can only deposit $1 per minute (testing only)." }, { status: 403 });
      }
    }

    // 5. Verify onchain transaction
    const isValid = await verifyOnchainUSDCDeposit({ transactionHash, userEthAddress: dbUser.primary_eth_address });
    if (!isValid) {
      console.error("[DEPOSIT] Onchain verification failed", { transactionHash, userEthAddress: dbUser.primary_eth_address });
      return NextResponse.json({ error: "Onchain verification failed" }, { status: 400 });
    }

    let team_id = incomingTeamId;
    let team;
    // 6. If no team_id, create a new team and add user as owner/member
    if (!team_id) {
      // Check if the provided team_name is already used
      let finalTeamName = team_name;
      if (finalTeamName) {
        const { count: nameCount } = await supabase
          .from("teams")
          .select("id", { count: "exact", head: true })
          .eq("team_name", finalTeamName);
        if ((nameCount ?? 0) > 0) {
          // Name already used, fallback to random 5-digit number
          finalTeamName = `Team #${Math.floor(10000 + Math.random() * 90000)}`;
        }
      } else {
        finalTeamName = `Team #${Math.floor(10000 + Math.random() * 90000)}`;
      }
      const { data: newTeam, error: teamError } = await supabase
        .from("teams")
        .insert({
          game_id: game.id,
          owner_fid: user.fid,
          team_name: finalTeamName,
          is_active: true,
        })
        .select()
        .single();
      if (teamError || !newTeam) {
        console.error("[DEPOSIT] Team creation error", { teamError });
        return NextResponse.json({ error: teamError?.message || "Failed to create team" }, { status: 500 });
      }
      team_id = newTeam.id;
      team = newTeam;
    } else {
      // Fetch the team for return value
      const { data: existingTeam, error: fetchTeamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", team_id)
        .single();
      if (fetchTeamError || !existingTeam) {
        console.error("[DEPOSIT] Team fetch error", { fetchTeamError });
        return NextResponse.json({ error: fetchTeamError?.message || "Team not found" }, { status: 404 });
      }
      team = existingTeam;
    }

    // 7. Add user to team_members if not already present
    const { count: memberCount } = await supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("user_fid", user.fid)
      .eq("team_id", team_id);
    if ((memberCount ?? 0) === 0) {
      await supabase.from("team_members").insert({
        user_fid: user.fid,
        team_id,
        joined_at: new Date().toISOString(),
        role: team.owner_fid === user.fid ? "owner" : "member",
      });
    }

    // 8. Insert deposit
    const { data: deposit, error: depositError } = await supabase
      .from("deposits")
      .insert({
        user_fid: user.fid,
        team_id,
        game_id: game.id,
        amount: 1,
        created_at: new Date().toISOString(),
        transaction_hash: transactionHash,
        // points_earned will be calculated below
      })
      .select()
      .single();
    if (depositError) {
      console.error("[DEPOSIT] Supabase insert error", { depositError });
      return NextResponse.json({ error: depositError.message }, { status: 500 });
    }

    // 8.1. Update game pot_amount (sum of all deposits for this game)
    const { data: potSumResult, error: potSumError } = await supabase
      .from("deposits")
      .select("amount")
      .eq("game_id", game.id);
    if (potSumError) {
      console.error("[DEPOSIT] Error calculating game pot sum", { potSumError });
    } else {
      const potAmount = (potSumResult || []).reduce((sum, d) => sum + (d.amount || 0), 0);
      await supabase
        .from("games")
        .update({ pot_amount: potAmount })
        .eq("id", game.id);
    }

    // 9. Calculate chain size and multiplier
    const { count: chainLength } = await supabase
      .from("deposits")
      .select("id", { count: "exact", head: true })
      .eq("team_id", team_id)
      .eq("game_id", game.id);
    let chain_multiplier = 1;
    if (chainLength && chainLength <= 5) chain_multiplier = 5;
    else if (chainLength && chainLength <= 10) chain_multiplier = 3;
    else if (chainLength && chainLength <= 15) chain_multiplier = 2;

    // 10. Calculate points (now includes Neynar score)
    // Fetch user's neynar_score from users table
    const { data: userRow } = await supabase
      .from("users")
      .select("neynar_score")
      .eq("fid", user.fid)
      .single();
    const neynarScore = userRow?.neynar_score ?? 1;
    const points_earned = 1 * chain_multiplier * neynarScore;

    // 11. Update deposit with points_earned
    await supabase
      .from("deposits")
      .update({ points_earned })
      .eq("id", deposit.id);

    // 12. Get the sum of team points from the RPC
    const { data: sumPoints, error: sumPointsError } = await supabase
      .rpc('sum_team_points', { teamid: team_id, gameid: game.id });
    if (sumPointsError) {
      console.error("[DEPOSIT] sum_team_points RPC error", { sumPointsError });
      return NextResponse.json({ error: sumPointsError.message }, { status: 500 });
    }

    // 13. Update team stats
    const { data: updatedTeam, error: teamUpdateError } = await supabase
      .from("teams")
      .update({
        chain_length: chainLength,
        chain_multiplier,
        total_points: sumPoints,
        total_deposits: chainLength,
      })
      .eq("id", team_id)
      .select()
      .single();
    if (teamUpdateError) {
      console.error("[DEPOSIT] Team update error", { teamUpdateError });
      return NextResponse.json({ error: teamUpdateError.message }, { status: 500 });
    }

    // 14. Return deposit, team, and shareable link
    const shareableLink = `/team/${team_id}`;
    return NextResponse.json({ deposit: { ...deposit, points_earned }, team: updatedTeam, shareableLink });
  } catch (err) {
    console.error("[DEPOSIT] Unexpected error in /api/deposits/create", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 