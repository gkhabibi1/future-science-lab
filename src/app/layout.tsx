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
  title: "LABSAINS - Platform Simulasi Praktikum Virtual Interaktif",
  description: "Laboratorium sains virtual berbasis AI untuk praktikum Fisika, Kimia, dan Biologi interaktif SD, SMP, dan SMA.",
  icons: {
    icon: "https://ik.imagekit.io/e2yna5qg8/ChatGPT_Image_Sep_5__2026__11_56_23_AM-removebg-preview.png",
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
