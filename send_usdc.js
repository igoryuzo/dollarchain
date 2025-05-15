const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = 'https://api.neynar.com/v2/farcaster/transaction/send';
const API_KEY = 'D2C8572D-AD5B-4351-95D6-DF65FC666BC9';
const WALLET_ID = 'g739p3lvz7xxrq221yheh14p';
const TOKEN_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const AMOUNT = 1.0;
const NETWORK = 'base';

// All FIDs in a single array
const fids = [
  4905,191042,15994,13874,12778,326336,11539,7690,227539,18586,196519,460170,11528,238564,872898,10956,491626,237884,394081,6591,13676,1077224,273708,14206,265785,196957,1020,863091,508591,428431,205525,1075966,8685,303267,292354,242090,12,1025650,685132,284414,326702,1049927,979826,3828,417851,9204,444033,431336,277366,10178,1628,13596,217248,5543,899355,1038572,317501,482183,241060,628100,311715,474514,189830,5874,13796,345497,461719,365209,13536,246905,802566,461523,296687,405690,1568,862173,18975,193370,1025264,417832,203754,3,9856,1001428,3887,189896,1019643,1026746,3621,465832,357287,432341,234663,21024,2211,191,5431,5713,845620,23091,234616,266490,279037,719715,918783,256450,391444,1007423,308045,5062,991976,510831,7212,20701,535389,289893,7418,194,245042,2350,396217,1237,347833,1711,1071223,16509,2242,914368,932921,431113,228126,2802,340914,516392,5492,397392,442167,14611,1001267,261648,193010,899327,293332,327398,198465,291686,313411,129,239748,880558,340678,1013764,256406,917347,1046533,1045258,16715,511063,950645,17714,864405,480793,420678,13837
];

// Format all FIDs as a single request
const send_to = fids.map(fid => ({
  fid,
  amount: AMOUNT,
  network: NETWORK,
  token_contract_address: TOKEN_CONTRACT
}));

async function sendAllFids() {
  try {
    console.log(`Sending USDC to ${fids.length} FIDs...`);
    
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': API_KEY,
        'x-wallet-id': WALLET_ID
      },
      body: JSON.stringify({ send_to })
    });

    const data = await res.json();
    console.log('Response:', data);
    console.log(`Sent USDC to ${fids.length} FIDs!`);
  } catch (err) {
    console.error('Error sending USDC:', err);
  }
}

// Execute the function
sendAllFids(); 