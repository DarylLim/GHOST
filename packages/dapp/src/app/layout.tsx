import type { Metadata } from "next";
import { SuiProvider } from "@/providers/SuiProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "GHOST — Guided Heuristic Onboard Survival Tactician",
  description: "AI survival companion for EVE Frontier",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen">
        <SuiProvider>{children}</SuiProvider>
      </body>
    </html>
  );
}
