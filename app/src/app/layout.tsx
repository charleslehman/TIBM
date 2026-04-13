import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Texas Title Insurance Manual Assistant",
  description:
    "Ask plain-English questions about the TDI Basic Manual and get accurate answers with specific statute, rule, and form citations. Covers all 8 sections: statutes, rate rules, procedural rules, forms, admin rules, claims, and more.",
  metadataBase: new URL("https://tibm.netlify.app"),
  openGraph: {
    title: "Texas Title Insurance Manual Assistant",
    description:
      "AI-powered reference tool for the TDI Basic Manual. Ask questions, get cited answers from statutes, rate rules, procedural rules, and 60+ official forms.",
    siteName: "Texas Title Insurance Manual Assistant",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Texas Title Insurance Manual Assistant",
    description:
      "AI-powered reference tool for the TDI Basic Manual. Ask questions, get cited answers from statutes, rate rules, procedural rules, and 60+ official forms.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FAFAF9] text-[#1C1917]">
        {children}
      </body>
    </html>
  );
}
