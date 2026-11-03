import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cursus Japans — judo-woorden leren met geluid",
  description:
    "Interactieve cursus Japanse judotermen: flashcards met echte Japanse uitspraak, quiz per band en een printbaar certificaat. Zelfgebouwd, draait volledig in de browser.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
