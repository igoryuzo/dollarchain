import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dollarchain - A social coordination game.",
  description: "A social coordination game.",
  metadataBase: new URL('https://www.dollarchain.xyz/'),
  openGraph: {
    title: "Dollarchain - A social coordination game.",
    description: "A social coordination game.",
    url: 'https://www.dollarchain.xyz/',
    siteName: 'Dollarchain',
    images: [
      {
        url: 'https://www.dollarchain.xyz/images/dollarchain-logo.png',
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
      imageUrl: "https://www.dollarchain.xyz/images/dollarchain-logo.png",
      button: {
        title: "Join Waitlist",
        action: {
          type: "launch_frame",
          name: "Dollarchain",
          url: "https://www.dollarchain.xyz/",
          splashImageUrl: "https://www.dollarchain.xyz/images/dollarchain-logo.png",
          splashBackgroundColor: "#ffffff"
        }
      }
    })
  },
  manifest: "/.well-known/farcaster.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
