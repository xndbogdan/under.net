import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const dseg14 = localFont({
  src: "../assets/fonts/DSEG14Classic-Regular.woff2",
  weight: "400",
  variable: "--font-dseg14",
  display: "swap",
  fallback: ["monospace"],
});

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
      <body className={`${inter.className} ${dseg14.variable} ${defaultStyles}`}>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
