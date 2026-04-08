import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const defaultStyles = ``;
export const metadata: Metadata = {
  title: "under.net",
  description: "buy the under.net merch",
  applicationName: "under.net",
  keywords: [
    "under.net",
    "music",
    "playlist",
    "merch",
    "underground",
    "soundcloud",
  ],
  metadataBase: new URL("https://under-net.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${defaultStyles}`}>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
