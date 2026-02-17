import type { Metadata } from "next";
import "./globals.css";
import "@multi-game-engines/ui-react/dist/index.css";

export const metadata: Metadata = {
  title: "Zenith Hybrid Analysis Dashboard",
  description: "Advanced game engine analysis powered by multi-game-engines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
