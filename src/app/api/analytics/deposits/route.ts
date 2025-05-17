import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Calculate the timestamp for 48 hours ago
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    // Fetch all deposits from the last 48 hours
    const { data: deposits, error } = await supabase
      .from("deposits")
      .select("created_at")
      .gte("created_at", fortyEightHoursAgo.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching deposits:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group deposits by hour
    const hourlyDeposits: Record<string, number> = {};
    
    // Initialize all hours in the 48-hour window with 0 deposits
    for (let i = 0; i < 48; i++) {
      const hourDate = new Date(fortyEightHoursAgo.getTime() + i * 60 * 60 * 1000);
      const hourKey = hourDate.toISOString().slice(0, 13); // Format: YYYY-MM-DDTHH
      hourlyDeposits[hourKey] = 0;
    }
    
    // Count deposits for each hour
    deposits?.forEach(deposit => {
      const depositDate = new Date(deposit.created_at);
      const hourKey = depositDate.toISOString().slice(0, 13); // Format: YYYY-MM-DDTHH
      
      if (hourlyDeposits[hourKey] !== undefined) {
        hourlyDeposits[hourKey]++;
      }
    });

    // Convert to arrays for the chart
    const labels = Object.keys(hourlyDeposits).map(hourKey => {
      // Format hour labels to be more readable
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
      totalDeposits: deposits?.length || 0
    });
  } catch (error) {
    console.error("Unexpected error in deposits analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposit analytics" },
      { status: 500 }
    );
  }
} 