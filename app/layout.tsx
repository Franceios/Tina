import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tinnah Collections",
  description: "Luxury e-commerce storefront and admin management platform for Tinnah Collections.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--bg)] text-[var(--text)]">{children}</body>
    </html>
  );
}
