import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProofPing",
  description: "Send specific outreach with proof, not generic AI spam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
