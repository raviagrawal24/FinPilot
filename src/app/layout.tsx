import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinPilot AI - AI-Powered Personal Financial Health Assistant",
  description: "Analyze income, expenses, transactions, liabilities & goals with explainable AI financial health recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#06040a] text-slate-100 antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
