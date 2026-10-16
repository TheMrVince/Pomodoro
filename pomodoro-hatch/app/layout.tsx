import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const nunito = Nunito({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hatch",
  description: "Focus for 30 minutes. Hatch something cozy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${nunito.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}