import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DollarChain - Farcaster Mini App",
  description: "A Farcaster Mini App with authentication, notifications, and Supabase integration",
  metadataBase: new URL('https://www.dollarchain.xyz/'),
  openGraph: {
    title: "DollarChain - Farcaster Mini App",
    description: "A Farcaster Mini App with authentication, notifications, and Supabase integration",
    url: 'https://www.dollarchain.xyz/',
    siteName: 'DollarChain',
    images: [
      {
        url: 'https://www.dollarchain.xyz/images/cover.png',
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
      imageUrl: "https://www.dollarchain.xyz/images/cover.png",
      button: {
        title: "View Account",
        action: {
          type: "launch_frame",
          name: "DollarChain",
          url: "https://www.dollarchain.xyz/",
          splashImageUrl: "https://www.dollarchain.xyz/images/icon.png",
          splashBackgroundColor: "#0f172a"
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
