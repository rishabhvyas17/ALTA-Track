import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ALTA Track — DSA Challenge Platform",
  description:
    "Track your progress in ALTA APEX 151 and BASE 111 DSA challenges. Build consistency, grow your skills, and earn recognition.",
  keywords: ["DSA", "coding challenge", "ALTA", "APEX 151", "BASE 111", "LeetCode"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunitoSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-nunito-sans), 'Nunito Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
