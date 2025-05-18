import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

dotenv.config();

// Simulation flag - set to true to only simulate without sending transactions
const DRY_RUN = false;

// Bonus multiplier (1.5 = 50% bonus)
const BONUS_MULTIPLIER = 1.5;

// Neynar API and wallet details
const API_URL = 'https://api.neynar.com/v2/farcaster/transaction/send';
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
const TEAM_ID = 45;

async function sendWithRetry(refunds, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1} - Sending refunds to ${refunds.length} users...`);
      
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': API_KEY,
          'x-wallet-id': WALLET_ID
        },
        body: JSON.stringify({ send_to: refunds })
      });

      const data = await res.json();
      console.log('API Response:', data);
      
      // Check for success
      if (data.transactions && data.transactions[0] && data.transactions[0].isSuccess) {
        console.log(`Successfully sent refunds to ${refunds.length} users in team ${TEAM_ID}!`);
        return true;
      } else {
        const errorMsg = data.transactions?.[0]?.error || 'Unknown error';
        console.error(`Transaction failed: ${errorMsg}`);
        
        // If nonce issue, wait and retry
        if (errorMsg.includes('nonce too low') || errorMsg.includes('nonce')) {
          console.log(`Nonce issue detected. Waiting 5 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          retries++;
        } else {
          // Other error, stop retrying
          return false;
        }
      }
    } catch (err) {
      console.error('Error sending refunds:', err);
      retries++;
      console.log(`Retrying in 5 seconds... (Attempt ${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }
  }
  
  console.error(`Failed to send refunds after ${maxRetries} attempts.`);
  return false;
}

async function processAndSendRefunds() {
  try {
    console.log(`Processing refunds for team ${TEAM_ID}...`);
    
    // Get all deposits for team 45
    const { data: deposits, error: depositsError } = await supabase
      .from('deposits')
      .select('user_fid, amount')
      .eq('team_id', TEAM_ID);
    
    if (depositsError) throw depositsError;
    if (!deposits || deposits.length === 0) {
      console.log(`No deposits found for team ${TEAM_ID}`);
      return;
    }
    
    // Group deposits by user_fid to get total deposit per user
    const userDeposits = {};
    deposits.forEach(deposit => {
      const fid = deposit.user_fid;
      const amount = Number(deposit.amount || 0);
      userDeposits[fid] = (userDeposits[fid] || 0) + amount;
    });
    
    // Create refund objects - each user gets back exactly what they deposited plus bonus
    const refunds = Object.entries(userDeposits).map(([fid, totalDeposit]) => {
      // Apply bonus multiplier to the deposit amount
      const refundAmount = Number(totalDeposit) * BONUS_MULTIPLIER;
      return {
        fid: Number(fid),
        amount: Number(refundAmount.toFixed(2)), // Round to 2 decimal places
        network: NETWORK,
        token_contract_address: TOKEN_CONTRACT
      };
    });
    
    console.log(`Prepared refunds for ${refunds.length} users in team ${TEAM_ID}`);
    console.log('Refunds:', JSON.stringify(refunds, null, 2));
    
    // Print detailed breakdown for each user
    console.log('\nDetailed breakdown:');
    Object.entries(userDeposits).forEach(([fid, totalDeposit]) => {
      const bonusAmount = (totalDeposit * BONUS_MULTIPLIER) - totalDeposit;
      const totalRefund = totalDeposit * BONUS_MULTIPLIER;
      console.log(`FID ${fid}: Deposited ${totalDeposit} USDC → Refund: ${totalDeposit} USDC + ${bonusAmount.toFixed(2)} USDC bonus = ${totalRefund.toFixed(2)} USDC total`);
    });
    
    // Calculate total refund amount
    const totalRefundAmount = refunds.reduce((sum, r) => sum + r.amount, 0);
    console.log(`\nTotal refund amount: ${totalRefundAmount} USDC for ${refunds.length} users`);
    
    if (DRY_RUN) {
      console.log('\n*** DRY RUN MODE - No transactions sent ***');
      console.log(`Would send ${refunds.length} refunds totaling ${totalRefundAmount} USDC`);
      return;
    }
    
    // Send the refunds
    await sendWithRetry(refunds);
  } catch (err) {
    console.error('Error processing and sending refunds:', err);
  }
}

// Execute the function
processAndSendRefunds(); 