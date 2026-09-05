import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spidey Finder",
  description: "Find Spidey",
};

export default function RootLayout({children}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Press+Start+2P&family=Silkscreen:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}