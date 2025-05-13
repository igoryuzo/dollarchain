import TeamPageClient from "./TeamPageClient";

export async function generateMetadata({ params }: { params: Promise<{ team_id: string }> }) {
  const { team_id } = await params;
  const APP_URL = "https://www.dollarchain.xyz/";
  let teamName = "Dollarchain Team";
  let ownerFid = null;
  try {
    const res = await fetch(`${APP_URL}api/teams/get?team_id=${team_id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.team) {
        teamName = data.team.team_name || teamName;
        ownerFid = data.team.owner_fid;
      }
    }
  } catch {}
  const imageUrl = ownerFid ? `${APP_URL}api/opengraph-image?fid=${ownerFid}` : `${APP_URL}images/dollarchain-logo.png`;
  return {
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
}

export default async function TeamPage({ params }: { params: Promise<{ team_id: string }> }) {
  const { team_id } = await params;
  return <TeamPageClient teamId={team_id} />;
} 