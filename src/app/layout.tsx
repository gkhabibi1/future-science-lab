import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LABSAINS | Simulasi Praktikum Virtual Sains Interaktif",
  description: "Platform laboratorium virtual interaktif berbasis AI untuk praktikum Fisika, Kimia, dan Biologi (SD, SMP, SMA).",
  icons: {
    icon: "https://ik.imagekit.io/e2yna5qg8/ChatGPT%20Image%20Sep%205,%202026,%2011_59_16%20AM_11zon.png",
    shortcut: "https://ik.imagekit.io/e2yna5qg8/ChatGPT%20Image%20Sep%205,%202026,%2011_59_16%20AM_11zon.png",
    apple: "https://ik.imagekit.io/e2yna5qg8/ChatGPT%20Image%20Sep%205,%202026,%2011_59_16%20AM_11zon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
