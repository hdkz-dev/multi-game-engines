import type { Metadata } from "next";
import "./globals.css";
import { EngineUIProvider } from "@multi-game-engines/ui-react";
import { locales } from "@multi-game-engines/i18n";
import "@multi-game-engines/ui-react/dist/index.css";

export const metadata: Metadata = {
  title: "Zenith Hybrid Analysis Dashboard",
  description: "Advanced game engine analysis powered by multi-game-engines",
};

const enStrings = locales.en;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <EngineUIProvider localeData={enStrings}>{children}</EngineUIProvider>
      </body>
    </html>
  );
}
