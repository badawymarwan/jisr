import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Providers from "@/components/Providers";
import DemoBanner from "@/components/DemoBanner";

export const metadata: Metadata = {
  title: "Jisr",
  description: "Simple English notes with Arabic help for your university classes.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=Inter:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <Nav />
          <main className="px-4 pb-28 pt-6 md:pb-12 md:pl-[17rem] md:pr-10">
            <div className="mx-auto max-w-3xl">
              <DemoBanner />
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
