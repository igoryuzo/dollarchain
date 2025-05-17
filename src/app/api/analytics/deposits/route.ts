import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // First, get the earliest deposit
    const { data: earliestDeposit, error: earliestError } = await supabase
      .from("deposits")
      .select("created_at")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (earliestError) {
      console.error("Error fetching earliest deposit:", earliestError);
      return NextResponse.json({ error: earliestError.message }, { status: 500 });
    }

    if (!earliestDeposit) {
      return NextResponse.json({ 
        labels: [], 
        data: [], 
        totalDeposits: 0,
        message: "No deposits found" 
      });
    }

    // Set window start to the earliest deposit time
    const windowStart = new Date(earliestDeposit.created_at);
    
    // Set window end to 48 hours after the first deposit
    const windowEnd = new Date(windowStart.getTime() + 48 * 60 * 60 * 1000);
    
    // Fetch all deposits within the 48-hour window from first deposit
    const { data: deposits, error } = await supabase
      .from("deposits")
      .select("created_at")
      .gte("created_at", windowStart.toISOString())
      .lte("created_at", windowEnd.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching deposits:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group deposits by hour
    const hourlyDeposits: Record<string, number> = {};
    
    // Initialize all hours in the 48-hour window with 0 deposits
    for (let i = 0; i < 48; i++) {
      const hourDate = new Date(windowStart.getTime() + i * 60 * 60 * 1000);
      // Store full ISO string as key but use it for grouping only by hour
      const hourKey = hourDate.toISOString().split(':')[0] + ':00:00Z'; // Format: YYYY-MM-DDTHH:00:00Z
      hourlyDeposits[hourKey] = 0;
    }
    
    // Count deposits for each hour
    deposits?.forEach(deposit => {
      const depositDate = new Date(deposit.created_at);
      // Get the start of the hour to match our keys
      const hourKey = depositDate.toISOString().split(':')[0] + ':00:00Z'; // Format: YYYY-MM-DDTHH:00:00Z
      
      if (hourlyDeposits[hourKey] !== undefined) {
        hourlyDeposits[hourKey]++;
      }
    });

    // Convert to arrays for the chart
    const labels = Object.keys(hourlyDeposits).map(hourKey => {
      // Format hour labels to be more readable
      // Use the full ISO string which will parse correctly
      const date = new Date(hourKey);
      return date.toLocaleString(undefined, {
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric'
      });
    });
    
    const dataPoints = Object.values(hourlyDeposits);

    return NextResponse.json({
      labels,
      data: dataPoints,
      totalDeposits: deposits?.length || 0,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString()
    });
  } catch (error) {
    console.error("Unexpected error in deposits analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposit analytics" },
      { status: 500 }
    );
  }
} 