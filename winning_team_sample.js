import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

dotenv.config();

// Simulation flag - set to true to only simulate without sending transactions
const DRY_RUN = false;

// Neynar API and wallet details
const API_URL = 'https://api.neynar.com/v2/farcaster/fungible/send';
const API_KEY = 'D2C8572D-AD5B-4351-95D6-DF65FC666BC9';
const WALLET_ID = 'g739p3lvz7xxrq221yheh14p';
const TOKEN_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const NETWORK = 'base';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration values
const TEAM_ID = 94;
const POT_AMOUNT = 32; // Set this to the actual pot amount for team 30

async function calculateAndSendPayouts() {
  try {
    console.log(`Calculating payouts for team ${TEAM_ID}...`);
    
    // Get all deposits for team 30
    const { data: deposits, error: depositsError } = await supabase
      .from('deposits')
      .select('user_fid, amount')
      .eq('team_id', TEAM_ID);
    
    if (depositsError) throw depositsError;
    if (!deposits || deposits.length === 0) {
      console.log(`No deposits found for team ${TEAM_ID}`);
      return;
    }
    
    // Calculate total deposits for the team
    const teamTotal = deposits.reduce((sum, deposit) => sum + Number(deposit.amount || 0), 0);
    
    // Group deposits by user_fid and calculate total deposit per user
    const userDeposits = {};
    deposits.forEach(deposit => {
      const fid = deposit.user_fid;
      const amount = Number(deposit.amount || 0);
      userDeposits[fid] = (userDeposits[fid] || 0) + amount;
    });
    
    // Calculate payout for each user based on the formula from TeamPageClient.tsx
    const payouts = Object.entries(userDeposits).map(([fid, totalDeposit]) => {
      const payoutAmount = Number(POT_AMOUNT) * (Number(totalDeposit) / Number(teamTotal));
      return {
        fid: Number(fid),
        amount: parseFloat(payoutAmount.toFixed(2)) // Round to 2 decimal places
      };
    });
    
    console.log(`Calculated payouts for ${payouts.length} users in team ${TEAM_ID}`);
    console.log('Payouts:', JSON.stringify(payouts, null, 2));
    
    // Print detailed breakdown for each user
    console.log('\nDetailed breakdown:');
    Object.entries(userDeposits).forEach(([fid, totalDeposit]) => {
      const percentage = (Number(totalDeposit) / Number(teamTotal) * 100).toFixed(2);
      const payoutAmount = Number(POT_AMOUNT) * (Number(totalDeposit) / Number(teamTotal));
      console.log(`FID ${fid}: ${totalDeposit} USDC deposits (${percentage}% of team) → Payout: ${payoutAmount.toFixed(2)} USDC`);
    });
    
    if (DRY_RUN) {
      console.log('\n*** DRY RUN MODE - No transactions sent ***');
      console.log(`Would send ${payouts.length} payments totaling ${payouts.reduce((sum, p) => sum + p.amount, 0).toFixed(2)} USDC`);
      return;
    }
    
    // Send the payouts via Neynar API
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': API_KEY,
        'x-wallet-id': WALLET_ID
      },
      body: JSON.stringify({
        network: NETWORK,
        fungible_contract_address: TOKEN_CONTRACT,
        recipients: payouts
      })
    });

    const data = await res.json();
    console.log('API Response:', data);
    if (data.send_receipts && Array.isArray(data.send_receipts) && data.send_receipts.every(r => r.status === 'sent')) {
      console.log(`Successfully sent payouts to ${payouts.length} users in team ${TEAM_ID}!`);
    } else {
      const errorMsg = data.send_receipts?.find(r => r.status !== 'sent')?.reason || 'Unknown error';
      console.error(`Transaction failed: ${errorMsg}`);
    }
  } catch (err) {
    console.error('Error calculating and sending payouts:', err);
  }
}

// Execute the function
calculateAndSendPayouts();