"use client";

import React, { createContext, use, useEffect, useState } from "react";
import "./globals.css";
import "@multi-game-engines/ui-react/index.css";

type Locale = "en" | "ja";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ja");

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LanguageContext value={{ locale, setLocale }}>{children}</LanguageContext>
  );
}

export function useLocale() {
  const context = use(LanguageContext);
  if (!context) {
    throw new Error("useLocale must be used within a LanguageProvider");
  }
  return context;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initial lang attribute based on default state
  return (
    <html lang="ja">
      <body className="antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
