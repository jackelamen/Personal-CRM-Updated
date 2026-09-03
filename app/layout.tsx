import type { Metadata, Viewport } from "next";
import { Karla, Newsreader } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

const karla = Karla({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-karla",
});

export const metadata: Metadata = {
  title: "Rolodex — a personal CRM",
  description:
    "Keep track of the people you know: notes, labels, and follow-ups that do not slip.",
};

export const viewport: Viewport = {
  themeColor: "#edf0f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${karla.variable}`}>
      <body className="min-h-dvh antialiased">
        <StoreProvider>
          <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 sm:px-8">
            <SiteNav />
            <main className="flex-1 pb-24 pt-8">{children}</main>
            <footer className="rule py-6 text-xs text-muted">
              Everything is stored in this browser. Export a backup from{" "}
              <span className="font-semibold text-ink">Import &amp; data</span>.
            </footer>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
