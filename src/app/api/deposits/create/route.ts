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
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const user = getServerUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { team_id, transactionHash } = await req.json();
  if (!team_id || !transactionHash) return NextResponse.json({ error: "Missing team_id or transactionHash" }, { status: 400 });

  // 1. Find the current active game
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("status", "active")
    .single();
  if (gameError || !game) {
    return NextResponse.json({ error: "No active game found" }, { status: 400 });
  }

  // 2. Get user's ETH address
  const { data: dbUser } = await supabase
    .from("users")
    .select("primary_eth_address")
    .eq("fid", user.fid)
    .single();
  if (!dbUser?.primary_eth_address) {
    return NextResponse.json({ error: "User ETH address not found" }, { status: 400 });
  }

  // 3. Check if transactionHash already used
  const { count: txCount } = await supabase
    .from("deposits")
    .select("id", { count: "exact", head: true })
    .eq("game_id", game.id)
    .eq("transaction_hash", transactionHash);
  if ((txCount ?? 0) > 0) {
    return NextResponse.json({ error: "Transaction already used" }, { status: 400 });
  }

  // 4. Verify onchain transaction
  const isValid = await verifyOnchainUSDCDeposit({ transactionHash, userEthAddress: dbUser.primary_eth_address });
  if (!isValid) {
    return NextResponse.json({ error: "Onchain verification failed" }, { status: 400 });
  }

  // 5. Check user's last deposit for this game
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
    if (now - last < 60 * 60 * 1000) {
      return NextResponse.json({ error: "You can only deposit $1 per hour." }, { status: 403 });
    }
  }

  // 6. Enforce 48 deposits/game rule
  const { count: depositCount } = await supabase
    .from("deposits")
    .select("id", { count: "exact", head: true })
    .eq("user_fid", user.fid)
    .eq("game_id", game.id);
  if ((depositCount ?? 0) >= 48) {
    return NextResponse.json({ error: "You have reached the maximum of 48 deposits for this game." }, { status: 403 });
  }

  // 7. Insert deposit
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
    return NextResponse.json({ error: depositError.message }, { status: 500 });
  }

  // 8. Calculate chain size and multiplier
  const { count: chainLength } = await supabase
    .from("deposits")
    .select("id", { count: "exact", head: true })
    .eq("team_id", team_id)
    .eq("game_id", game.id);
  let chain_multiplier = 1;
  if (chainLength && chainLength <= 5) chain_multiplier = 5;
  else if (chainLength && chainLength <= 10) chain_multiplier = 3;
  else if (chainLength && chainLength <= 15) chain_multiplier = 2;

  // 9. Calculate points (no Neynar score for now)
  const points_earned = 1 * chain_multiplier;

  // 10. Update deposit with points_earned
  await supabase
    .from("deposits")
    .update({ points_earned })
    .eq("id", deposit.id);

  // 11. Update team stats
  const { data: team } = await supabase
    .from("teams")
    .update({
      chain_length: chainLength,
      chain_multiplier,
      total_points: supabase.rpc('sum_team_points', { teamid: team_id, gameid: game.id }),
      total_deposits: chainLength,
    })
    .eq("id", team_id)
    .select()
    .single();

  return NextResponse.json({ deposit: { ...deposit, points_earned }, team });
} 