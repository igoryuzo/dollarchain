import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata() {
  const { headers } = await import("next/headers");
  const headersObj = await headers();
  const host = headersObj.get("host") || "";
  const isStaging = host.startsWith("staging.");
  const baseUrl = isStaging
    ? "https://staging.dollarchain.xyz"
    : "https://www.dollarchain.xyz";

  return {
    title: "Dollarchain - A social coordination game.",
    description: "A social coordination game.",
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: "Dollarchain - A social coordination game.",
      description: "A social coordination game.",
      url: baseUrl + "/",
      siteName: "Dollarchain",
      images: [
        {
          url: `${baseUrl}/images/dollarchain-logo.png`,
          width: 1200,
          height: 630,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: `${baseUrl}/images/dollarchain-logo.png`,
        button: {
          title: "Join Waitlist",
          action: {
            type: "launch_frame",
            name: "Dollarchain",
            url: baseUrl + "/",
            splashImageUrl: `${baseUrl}/images/dollarchain-logo.png`,
            splashBackgroundColor: "#ffffff",
          },
        },
      }),
    },
    manifest: "/.well-known/farcaster.json",
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
