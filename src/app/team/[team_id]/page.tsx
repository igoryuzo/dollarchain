import TeamPageClient from "./TeamPageClient";
import { cookies } from "next/headers";
import { getServerUser } from "@/lib/auth";

export async function generateMetadata({ params }: { params: Promise<{ team_id: string }> }) {
  const { team_id } = await params;
  const APP_URL = "https://www.dollarchain.xyz/";
  let teamName = "Dollarchain Team";
  let ownerFid = null;
  console.log("[generateMetadata] APP_URL:", APP_URL);
  console.log("[generateMetadata] team_id:", team_id);
  try {
    const res = await fetch(`${APP_URL}api/teams/get?team_id=${team_id}`);
    console.log("[generateMetadata] fetch URL:", `${APP_URL}api/teams/get?team_id=${team_id}`);
    if (res.ok) {
      const data = await res.json();
      console.log("[generateMetadata] data.team:", data.team);
      if (data.team) {
        teamName = data.team.team_name || teamName;
        ownerFid = data.team.owner_fid;
      }
    } else {
      console.log("[generateMetadata] fetch not ok, status:", res.status);
    }
  } catch (err) {
    console.log("[generateMetadata] fetch error:", err);
  }
  const imageUrl = ownerFid && team_id
    ? `${APP_URL}api/opengraph-image?fid=${ownerFid}&team_id=${team_id}`
    : `${APP_URL}images/dollarchain-logo.png`;
  console.log("[generateMetadata] teamName:", teamName);
  console.log("[generateMetadata] ownerFid:", ownerFid);
  console.log("[generateMetadata] imageUrl:", imageUrl);
  const meta = {
    title: `Join ${teamName} on Dollarchain`,
    description: `Join this team chain and help us win the pot!`,
    openGraph: {
      title: `Join ${teamName} on Dollarchain`,
      description: `Join this team chain and help us win the pot!`,
      url: `${APP_URL}team/${team_id}`,
      siteName: 'Dollarchain',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
        }
      ],
      locale: 'en_US',
      type: 'website',
    },
    other: {
      'fc:frame': JSON.stringify({
        version: "next",
        imageUrl: imageUrl,
        button: {
          title: "Join Team",
          action: {
            type: "launch_frame",
            name: teamName,
            url: `${APP_URL}team/${team_id}`,
            splashImageUrl: "https://www.dollarchain.xyz/images/dollarchain-logo.png",
            splashBackgroundColor: "#ffffff"
          }
        }
      })
    },
  };
  console.log("[generateMetadata] meta:", JSON.stringify(meta, null, 2));
  return meta;
}

export default async function TeamPage({ params }: { params: Promise<{ team_id: string }> }) {
  const { team_id } = await params;
  // Get the current user's FID from the cookie (SSR)
  const cookieStore = await cookies();
  const user = getServerUser(cookieStore);
  const currentFid = user?.fid ?? null;
  return <TeamPageClient teamId={team_id} currentFid={currentFid} />;
} 