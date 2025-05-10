import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseUnits, Interface, JsonRpcProvider } from 'ethers';

// USDC contract address on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
// Dollarchain treasury address
const TREASURY_ADDRESS = '0x638d7b6b585F2e248Ecbbc84047A96FD600e204E'.toLowerCase();
// 1 USDC in 6 decimals
const MIN_AMOUNT = parseUnits('1', 6);

// Minimal ERC20 ABI for Transfer event
const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// Use Base mainnet RPC
const BASE_RPC = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const provider = new JsonRpcProvider(BASE_RPC);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[WAITLIST] Incoming request body:', body);
    const { fid, transactionHash } = body;
    
    if (!fid || typeof fid !== 'number' || !transactionHash) {
      console.error('[WAITLIST] 400 error: Invalid or missing fid or transactionHash', { fid, transactionHash });
      return NextResponse.json(
        { success: false, error: 'Invalid or missing fid or transactionHash', received: { fid, transactionHash } },
        { status: 400 }
      );
    }

    // Fetch the transaction receipt
    let receipt;
    try {
      receipt = await provider.getTransactionReceipt(transactionHash);
      if (!receipt) throw new Error('No receipt found');
    } catch (err) {
      console.error('[WAITLIST] 400 error: Could not fetch transaction receipt', { transactionHash, err });
      return NextResponse.json(
        { success: false, error: 'Could not fetch transaction receipt', transactionHash },
        { status: 400 }
      );
    }

    // Check for USDC Transfer to treasury in logs
    const usdcInterface = new Interface(ERC20_ABI);
    let validTransfer = false;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
        try {
          const parsed = usdcInterface.parseLog(log);
          if (
            parsed &&
            parsed.name === 'Transfer' &&
            parsed.args.to.toLowerCase() === TREASURY_ADDRESS &&
            parsed.args.value.gte(MIN_AMOUNT)
          ) {
            validTransfer = true;
            break;
          }
        } catch (err) {
          console.error('[WAITLIST] Error parsing log:', { log, err });
        }
      }
    }

    if (!validTransfer) {
      console.error('[WAITLIST] 400 error: No valid USDC transfer of at least 1 USDC to treasury found in transaction.', { transactionHash });
      return NextResponse.json(
        { success: false, error: 'No valid USDC transfer of at least 1 USDC to treasury found in transaction.', transactionHash },
        { status: 400 }
      );
    }

    // Check if user exists first
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('fid')
      .eq('fid', fid)
      .single();
    
    let result;
    
    if (existingUser) {
      // Update existing user
      result = await supabaseAdmin
        .from('users')
        .update({ 
          waitlist: true,
          updated_at: new Date().toISOString()
        })
        .eq('fid', fid);
    } else {
      console.error('[WAITLIST] 404 error: User not found', { fid });
      return NextResponse.json(
        { success: false, error: 'User not found', fid },
        { status: 404 }
      );
    }
    
    if (result.error) {
      console.error('[WAITLIST] 500 error: Supabase update error', { error: result.error });
      throw result.error;
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'User waitlist status updated'
    });
  } catch (error) {
    console.error('[WAITLIST] 500 error: Exception thrown', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update waitlist status', details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
} 